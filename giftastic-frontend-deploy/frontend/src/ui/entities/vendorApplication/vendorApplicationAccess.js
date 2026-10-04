import {
  buildEntityPermissionSet,
  getViewerUserId,
  hasEntityPermission,
} from '../shared/entityModel.js';

export const VENDOR_APPLICATION_CONTEXT = Object.freeze({ SELF: 'SELF', ADMIN: 'ADMIN', SYSTEM: 'SYSTEM' });

export function buildVendorApplicationAccess({ application, viewer, context = VENDOR_APPLICATION_CONTEXT.SELF }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isOwner = Boolean(application?.userId && getViewerUserId(viewer) === application.userId);
  const admin = [VENDOR_APPLICATION_CONTEXT.ADMIN, VENDOR_APPLICATION_CONTEXT.SYSTEM].includes(context);
  const canReview = admin && (
    hasEntityPermission(permissionSet, 'MAKE_VENDORS')
    || hasEntityPermission(permissionSet, 'ACTIVATE_VENDORS')
  );
  return {
    permissionSet,
    isOwner,
    canRead: isOwner || canReview,
    canReview,
    canViewSystem: admin && permissionSet.has('SUPER_ADMIN'),
  };
}
