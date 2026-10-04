import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ENTITY_DOMAIN_SCHEMAS } from '../shared/domainRegistry.js';
import { NAMED_ENTITY_ADAPTERS, adaptEntityFromNamedSource } from '../namedAdapters.js';
import { NAMED_SOURCE_CONTRACTS } from '../namedSourceContracts.js';
import { createViewer } from '../shared/viewer.js';

const entityArgumentNames = Object.freeze({
  user: 'user', vendor: 'vendor', product: 'product', order: 'order', giftFlow: 'flow',
  cart: 'cart', review: 'review', category: 'category', vendorApplication: 'application',
  commission: 'commission', commissionPaymentRequest: 'request', commissionRule: 'rule',
  report: 'report', adminRequest: 'request', orderAssistance: 'request',
  notification: 'notification', vendorFeedback: 'feedback', deliveryZone: 'zone',
  vendorDeliveryPricing: 'pricing', reminder: 'reminder', vendorActivity: 'activity',
  userReviewRestriction: 'restriction', favorite: 'favorite',
});

const moduleUrl = (entityType, suffix) =>
  new URL(`../${entityType}/${entityType}${suffix}.js`, import.meta.url);

const sourceContractsFor = (entityType) => Object.entries(NAMED_SOURCE_CONTRACTS)
  .filter(([, contract]) => contract.entityType === entityType);

function sourceFixture(contract) {
  const input = {};
  for (const path of contract.fields) {
    const leaf = path.split('.').at(-1);
    if (path === 'facets.vendor.supplierId') input.supplierId = null;
    else if (path === 'facets.admin.permissions') input.permissions = [];
    else if (path === 'facets.admin.isCommunityHelper') input.isCommunityHelper = false;
    else if (path.startsWith('facets.reviewRestriction.')) {
      input.reviewRestriction ??= {};
      input.reviewRestriction[leaf] = null;
    } else if (['images', 'categories', 'items', 'messages'].includes(path)) input[path] = [];
    else input[leaf] = null;
  }
  return input;
}

export function registerAdapterContract(entityType) {
  test(`${entityType}: every named source is canonical, partial-aware, and idempotent`, () => {
    const schema = ENTITY_DOMAIN_SCHEMAS[entityType];
    const contracts = sourceContractsFor(entityType);
    assert.ok(schema, `${entityType} schema`);
    assert.ok(contracts.length > 0, `${entityType} named sources`);
    for (const [name, contract] of contracts) {
      contract.fields.forEach((path) => assert.ok(schema.fields[path], `${name}.${path}`));
      const adapter = NAMED_ENTITY_ADAPTERS[name] || ((input) => adaptEntityFromNamedSource(name, input));
      const model = adapter(sourceFixture(contract));
      assert.equal(model.entityType, entityType, name);
      assert.equal(model.meta.source, name, name);
      assert.equal(model.meta.isPartial, !contract.complete, name);
      contract.fields.forEach((path) => assert.equal(
        model.meta.loadedFields.has(path) || model.meta.derivedFields.has(path),
        true,
        `${name} must load declared field ${path}`,
      ));
      [...model.meta.loadedFields].forEach((path) => assert.equal(
        contract.fields.includes(path) || contract.fields.some((parent) => path.startsWith(`${parent}.`)),
        true,
        `${name} must not load undeclared source field ${path}`,
      ));
      assert.equal(adapter(model), model, `${name} idempotence`);
    }
  });

  test(`${entityType}: unknown source fields stay contained`, () => {
    const [name] = sourceContractsFor(entityType)[0];
    const model = NAMED_ENTITY_ADAPTERS[name]({ phase1UnknownField: 'contained' });
    assert.equal(model.meta.unknownFields.includes('phase1UnknownField'), true);
    assert.equal(Object.hasOwn(model, 'phase1UnknownField'), false);
  });
}

export function registerAccessContract(entityType) {
  test(`${entityType}: access uses normalized viewer, context, ownership, and permission facts`, async () => {
    const module = await import(moduleUrl(entityType, 'Access'));
    const builder = Object.entries(module).find(([name, value]) =>
      /^build.+Access$/.test(name) && typeof value === 'function')?.[1];
    assert.equal(typeof builder, 'function');
    const [sourceName] = sourceContractsFor(entityType)[0];
    const entity = NAMED_ENTITY_ADAPTERS[sourceName]({});
    const argument = entityArgumentNames[entityType];
    const guest = builder({ entity, [argument]: entity, viewer: createViewer(), context: 'PUBLIC' });
    const combinedViewer = createViewer({
      id: 'phase1-user', supplierId: 'phase1-vendor',
      roles: ['ROLE_USER', 'ROLE_VENDOR', 'ROLE_ADMIN', 'SUPER_ADMIN'],
    });
    const privileged = builder({ entity, [argument]: entity, viewer: combinedViewer, context: 'SYSTEM' });
    assert.equal(typeof guest.canRead, 'boolean');
    assert.equal(typeof privileged.canRead, 'boolean');
    assert.ok(guest.permissionSet instanceof Set);
    assert.ok(privileged.permissionSet instanceof Set);
    assert.equal(combinedViewer.isVendor, true);
    assert.equal(combinedViewer.isAdmin, true);
    assert.equal(combinedViewer.isSuperAdmin, true);
  });
}

export function registerActionContract(entityType) {
  test(`${entityType}: actions are suppressed without handlers`, async () => {
    const actionModule = await import(moduleUrl(entityType, 'Actions'));
    const accessModule = await import(moduleUrl(entityType, 'Access'));
    const actionBuilder = Object.entries(actionModule).find(([name, value]) =>
      /^build.+Actions$/.test(name) && typeof value === 'function')?.[1];
    const accessBuilder = Object.entries(accessModule).find(([name, value]) =>
      /^build.+Access$/.test(name) && typeof value === 'function')?.[1];
    assert.equal(typeof actionBuilder, 'function');
    const [sourceName] = sourceContractsFor(entityType)[0];
    const entity = NAMED_ENTITY_ADAPTERS[sourceName]({});
    const argument = entityArgumentNames[entityType];
    const viewer = createViewer({ id: 'phase1-user', supplierId: 'phase1-vendor', roles: ['SUPER_ADMIN'] });
    const access = accessBuilder({ entity, [argument]: entity, viewer, context: 'SYSTEM' });
    assert.deepEqual(actionBuilder({ entity, [argument]: entity, access }), []);
  });

  test(`${entityType}: actions are suppressed when backend identity is unavailable`, async () => {
    const actionModule = await import(moduleUrl(entityType, 'Actions'));
    const actionBuilder = Object.entries(actionModule).find(([name, value]) =>
      /^build.+Actions$/.test(name) && typeof value === 'function')?.[1];
    const [sourceName] = sourceContractsFor(entityType)[0];
    const entity = NAMED_ENTITY_ADAPTERS[sourceName]({});
    const argument = entityArgumentNames[entityType];
    const access = new Proxy({ permissionSet: new Set(['SUPER_ADMIN']) }, { get: (target, key) => target[key] ?? true });
    const handlers = new Proxy({}, { get: () => () => {} });
    assert.deepEqual(actionBuilder({ entity, [argument]: entity, access, handlers }), []);
  });
}

export function registerViewContract(entityType) {
  test(`${entityType}: semantic variants are concrete and stay inside the presentation boundary`, () => {
    const pascal = entityType[0].toUpperCase() + entityType.slice(1);
    const viewPath = resolve(process.cwd(), 'src', 'ui', 'entities', entityType, 'views', `${pascal}SemanticViews.jsx`);
    const selectorPath = resolve(process.cwd(), 'src', 'ui', 'entities', entityType, `${entityType}Selectors.js`);
    const source = readFileSync(viewPath, 'utf8');
    readFileSync(selectorPath, 'utf8');
    ['Summary', 'Card', 'Row', 'Details', 'Workflow']
      .forEach((variant) => assert.match(source, new RegExp(`export function ${pascal}${variant}\\b`)));
    assert.doesNotMatch(source, /services\/|Adapters|fetch\(|axios|ROLE_|permissions\.includes|JSON\.stringify|dangerouslySetInnerHTML/);
  });
}
