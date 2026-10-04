import { createUserModel, setUserValue } from './userModel.js';
import { markEntityFieldInvalid, setDerivedEntityValue } from '../shared/entityModel.js';
import { adaptEmbeddedValue, applyEmbeddedResult } from '../shared/embeddedAdapters.js';
import { validateCanonicalModel } from '../shared/modelValidation.js';
import { ADMIN_PERMISSION_SET } from '../shared/permissions.js';

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value || {}, key);
}

function readAlias(value, aliases) {
  for (const alias of aliases) {
    if (hasOwn(value, alias)) return { found: true, value: value[alias] };
  }
  return { found: false, value: undefined };
}

function assignAlias(model, path, input, aliases, transform = (value) => value) {
  const result = readAlias(input, aliases);
  if (result.found) setUserValue(model, path, transform(result.value));
  return result;
}

function normalizePermissions(value) {
  if (!Array.isArray(value) && !(value instanceof Set)) return null;
  return [...new Set(Array.from(value).filter(Boolean).map(String).filter((permission) => ADMIN_PERMISSION_SET.has(permission)))];
}

function applyVendorFacet(model, input, explicitFacet) {
  const facet = explicitFacet || input?.vendor || {};
  const combined = { ...input, ...facet };

  const supplier = assignAlias(model, 'facets.vendor.supplierId', combined, ['supplierId']);
  const vendorId = assignAlias(model, 'facets.vendor.vendorId', combined, ['vendorId']);
  const explicit = assignAlias(model, 'facets.vendor.isVendor', combined, ['isVendor']);

  if (!explicit.found && (supplier.found || vendorId.found)) {
    setDerivedEntityValue(model, 'facets.vendor.isVendor', Boolean(supplier.value || vendorId.value));
  }
}

function applyAdminFacet(model, input, explicitFacet) {
  const facet = explicitFacet || input?.admin || {};
  const combined = { ...input, ...facet };
  const permissions = readAlias(combined, ['permissions']);

  if (permissions.found) {
    const normalized = normalizePermissions(permissions.value);
    if (!normalized) {
      markEntityFieldInvalid(model, 'facets.admin.permissions', permissions.value, 'Expected permission array');
    } else {
      setUserValue(model, 'facets.admin.permissions', normalized);
      setDerivedEntityValue(model, 'facets.admin.isAdmin', true);
      setDerivedEntityValue(model, 'facets.admin.isSuperAdmin', normalized.includes('SUPER_ADMIN'));
      if (!hasOwn(combined, 'isCommunityHelper')) {
        setDerivedEntityValue(model, 'facets.admin.isCommunityHelper', normalized.length > 0);
      }
    }
  }

  assignAlias(model, 'facets.admin.isAdmin', combined, ['isAdmin']);
  assignAlias(model, 'facets.admin.isSuperAdmin', combined, ['isSuperAdmin']);
  assignAlias(model, 'facets.admin.isCommunityHelper', combined, ['isCommunityHelper']);
}

function applyReviewRestriction(model, input, explicitFacet) {
  const facet = explicitFacet || input?.reviewRestriction;
  if (!facet) return;

  assignAlias(model, 'facets.reviewRestriction.canComment', facet, ['canComment']);
  assignAlias(model, 'facets.reviewRestriction.canReview', facet, ['canReview']);
  assignAlias(model, 'facets.reviewRestriction.restrictedAt', facet, ['restrictedAt']);
  assignAlias(model, 'facets.reviewRestriction.restrictedBy', facet, ['restrictedBy']);
  assignAlias(model, 'facets.reviewRestriction.reason', facet, ['reason']);
  assignAlias(model, 'facets.reviewRestriction.expiresAt', facet, ['expiresAt']);
  assignAlias(model, 'facets.reviewRestriction.isActive', facet, ['isActive']);
}

export function adaptUser(input = {}, {
  source = 'unknown',
  vendorFacet,
  adminFacet,
  reviewRestriction,
  complete = false,
} = {}) {
  if (input?.entityType === 'user' && input?.meta?.loadedFields instanceof Set) return input;
  const model = createUserModel({ source });

  assignAlias(model, 'id', input, ['id', 'userId', 'customerId']);
  assignAlias(model, 'email', input, ['email', 'customerEmail']);
  assignAlias(model, 'fullName', input, ['fullName', 'customerName']);
  assignAlias(model, 'phoneNumber', input, ['phoneNumber', 'phone']);
  assignAlias(model, 'instapayRefundPhoneNumber', input, ['instapayRefundPhoneNumber']);
  assignAlias(model, 'instapayRefundName', input, ['instapayRefundName']);
  assignAlias(model, 'birthday', input, ['birthday']);
  if (hasOwn(input, 'addresses')) {
    if (!Array.isArray(input.addresses)) markEntityFieldInvalid(model, 'addresses', input.addresses, 'Expected address array');
    else setUserValue(model, 'addresses', input.addresses.map((address, index) => {
      const result = adaptEmbeddedValue('address', address, { aliases: { zipCode: ['zipCode', 'postalCode'] }, path: `addresses.${index}` });
      return applyEmbeddedResult(model, `addresses.${index}`, result);
    }));
  }
  assignAlias(model, 'isBanned', input, ['isBanned', 'banned']);
  assignAlias(model, 'requestedAdmin', input, ['requestedAdmin']);
  assignAlias(model, 'memberSince', input, ['memberSince', 'createdAt', 'joinedAt']);

  applyVendorFacet(model, input, vendorFacet);
  applyAdminFacet(model, input, adminFacet);
  applyReviewRestriction(model, input, reviewRestriction);

  const knownFields = new Set([
    'id', 'userId', 'customerId', 'email', 'customerEmail', 'fullName', 'customerName',
    'phoneNumber', 'phone', 'instapayRefundPhoneNumber', 'instapayRefundName', 'birthday', 'addresses', 'isBanned', 'banned', 'requestedAdmin',
    'memberSince', 'createdAt', 'joinedAt', 'supplierId', 'vendorId', 'isVendor', 'vendor',
    'admin', 'permissions', 'isAdmin', 'isSuperAdmin', 'isCommunityHelper', 'reviewRestriction',
    'roles', 'role',
  ]);
  model.meta.unknownFields = [...model.meta.unknownFields, ...Object.keys(input || {}).filter((field) => !knownFields.has(field))];

  model.meta.isPartial = !complete;
  return validateCanonicalModel(model);
}

export const adaptDomainUser = (user) => adaptUser(user, {
  source: 'user-domain',
  complete: true,
});

export const adaptPublicUserProfile = (profile) => adaptUser(profile, {
  source: 'public-user-profile',
});

export const adaptAuthUser = (user) => {
  const permissions = (user?.roles || [])
    .map((role) => String(role).replace(/^ROLE_/, ''))
    .filter((role) => role && role !== 'USER' && role !== 'VENDOR' && role !== 'CUSTOMER');

  return adaptUser({
    ...user,
    isVendor: Boolean(user?.supplierId || user?.roles?.some?.((role) => String(role).includes('VENDOR'))),
    permissions: user?.permissions || permissions,
  }, {
    source: 'auth-user',
  });
};

export const adaptAdminUser = (user, admin) => adaptUser(user, {
  source: 'admin-user',
  adminFacet: admin ? {
    isAdmin: true,
    permissions: admin.permissions || [],
  } : undefined,
  complete: true,
});

export const adaptOrderCustomer = (order) => adaptUser({
  customerId: order?.customerId,
  customerName: order?.customerName,
  customerEmail: order?.customerEmail,
}, {
  source: 'order-customer',
});

export const adaptAnalyticsCustomer = (customer) => adaptUser({
  customerId: customer?.customerId,
  customerName: customer?.customerName,
  customerEmail: customer?.customerEmail,
}, {
  source: 'analytics-customer',
});
