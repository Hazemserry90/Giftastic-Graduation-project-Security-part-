import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENTITY_FIELD_STATE,
  createEntityModel,
  getEntityFieldState,
  markEntityFieldInvalid,
  mergeEntityModels,
  readEntityField,
  setEntityValue,
} from '../shared/entityModel.js';
import { EMBEDDED_SCHEMAS, ENTITY_DOMAIN_SCHEMAS, ENTITY_TYPES } from '../shared/domainRegistry.js';
import { ENTITY_ADAPTER_NAMES, NAMED_ENTITY_ADAPTERS, adaptEntityFromNamedSource } from '../namedAdapters.js';
import { PROJECTION_SCHEMAS, adaptProjection } from '../../projections/index.js';
import { COMMAND_SCHEMAS, commandDraftToPayload, createCommandDraft } from '../../commands/index.js';
import { EntityHydrationRepository } from '../shared/entityHydration.js';
import { buildEntityActions } from '../shared/entityActions.js';
import { buildEntityAccess, VIEW_CONTEXT } from '../shared/entityAccess.js';
import { createViewer } from '../shared/viewer.js';
import { adaptReport } from '../report/reportAdapters.js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BACKEND_DOMAIN_CONTRACTS, BACKEND_EMBEDDED_CONTRACTS, BACKEND_ENUM_CONTRACTS } from '../shared/backendContract.js';
import { ADMIN_PERMISSIONS } from '../shared/permissions.js';
import { NAMED_SOURCE_CONTRACTS } from '../namedSourceContracts.js';

test('Phase 1 registry contains exactly 23 exhaustive top-level schemas and mandatory embedded schemas', () => {
  assert.equal(ENTITY_TYPES.length, 23);
  assert.equal(Object.keys(ENTITY_DOMAIN_SCHEMAS).length, 23);
  ['address', 'adminFacet', 'productDetails', 'productImage', 'orderItem', 'guestInfo', 'cartItem', 'orderAssistanceMessage', 'vendorDeliveryPricingId']
    .forEach((name) => assert.ok(EMBEDDED_SCHEMAS[name]));
  assert.equal(Object.keys(EMBEDDED_SCHEMAS.productDetails.fields).length, 57);
});

test('every entity, projection, and command owns the required Phase 1 file structure', () => {
  for (const entityType of ENTITY_TYPES) {
    const root = resolve(process.cwd(), 'src', 'ui', 'entities', entityType);
    ['Schema.js', 'Model.js', 'Adapters.js', 'Access.js', 'Selectors.js', 'Actions.js']
      .forEach((suffix) => assert.equal(existsSync(resolve(root, `${entityType}${suffix}`)), true, `${entityType}${suffix}`));
    const pascal = entityType[0].toUpperCase() + entityType.slice(1);
    assert.equal(existsSync(resolve(root, 'views', `${pascal}SemanticViews.jsx`)), true, `${entityType} semantic views`);
    ['Adapters', 'Access', 'Actions', 'Views']
      .forEach((suffix) => assert.equal(existsSync(resolve(root, '__tests__', `${entityType}${suffix}.test.js`)), true, `${entityType}${suffix} tests`));
  }
  for (const name of Object.keys(PROJECTION_SCHEMAS)) {
    const root = resolve(process.cwd(), 'src', 'ui', 'projections', name);
    const pascal = name[0].toUpperCase() + name.slice(1);
    ['Schema', 'Adapters', 'Selectors']
      .forEach((suffix) => assert.equal(existsSync(resolve(root, `${pascal}${suffix}.js`)), true, `${name}${suffix}`));
    assert.equal(existsSync(resolve(root, '__tests__', `${name}.test.js`)), true, `${name} tests`);
  }
  for (const name of Object.keys(COMMAND_SCHEMAS)) {
    const root = resolve(process.cwd(), 'src', 'ui', 'commands', name);
    const pascal = name[0].toUpperCase() + name.slice(1);
    ['Schema', 'Draft', 'Validation', 'Payload']
      .forEach((suffix) => assert.equal(existsSync(resolve(root, `${pascal}${suffix}.js`)), true, `${name}${suffix}`));
    assert.equal(existsSync(resolve(root, '__tests__', `${name}.test.js`)), true, `${name} tests`);
  }
});

const backendRoot = resolve(process.cwd(), '..', 'src', 'main', 'java', 'com', 'giftastic', 'giftastic');
const javaSource = (relative) => readFileSync(resolve(backendRoot, relative), 'utf8');
const stripJavaComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const javaFields = (relative) => {
  const source = stripJavaComments(javaSource(relative));
  return [...source.matchAll(/\bprivate\s+(?!static\b)[\w.$<>?,\s]+?\s+(\w+)\s*(?:=[^;]*)?;/g)]
    .map((match) => match[1]);
};
const javaEnum = (relative) => {
  const body = stripJavaComments(javaSource(relative)).match(/\benum\s+\w+\s*\{([\s\S]*?)\}/)?.[1] || '';
  return [...body.matchAll(/\b([A-Z][A-Z0-9_]*)\b\s*(?:,|$)/gm)].map((match) => match[1]);
};

test('all 23 schemas mechanically match backend domain fields', () => {
  for (const [entityType, contract] of Object.entries(BACKEND_DOMAIN_CONTRACTS)) {
    assert.deepEqual(javaFields(contract.source).sort(), [...contract.fields, ...(contract.excluded || [])].sort(), entityType);
    for (const field of contract.fields) {
      const canonical = contract.aliases?.[field] || field;
      assert.ok(ENTITY_DOMAIN_SCHEMAS[entityType].fields[canonical], `${entityType}.${canonical}`);
    }
  }
});

test('mandatory embedded schemas mechanically match backend fields', () => {
  for (const [name, contract] of Object.entries(BACKEND_EMBEDDED_CONTRACTS)) {
    const expected = contract.fields || Object.keys(EMBEDDED_SCHEMAS[name].fields);
    assert.deepEqual(javaFields(contract.source).sort(), expected.sort(), name);
    expected.forEach((field) => assert.ok(EMBEDDED_SCHEMAS[name].fields[field], `${name}.${field}`));
  }
});

test('backend enum and permission catalogs fail on drift', () => {
  for (const [name, [source, values]] of Object.entries(BACKEND_ENUM_CONTRACTS)) {
    assert.deepEqual(javaEnum(source).sort(), [...values].sort(), name);
  }
  assert.deepEqual(javaEnum('modules/admin/domain/AdminPermission.java').sort(), [...ADMIN_PERMISSIONS].sort());
});

test('every canonical field has a concrete type, visibility and provenance classification', () => {
  for (const [entityType, definition] of Object.entries(ENTITY_DOMAIN_SCHEMAS)) {
    for (const [path, field] of Object.entries(definition.fields)) {
      assert.notEqual(field.type, 'unknown', `${entityType}.${path}`);
      assert.ok(field.visibility, `${entityType}.${path} visibility`);
      assert.ok(field.provenance, `${entityType}.${path} provenance`);
    }
  }
});

test('shared field state preserves false, zero, empty, unloaded, invalid and forbidden', () => {
  const model = createEntityModel('test', ['flag', 'count', 'items', 'nullable', 'bad']);
  setEntityValue(model, 'flag', false);
  setEntityValue(model, 'count', 0);
  setEntityValue(model, 'items', []);
  setEntityValue(model, 'nullable', null);
  markEntityFieldInvalid(model, 'bad', 'not-a-date', 'Invalid ISO date');
  assert.equal(getEntityFieldState(model, 'flag'), ENTITY_FIELD_STATE.AVAILABLE);
  assert.equal(getEntityFieldState(model, 'count'), ENTITY_FIELD_STATE.AVAILABLE);
  assert.equal(getEntityFieldState(model, 'items'), ENTITY_FIELD_STATE.EMPTY);
  assert.equal(getEntityFieldState(model, 'nullable'), ENTITY_FIELD_STATE.EMPTY);
  assert.equal(getEntityFieldState(model, 'missing'), ENTITY_FIELD_STATE.UNLOADED);
  assert.equal(getEntityFieldState(model, 'bad'), ENTITY_FIELD_STATE.INVALID);
  assert.equal(getEntityFieldState(model, 'flag', false), ENTITY_FIELD_STATE.FORBIDDEN);
  assert.equal(readEntityField(model, 'flag', false).value, undefined);
  assert.equal(model.meta.issues[0].path, 'bad');
});

test('shared merge hydrates without erasing loaded values or invalid-field evidence', () => {
  const partial = createEntityModel('sample', ['id', 'name'], 'list');
  setEntityValue(partial, 'id', '1');
  setEntityValue(partial, 'name', 'Before');
  const detail = createEntityModel('sample', ['id', 'name'], 'detail', { complete: true });
  setEntityValue(detail, 'id', '1');
  markEntityFieldInvalid(detail, 'name', 7, 'Expected string');
  const merged = mergeEntityModels(partial, detail);
  assert.equal(merged.identity.id, '1');
  assert.equal(getEntityFieldState(merged, 'name'), ENTITY_FIELD_STATE.INVALID);
  assert.equal(merged.meta.isPartial, false);
});

test('shared merge rejects models with different backend identities', () => {
  const first = createEntityModel('product', ['id', 'name'], 'first');
  setEntityValue(first, 'id', 'p1');
  const second = createEntityModel('product', ['id', 'name'], 'second');
  setEntityValue(second, 'id', 'p2');
  assert.throws(() => mergeEntityModels(first, second), /different product identities/);
});

test('named adapter registry covers every entity and adapters are idempotent', () => {
  assert.ok(ENTITY_ADAPTER_NAMES.length >= 23);
  const covered = new Set(Object.values(NAMED_ENTITY_ADAPTERS).map((adapter) => adapter.entityType));
  ENTITY_TYPES.forEach((entityType) => assert.ok(covered.has(entityType), entityType));
  for (const [name, adapter] of Object.entries(NAMED_ENTITY_ADAPTERS)) {
    const model = adaptEntityFromNamedSource(name, {});
    assert.equal(model.entityType, adapter.entityType);
    assert.equal(adaptEntityFromNamedSource(name, model), model);
    assert.equal(model.meta.source, name);
  }
});

test('every consumed named source declares exact field and endpoint ownership contracts', () => {
  assert.deepEqual(Object.keys(NAMED_SOURCE_CONTRACTS).sort(), [...ENTITY_ADAPTER_NAMES].sort());
  for (const [name, contract] of Object.entries(NAMED_SOURCE_CONTRACTS)) {
    assert.equal(new Set(contract.fields).size, contract.fields.length, `${name} duplicate fields`);
    assert.ok(contract.fields.length > 0, `${name} fields`);
    assert.ok(contract.endpoints.length > 0, `${name} endpoints`);
    assert.equal(NAMED_ENTITY_ADAPTERS[name]?.entityType || 'user', contract.entityType, `${name} entity`);
  }
});

test('named partial adapters contain canonical fields not declared by their source contract', () => {
  const model = adaptEntityFromNamedSource('adaptUserPublicProfile', {
    id: 'public-user',
    fullName: 'Public profile',
    email: 'private@example.test',
    isBanned: true,
    permissions: ['SUPER_ADMIN'],
  });
  assert.deepEqual([...model.meta.loadedFields].sort(), ['fullName', 'id'].sort());
  assert.equal(getEntityFieldState(model, 'email'), ENTITY_FIELD_STATE.UNLOADED);
  assert.equal(getEntityFieldState(model, 'isBanned'), ENTITY_FIELD_STATE.UNLOADED);
  assert.equal(getEntityFieldState(model, 'facets.admin.permissions'), ENTITY_FIELD_STATE.UNLOADED);
  assert.equal(getEntityFieldState(model, 'facets.admin.isCommunityHelper'), ENTITY_FIELD_STATE.UNLOADED);
  assert.ok(model.meta.unknownFields.includes('email'));
});

test('complete-source adapters remain partial when required fields are absent', () => {
  const incomplete = adaptEntityFromNamedSource('adaptProductDomain', { id: 'p1' });
  assert.equal(incomplete.meta.isPartial, true);
});

test('generic entity adapters default to partial because source completeness is unknown', async () => {
  for (const entityType of ENTITY_TYPES) {
    const pascal = entityType[0].toUpperCase() + entityType.slice(1);
    const module = await import(`../${entityType}/${entityType}Adapters.js`);
    const adapter = module[`adapt${pascal}`];
    assert.equal(typeof adapter, 'function', `${entityType} generic adapter`);
    assert.equal(adapter({}).meta.isPartial, true, `${entityType} default completeness`);
  }
});

test('viewer normalizes prefixed permissions and retains a role-only Admin facet', () => {
  const permissionViewer = createViewer({ id: 'u1', permissions: ['ROLE_VIEW_USERS'] });
  assert.deepEqual(permissionViewer.permissions, ['VIEW_USERS']);
  const roleOnlyAdmin = createViewer({ id: 'u2', roles: ['ROLE_ADMIN'] });
  assert.equal(roleOnlyAdmin.isAdmin, true);
  assert.deepEqual(roleOnlyAdmin.facets.admin, { permissions: [], isSuperAdmin: false });
});

test('access cannot be broadened with caller-supplied permission arrays', () => {
  const category = adaptEntityFromNamedSource('adaptCategoryListRecord', { id: 'c1', name: 'Gifts' });
  const access = buildEntityAccess({
    entity: category,
    viewer: createViewer({ id: 'ordinary-user', roles: ['ROLE_USER'] }),
    context: VIEW_CONTEXT.SYSTEM,
    permissions: ['MANAGE_CATEGORIES'],
  });
  assert.equal(access.canManage, false);
  assert.equal(access.permissionSet.has('MANAGE_CATEGORIES'), false);
});

test('structured JSON adapters distinguish malformed data from empty and unloaded', async () => {
  const { adaptNotification } = await import('../notification/notificationAdapters.js');
  const malformed = adaptNotification({ metadata: '{bad' });
  assert.equal(getEntityFieldState(malformed, 'parsedMetadata'), ENTITY_FIELD_STATE.INVALID);
  assert.equal(malformed.meta.issues.length, 1);
  const empty = adaptNotification({ metadata: null });
  assert.equal(getEntityFieldState(empty, 'parsedMetadata'), ENTITY_FIELD_STATE.EMPTY);
  const unloaded = adaptNotification({});
  assert.equal(getEntityFieldState(unloaded, 'parsedMetadata'), ENTITY_FIELD_STATE.UNLOADED);
});

test('Notification metadata produces the shared entity-reference contract', async () => {
  const { adaptNotification } = await import('../notification/notificationAdapters.js');
  const notification = adaptNotification({
    metadata: JSON.stringify({ entityType: 'order', entityId: 'order-1' }),
  });
  assert.deepEqual(notification.relatedEntity, {
    entityType: 'order',
    id: 'order-1',
    loaded: false,
  });
});

test('invalid dates cannot fabricate derived commission or restriction state', async () => {
  const { adaptCommission } = await import('../commission/commissionAdapters.js');
  const { adaptUserReviewRestriction } = await import('../userReviewRestriction/userReviewRestrictionAdapters.js');
  const commission = adaptCommission({ status: 'PENDING', dueDate: 'not-a-date' });
  assert.equal(getEntityFieldState(commission, 'dueDate'), ENTITY_FIELD_STATE.INVALID);
  assert.equal(getEntityFieldState(commission, 'overdue'), ENTITY_FIELD_STATE.UNLOADED);
  const restriction = adaptUserReviewRestriction({ expiresAt: 'not-a-date' });
  assert.equal(getEntityFieldState(restriction, 'expiresAt'), ENTITY_FIELD_STATE.INVALID);
  assert.equal(getEntityFieldState(restriction, 'isActive'), ENTITY_FIELD_STATE.UNLOADED);
});

test('shared date formatting never renders invalid dates', async () => {
  const {
    createIsoTimestamp,
    formatEntityDate,
    formatEntityDateTime,
    toValidEntityDate,
  } = await import('../shared/date.js');
  assert.equal(formatEntityDate('not-a-date'), null);
  assert.equal(formatEntityDateTime('not-a-date'), null);
  assert.equal(toValidEntityDate('2025-02-29'), null);
  assert.ok(toValidEntityDate('2024-02-29'));
  assert.equal(createIsoTimestamp(0), '1970-01-01T00:00:00.000Z');
});

test('projection references adapt through canonical named adapters', () => {
  assert.deepEqual(Object.keys(PROJECTION_SCHEMAS).sort(), ['authentication', 'financialAnalytics', 'platformAnalytics', 'productSearch', 'recommendations', 'unifiedSearch', 'vendorAnalytics']);
  const projection = adaptProjection('unifiedSearch', {
    products: [{ productId: 'p1', productName: 'Gift' }], vendors: [], giftFlows: [], totalResults: 1,
  });
  assert.equal(projection.data.products[0].entityType, 'product');
  assert.equal(projection.data.products[0].id, 'p1');
  const analytics = adaptProjection('platformAnalytics', {
    topProducts: [{ productId: 'p1', productName: 'Gift', totalRevenue: '10.00', totalSales: 1 }],
    topCustomers: [],
    topVendors: [],
  });
  assert.equal(analytics.data.topProducts[0].entity.meta.loadedFields.has('analytics.revenue'), false);
  assert.equal(analytics.data.topProducts[0].totalRevenue, '10.00');
});

test('named entity relations use normalized reference snapshots', () => {
  const product = adaptEntityFromNamedSource('adaptProductDomain', {
    id: 'p1',
    categories: [{ id: 'c1', name: 'Flowers' }],
  });
  assert.deepEqual({
    entityType: product.categories[0].entityType,
    id: product.categories[0].id,
    loaded: product.categories[0].loaded,
    snapshotType: product.categories[0].snapshot.entityType,
  }, {
    entityType: 'category',
    id: 'c1',
    loaded: true,
    snapshotType: 'category',
  });
});

test('Vendor relations are declared and normalized as entity references', async () => {
  const { adaptVendor } = await import('../vendor/vendorAdapters.js');
  const { adaptProduct } = await import('../product/productAdapters.js');
  const product = adaptProduct({ id: 'p1', name: 'Gift' });
  const vendor = adaptVendor({ supplierId: 'v1' }, { products: [product] });
  assert.equal(ENTITY_DOMAIN_SCHEMAS.vendor.fields['relations.products'].provenance, 'RELATION');
  assert.deepEqual({
    entityType: vendor.relations.products[0].entityType,
    id: vendor.relations.products[0].id,
    loaded: vendor.relations.products[0].loaded,
    snapshotType: vendor.relations.products[0].snapshot.entityType,
  }, {
    entityType: 'product',
    id: 'p1',
    loaded: true,
    snapshotType: 'product',
  });
});

test('Review author enrichment survives applicable named source enforcement', () => {
  const review = adaptEntityFromNamedSource('adaptReviewPublicResponse', {
    id: 'r1',
    authorName: 'Customer Name',
    status: 'APPROVED',
  });
  assert.equal(review.authorName, 'Customer Name');
  assert.equal(review.meta.loadedFields.has('authorName'), true);
  assert.equal(ENTITY_DOMAIN_SCHEMAS.review.fields.authorName.provenance, 'ENRICHMENT');
});

test('command drafts are separate validated contracts and contain only declared payload fields', () => {
  assert.equal(Object.keys(COMMAND_SCHEMAS).length, 23);
  const draft = createCommandDraft('reportSubmission', { reportType: 'PRODUCT', reportedEntityId: 'p1', reason: 'OTHER', ignored: 'x' });
  const result = commandDraftToPayload('reportSubmission', draft);
  assert.equal(result.ok, true);
  assert.equal(Object.hasOwn(result.payload, 'ignored'), false);
  assert.equal(commandDraftToPayload('reportSubmission', createCommandDraft('reportSubmission')).ok, false);
});

test('hydration is authorized, cached, merged and non-destructive on failure', async () => {
  const partial = createEntityModel('sample', ['id', 'name'], 'summary');
  setEntityValue(partial, 'id', '1');
  let calls = 0;
  const repository = new EntityHydrationRepository({
    authorize: ({ fields }) => fields.includes('name'),
    load: async () => {
      calls += 1;
      const detail = createEntityModel('sample', ['id', 'name'], 'detail', { complete: true });
      setEntityValue(detail, 'id', '1');
      setEntityValue(detail, 'name', 'Loaded');
      return detail;
    },
  });
  const first = await repository.hydrate({ entity: partial, requiredFields: ['name'] });
  const second = await repository.hydrate({ entity: partial, requiredFields: ['name'] });
  assert.equal(first.entity.name, 'Loaded');
  assert.equal(second.entity.name, 'Loaded');
  assert.equal(calls, 1);
  const denied = await repository.hydrate({ entity: partial, requiredFields: ['secret'] });
  assert.equal(denied.entity, partial);
  assert.equal(denied.error.code, 'FORBIDDEN_HYDRATION');
});

test('shared actions require handlers and expose the complete action contract', () => {
  const report = adaptReport({ id: 'r1', status: 'PENDING' });
  const access = { canManage: true };
  assert.deepEqual(buildEntityActions({ entity: report, access }), []);
  const actions = buildEntityActions({ entity: report, access, handlers: { underReview() {} } });
  assert.deepEqual(Object.keys(actions[0]).sort(), ['confirmation', 'disabledReason', 'intent', 'key', 'label', 'onSelect']);
});

test('all 23 domains satisfy the shared runtime, access and concrete-view contract matrix', () => {
  const superAdmin = createViewer({ id: 'matrix-user', supplierId: 'matrix-vendor', roles: ['ROLE_USER', 'ROLE_VENDOR', 'ROLE_ADMIN', 'SUPER_ADMIN'] });
  const guest = createViewer();
  for (const [entityType, definition] of Object.entries(ENTITY_DOMAIN_SCHEMAS)) {
    const paths = Object.keys(definition.fields);
    const partial = createEntityModel(entityType, paths, 'matrix-partial');
    setEntityValue(partial, paths[0], entityType === 'vendorDeliveryPricing' ? 'matrix-vendor' : `matrix-${entityType}`);
    assert.equal(partial.meta.isPartial, true, `${entityType} partial`);
    assert.equal(getEntityFieldState(partial, paths.at(-1)), ENTITY_FIELD_STATE.UNLOADED, `${entityType} unloaded`);

    const full = createEntityModel(entityType, paths, 'matrix-full', { complete: true });
    paths.forEach((path) => setEntityValue(full, path, null));
    setEntityValue(full, paths[0], partial[paths[0]]);
    assert.equal(full.meta.loadedFields.size, paths.length, `${entityType} exhaustive fields`);
    assert.equal(mergeEntityModels(partial, full).meta.isPartial, false, `${entityType} merge`);

    for (const [viewer, context] of [[guest, VIEW_CONTEXT.PUBLIC], [superAdmin, VIEW_CONTEXT.SYSTEM]]) {
      const access = buildEntityAccess({ entity: full, viewer, context });
      assert.equal(typeof access.canRead, 'boolean', `${entityType} canRead`);
      assert.ok(access.fields && access.sections && access.ownership && access.participation, `${entityType} normalized access`);
      assert.ok(access.permissionSet instanceof Set, `${entityType} permission set`);
    }
    assert.deepEqual(buildEntityActions({ entity: full, access: buildEntityAccess({ entity: full, viewer: superAdmin, context: VIEW_CONTEXT.SYSTEM }) }), [], `${entityType} no handler`);

    const pascal = entityType[0].toUpperCase() + entityType.slice(1);
    const viewPath = resolve(process.cwd(), 'src', 'ui', 'entities', entityType, 'views', `${pascal}SemanticViews.jsx`);
    const source = readFileSync(viewPath, 'utf8');
    ['Summary', 'Card', 'Row', 'Details', 'Workflow'].forEach((variant) => assert.match(source, new RegExp(`export function ${pascal}${variant}\\b`), `${entityType} ${variant}`));
    assert.doesNotMatch(source, /services\/|Adapters|JSON\.stringify|ROLE_|permissions\.includes/, `${entityType} semantic boundary`);
  }
});
