import test from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_PERMISSIONS } from '../shared/permissions.js';
import { createViewer, viewerHasCapability } from '../shared/viewer.js';
import { ENTITY_SCHEMAS } from '../shared/entitySchemas.js';
import { adaptVendorApplication } from '../vendorApplication/vendorApplicationAdapters.js';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

test('permission vocabulary mirrors backend permissions used by the UI', () => {
  assert.equal(new Set(ADMIN_PERMISSIONS).size, ADMIN_PERMISSIONS.length);
  ['SUPER_ADMIN', 'MANAGE_ORDER_STATUS', 'REVIEW_ORDER_ASSISTANCE']
    .forEach((permission) => assert.equal(ADMIN_PERMISSIONS.includes(permission), true));
});

test('viewer facets are additive rather than exclusive roles', () => {
  const viewer = createViewer({
    id: 'u1', supplierId: 'v1', roles: ['ROLE_VENDOR', 'ROLE_ADMIN'],
  }, {
    permissions: ['VIEW_ORDERS'], isSuperAdmin: false,
  });
  assert.equal(viewer.userId, 'u1');
  assert.equal(viewer.supplierId, 'v1');
  assert.equal(viewer.isVendor, true);
  assert.equal(viewer.isAdmin, true);
  assert.equal(viewer.permissions.includes('VIEW_ORDERS'), true);
});

test('super admin retains simultaneous User and Vendor facets', () => {
  const viewer = createViewer({ id: 'u1', supplierId: 'v1' }, {
    permissions: ['SUPER_ADMIN'], isSuperAdmin: true,
  });
  assert.equal(viewer.isSuperAdmin, true);
  assert.equal(viewer.isVendor, true);
  assert.equal(viewer.isAdmin, true);
});

test('backend authorities become additive viewer permissions and route capabilities', () => {
  const viewer = createViewer({
    id: 'u1',
    supplierId: 'v1',
    roles: ['ROLE_VENDOR', 'ROLE_ADMIN', 'VIEW_ORDERS', 'MANAGE_ORDER_STATUS'],
  });
  assert.deepEqual(viewer.roles.sort(), ['ADMIN', 'VENDOR']);
  assert.deepEqual(viewer.permissions.sort(), ['MANAGE_ORDER_STATUS', 'VIEW_ORDERS']);
  assert.equal(viewerHasCapability(viewer, 'VENDOR'), true);
  assert.equal(viewerHasCapability(viewer, 'ADMIN'), true);
  assert.equal(viewerHasCapability(viewer, ['MANAGE_REPORTS', 'VIEW_ORDERS']), true);
  assert.equal(viewerHasCapability(viewer, 'MANAGE_REPORTS'), false);
});

test('a refreshed admin profile removes permissions that were revoked after login', () => {
  const viewer = createViewer({
    id: 'u1',
    roles: ['ROLE_USER', 'VIEW_USERS'],
    permissions: ['VIEW_USERS'],
    isSuperAdmin: true,
    facets: { admin: { permissions: ['SUPER_ADMIN'], isSuperAdmin: true } },
  }, {
    permissions: [],
    isSuperAdmin: false,
  });

  assert.deepEqual(viewer.permissions, []);
  assert.equal(viewer.isSuperAdmin, false);
  assert.equal(viewer.isAdmin, false);
});

test('every planned entity has a semantic presentation schema', () => {
  const expected = [
    'user', 'vendor', 'product', 'order', 'giftFlow', 'cart', 'review',
    'category', 'vendorApplication', 'commission', 'commissionPaymentRequest',
    'commissionRule', 'report', 'adminRequest', 'orderAssistance',
    'notification', 'vendorFeedback', 'deliveryZone', 'vendorDeliveryPricing',
    'reminder', 'vendorActivity', 'userReviewRestriction', 'favorite',
  ];
  assert.deepEqual(Object.keys(ENTITY_SCHEMAS).sort(), expected.sort());
  expected.forEach((entityType) => assert.equal(ENTITY_SCHEMAS[entityType].length > 0, true));
});

test('adapters preserve canonical models and their loaded-field metadata', () => {
  const application = adaptVendorApplication({
    id: 7,
    storeName: 'Canonical Gifts',
  }, { complete: false });
  const adaptedAgain = adaptVendorApplication(application);
  assert.equal(adaptedAgain, application);
  assert.deepEqual([...adaptedAgain.meta.loadedFields].sort(), ['id', 'storeName']);
  assert.equal(adaptedAgain.meta.isPartial, true);
});

test('frontend no longer depends on modal-owned entity normalization or invented stock defaults', () => {
  const root = join(process.cwd(), 'src');
  const files = [];
  const visit = (directory) => readdirSync(directory).forEach((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory() && name !== '__tests__') visit(path);
    else if (/\.(js|jsx)$/.test(name)) files.push(path);
  });
  visit(root);
  const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');
  [
    'productModalUtils', 'orderModalUtils', 'giftFlowModalUtils',
    'reviewModalUtils', 'categoryModalUtils', 'commissionModalUtils',
    'notificationModalUtils', 'adminRequestModalUtils',
    'vendorApplicationModalUtils', 'userModalUtils',
  ].forEach((legacyModule) => assert.equal(source.includes(legacyModule), false));
  assert.equal(/\?\?\s*100/.test(source), false);
});
