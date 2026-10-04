import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptDomainUser,
  adaptOrderCustomer,
  adaptPublicUserProfile,
  adaptUser,
} from '../userAdapters.js';
import { buildUserAccess, USER_CONTEXT } from '../userAccess.js';
import { buildUserActions } from '../userActions.js';
import {
  getUserFieldState,
  hasLoadedUserField,
  USER_FIELD_STATE,
} from '../userModel.js';

test('domain adapter follows the backend User shape and excludes passwordHash', () => {
  const model = adaptDomainUser({
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'never-ui-data',
    fullName: 'Gift User',
    phoneNumber: '0100',
    birthday: [1995, 4, 3],
    addresses: [{ label: 'Home', street: 'Main', isDefault: true }],
    banned: false,
    requestedAdmin: false,
  });

  assert.equal(model.id, 'user-1');
  assert.equal(model.isBanned, false);
  assert.equal(model.addresses[0].zipCode, undefined);
  assert.equal(hasLoadedUserField(model, 'addresses.0.zipCode'), false);
  assert.equal('passwordHash' in model, false);
  assert.equal(hasLoadedUserField(model, 'email'), true);
  assert.equal(hasLoadedUserField(model, 'facets.admin.isAdmin'), false);
});

test('public projection remains partial and does not invent protected fields', () => {
  const model = adaptPublicUserProfile({
    userId: 'user-2',
    fullName: 'Public User',
    isVendor: true,
    vendorId: 'supplier-2',
    isCommunityHelper: true,
    memberSince: '2025-01-01',
  });

  assert.equal(model.id, 'user-2');
  assert.equal(model.facets.vendor.isVendor, true);
  assert.equal(model.facets.vendor.vendorId, 'supplier-2');
  assert.equal(hasLoadedUserField(model, 'email'), false);
  assert.equal(getUserFieldState(model, 'email', true), USER_FIELD_STATE.UNLOADED);
});

test('public context reduces visibility even when the viewer is the same user', () => {
  const model = adaptUser({
    id: 'user-3',
    fullName: 'Self',
    email: 'self@example.com',
    phoneNumber: '0111',
  });
  const access = buildUserAccess({
    user: model,
    viewer: { id: 'user-3' },
    context: USER_CONTEXT.PUBLIC,
  });

  assert.equal(access.isSelf, true);
  assert.equal(access.fields.email, false);
  assert.equal(access.sections.contact, false);
  assert.equal(access.sections.adminHistory, false);
});

test('self context exposes loaded self fields without admin permissions', () => {
  const model = adaptUser({
    id: 'user-4',
    email: 'self@example.com',
    phoneNumber: '0122',
    addresses: [],
  });
  const access = buildUserAccess({
    user: model,
    viewer: { id: 'user-4' },
    context: USER_CONTEXT.SELF,
  });

  assert.equal(access.fields.email, true);
  assert.equal(access.sections.contact, true);
  assert.equal(access.sections.addresses, true);
});

test('vendor order context requires an explicit participating-vendor relationship', () => {
  const model = adaptOrderCustomer({
    customerId: 'user-5',
    customerName: 'Customer',
    customerEmail: 'customer@example.com',
  });

  const denied = buildUserAccess({
    user: model,
    viewer: { supplierId: 'supplier-1' },
    context: USER_CONTEXT.ORDER_VENDOR,
  });
  const allowed = buildUserAccess({
    user: model,
    viewer: { supplierId: 'supplier-1' },
    context: USER_CONTEXT.ORDER_VENDOR,
    relationship: { isParticipatingVendor: true },
  });

  assert.equal(denied.fields.email, false);
  assert.equal(allowed.fields.email, true);
  assert.equal(allowed.fields.phoneNumber, true);
});

test('super admin receives administrative sections but not unloaded fields', () => {
  const model = adaptUser({
    id: 'user-6',
    email: 'target@example.com',
    banned: false,
  });
  const access = buildUserAccess({
    user: model,
    viewer: { id: 'admin-1', permissions: ['SUPER_ADMIN'] },
    context: USER_CONTEXT.ADMIN_MANAGEMENT,
  });

  assert.equal(access.isSuperAdmin, true);
  assert.equal(access.sections.system, true);
  assert.equal(getUserFieldState(model, 'phoneNumber', access.fields.phoneNumber), USER_FIELD_STATE.UNLOADED);
});

test('actions do not guess unloaded admin or restriction state', () => {
  const model = adaptUser({
    id: 'user-7',
    banned: false,
  });
  const access = buildUserAccess({
    user: model,
    viewer: { id: 'admin-1', permissions: ['BAN_USERS', 'MAKE_ADMINS', 'MUTE_USERS'] },
    context: USER_CONTEXT.ADMIN_MANAGEMENT,
  });
  const actions = buildUserActions({ user: model, access, onAction() {} });

  assert.deepEqual(actions.map((action) => action.key), ['ban']);
});

test('admin facet drives admin and super-admin identity additively', () => {
  const model = adaptUser({
    id: 'user-8',
    email: 'staff@example.com',
    isVendor: true,
    supplierId: 'supplier-8',
    permissions: ['VIEW_USERS', 'SUPER_ADMIN'],
  });

  assert.equal(model.facets.vendor.isVendor, true);
  assert.equal(model.facets.admin.isAdmin, true);
  assert.equal(model.facets.admin.isSuperAdmin, true);
  assert.deepEqual(model.facets.admin.permissions, ['VIEW_USERS', 'SUPER_ADMIN']);
});
