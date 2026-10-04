import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptDomainVendor,
  adaptVendor,
  adaptVendorSearchResult,
} from '../vendorAdapters.js';
import { buildVendorAccess, VENDOR_CONTEXT } from '../vendorAccess.js';
import { buildVendorActions } from '../vendorActions.js';
import {
  getVendorFieldState,
  hasLoadedVendorField,
  VENDOR_FIELD_STATE,
} from '../vendorModel.js';

test('domain adapter follows the backend Vendor fields and preserves false verification state', () => {
  const model = adaptDomainVendor({
    userId: 'user-1',
    supplierId: 'supplier-1',
    storeName: 'Store',
    description: null,
    contactEmail: 'store@example.com',
    isVerified: false,
  });

  assert.equal(model.userId, 'user-1');
  assert.equal(model.supplierId, 'supplier-1');
  assert.equal(model.isVerified, false);
  assert.equal(hasLoadedVendorField(model, 'description'), true);
  assert.equal(getVendorFieldState(model, 'description', true), VENDOR_FIELD_STATE.EMPTY);
});

test('search adapter remains partial and does not invent contact or verification data', () => {
  const model = adaptVendorSearchResult({
    id: 'supplier-2',
    storeName: 'Search Store',
    description: 'Short result',
    logoUrl: '/logo.png',
  });

  assert.equal(model.supplierId, 'supplier-2');
  assert.equal(hasLoadedVendorField(model, 'contactEmail'), false);
  assert.equal(hasLoadedVendorField(model, 'isVerified'), false);
  assert.equal(getVendorFieldState(model, 'contactEmail', true), VENDOR_FIELD_STATE.UNLOADED);
});

test('public context shows storefront fields but not protected status or system IDs', () => {
  const model = adaptDomainVendor({
    userId: 'user-3',
    supplierId: 'supplier-3',
    storeName: 'Public Store',
    contactEmail: 'public@store.com',
    isVerified: true,
  });
  const access = buildVendorAccess({
    vendor: model,
    viewer: null,
    context: VENDOR_CONTEXT.PUBLIC,
  });

  assert.equal(access.fields.contactEmail, true);
  assert.equal(access.sections.contact, true);
  assert.equal(access.sections.status, false);
  assert.equal(access.sections.system, false);
});

test('owner management requires matching supplier identity', () => {
  const model = adaptVendor({
    supplierId: 'supplier-4',
    storeName: 'Owned Store',
    isVerified: true,
  });
  const denied = buildVendorAccess({
    vendor: model,
    viewer: { supplierId: 'supplier-other' },
    context: VENDOR_CONTEXT.OWNER_MANAGEMENT,
  });
  const allowed = buildVendorAccess({
    vendor: model,
    viewer: { supplierId: 'supplier-4' },
    context: VENDOR_CONTEXT.OWNER_MANAGEMENT,
  });

  assert.equal(denied.isOwner, false);
  assert.equal(allowed.isOwner, true);
  assert.equal(allowed.sections.status, true);
});

test('admin actions require exact permission and loaded entity state', () => {
  const inactive = adaptVendor({ supplierId: 'supplier-5', storeName: 'Pending', isVerified: false });
  const activateAccess = buildVendorAccess({
    vendor: inactive,
    viewer: { permissions: ['ACTIVATE_VENDORS'] },
    context: VENDOR_CONTEXT.ADMIN_MANAGEMENT,
  });
  assert.deepEqual(buildVendorActions({ vendor: inactive, access: activateAccess, onAction() {} }).map((action) => action.key), ['activate']);

  const partial = adaptVendorSearchResult({ id: 'supplier-5', storeName: 'Pending' });
  const partialAccess = buildVendorAccess({
    vendor: partial,
    viewer: { permissions: ['ACTIVATE_VENDORS'] },
    context: VENDOR_CONTEXT.ADMIN_MANAGEMENT,
  });
  assert.deepEqual(buildVendorActions({ vendor: partial, access: partialAccess }), []);
});

test('deactivation permission does not imply activation permission', () => {
  const inactive = adaptVendor({ supplierId: 'supplier-6', isVerified: false });
  const access = buildVendorAccess({
    vendor: inactive,
    viewer: { permissions: ['DEACTIVATE_VENDORS'] },
    context: VENDOR_CONTEXT.ADMIN_MANAGEMENT,
  });
  assert.deepEqual(buildVendorActions({ vendor: inactive, access }), []);
});

test('super admin gets system identifiers in administrative context', () => {
  const model = adaptDomainVendor({
    userId: 'user-7',
    supplierId: 'supplier-7',
    storeName: 'System Store',
    isVerified: true,
  });
  const access = buildVendorAccess({
    vendor: model,
    viewer: { permissions: ['SUPER_ADMIN'] },
    context: VENDOR_CONTEXT.SYSTEM,
  });

  assert.equal(access.sections.system, true);
  assert.equal(access.fields.userId, true);
  assert.equal(access.fields.supplierId, true);
});

test('admin context cannot grant Vendor read access without permission', () => {
  const model = adaptDomainVendor({
    supplierId: 'supplier-8', storeName: 'Unverified', isVerified: false,
  });
  const denied = buildVendorAccess({
    vendor: model,
    viewer: null,
    context: VENDOR_CONTEXT.ADMIN_MANAGEMENT,
  });
  const allowed = buildVendorAccess({
    vendor: model,
    viewer: { permissions: ['ACTIVATE_VENDORS'] },
    context: VENDOR_CONTEXT.ADMIN_MANAGEMENT,
  });
  assert.equal(denied.canRead, false);
  assert.equal(allowed.canRead, true);
});
