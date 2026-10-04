import { getUserFieldState, hasLoadedUserField, USER_FIELD_STATE } from './userModel.js';

export const USER_CONTEXT = Object.freeze({
  PUBLIC: 'PUBLIC',
  SEARCH: 'SEARCH',
  SUMMARY: 'SUMMARY',
  SELF: 'SELF',
  ORDER_VENDOR: 'ORDER_VENDOR',
  ADMIN_READ: 'ADMIN_READ',
  ADMIN_MANAGEMENT: 'ADMIN_MANAGEMENT',
  ADMIN_FINANCIAL: 'ADMIN_FINANCIAL',
  SYSTEM: 'SYSTEM',
  EDIT: 'EDIT',
});

function normalizePermissions(viewer) {
  const values = new Set([
    ...(Array.isArray(viewer?.permissions) ? viewer.permissions : []),
    ...(Array.isArray(viewer?.facets?.admin?.permissions) ? viewer.facets.admin.permissions : []),
  ]);

  if (viewer?.isSuperAdmin || viewer?.facets?.admin?.isSuperAdmin) {
    values.add('SUPER_ADMIN');
  }
  return values;
}

export function hasUserPermission(permissionSet, permission) {
  return permissionSet.has('SUPER_ADMIN') || permissionSet.has(permission);
}

export function getViewerUserId(viewer) {
  return viewer?.userId || viewer?.id || null;
}

export function buildUserAccess({
  user,
  viewer,
  context = USER_CONTEXT.SUMMARY,
  relationship = {},
}) {
  const hasResolvedUserField = (path) => ![USER_FIELD_STATE.UNLOADED, USER_FIELD_STATE.INVALID]
    .includes(getUserFieldState(user, path));
  const permissionSet = normalizePermissions(viewer);
  const viewerId = getViewerUserId(viewer);
  const isSelf = Boolean(user?.id && viewerId && user.id === viewerId);
  const isSuperAdmin = permissionSet.has('SUPER_ADMIN');
  const canReadUsers = hasUserPermission(permissionSet, 'VIEW_USERS')
    || hasUserPermission(permissionSet, 'MANAGE_USERS');
  const protectedProfileContext = [
    USER_CONTEXT.SELF,
    USER_CONTEXT.EDIT,
    USER_CONTEXT.ADMIN_READ,
    USER_CONTEXT.ADMIN_MANAGEMENT,
    USER_CONTEXT.SYSTEM,
  ].includes(context);
  const administrativeContext = [
    USER_CONTEXT.ADMIN_READ,
    USER_CONTEXT.ADMIN_MANAGEMENT,
    USER_CONTEXT.SYSTEM,
  ].includes(context);
  const orderVendorRelationship = context === USER_CONTEXT.ORDER_VENDOR
    && relationship.isParticipatingVendor === true;
  const financialIdentity = context === USER_CONTEXT.ADMIN_FINANCIAL
    && hasUserPermission(permissionSet, 'VIEW_FINANCIAL_ANALYTICS');
  const protectedIdentity = (protectedProfileContext && (isSelf || canReadUsers))
    || orderVendorRelationship
    || financialIdentity;
  const canManagePermissions = hasUserPermission(permissionSet, 'MANAGE_ADMIN_PERMISSIONS');
  const canReviewRestrictions = hasUserPermission(permissionSet, 'MUTE_USERS');

  const fields = {
    id: isSuperAdmin,
    fullName: true,
    email: protectedIdentity,
    phoneNumber: (protectedProfileContext && (isSelf || canReadUsers)) || orderVendorRelationship,
    instapayRefundPhoneNumber: protectedProfileContext && (isSelf || canReadUsers),
    instapayRefundName: protectedProfileContext && (isSelf || canReadUsers),
    birthday: protectedProfileContext && (isSelf || canReadUsers),
    addresses: protectedProfileContext && (isSelf || hasUserPermission(permissionSet, 'MANAGE_USERS')),
    isBanned: administrativeContext && canReadUsers,
    requestedAdmin: protectedProfileContext && (isSelf || hasUserPermission(permissionSet, 'REVIEW_ADMIN_REQUESTS')),
    memberSince: true,
    vendorBadge: true,
    vendorLink: true,
    communityHelperBadge: true,
    adminBadge: administrativeContext && (canReadUsers || canManagePermissions),
    superAdminBadge: administrativeContext && (canManagePermissions || isSuperAdmin),
    adminPermissions: administrativeContext && (canManagePermissions || isSuperAdmin),
    reviewRestriction: administrativeContext && (canReviewRestrictions || isSuperAdmin),
    supplierId: administrativeContext && isSuperAdmin,
    vendorId: administrativeContext && isSuperAdmin,
  };

  const sections = {
    identity: true,
    contact: fields.phoneNumber && (
      hasLoadedUserField(user, 'phoneNumber') || hasLoadedUserField(user, 'birthday')
    ),
    addresses: fields.addresses && hasLoadedUserField(user, 'addresses'),
    accountStatus: fields.isBanned && (
      hasLoadedUserField(user, 'isBanned') || hasLoadedUserField(user, 'requestedAdmin')
    ),
    vendorFacet: fields.vendorLink && hasResolvedUserField('facets.vendor.isVendor'),
    adminFacet: (
      (fields.adminBadge && hasResolvedUserField('facets.admin.isAdmin'))
      || (fields.adminPermissions && hasLoadedUserField(user, 'facets.admin.permissions'))
    ),
    reviewRestriction: fields.reviewRestriction && (
      hasResolvedUserField('facets.reviewRestriction.isActive')
      || hasLoadedUserField(user, 'facets.reviewRestriction.canReview')
      || hasLoadedUserField(user, 'facets.reviewRestriction.canComment')
    ),
    adminHistory: protectedProfileContext && (
      isSelf || hasUserPermission(permissionSet, 'REVIEW_ADMIN_REQUESTS')
    ),
    system: administrativeContext && isSuperAdmin,
  };

  return {
    context,
    permissionSet,
    isSelf,
    isSuperAdmin,
    canRead: true,
    relationship: {
      isParticipatingVendor: orderVendorRelationship,
    },
    fields,
    sections,
  };
}
