import {
  buildEntityPermissionSet,
  getViewerUserId,
  hasEntityPermission,
} from '../shared/entityModel.js';

export const ADMIN_REQUEST_CONTEXT = Object.freeze({ SELF: 'SELF', ADMIN: 'ADMIN', SYSTEM: 'SYSTEM' });

export function buildAdminRequestAccess({ request, viewer, context = ADMIN_REQUEST_CONTEXT.SELF }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isOwner = Boolean(request?.userId && getViewerUserId(viewer) === request.userId);
  const admin = [ADMIN_REQUEST_CONTEXT.ADMIN, ADMIN_REQUEST_CONTEXT.SYSTEM].includes(context);
  const canReview = admin && hasEntityPermission(permissionSet, 'REVIEW_ADMIN_REQUESTS');
  return {
    permissionSet,
    isOwner,
    canRead: isOwner || canReview || (admin && permissionSet.has('SUPER_ADMIN')),
    canReview,
    canResetCooldown: admin && hasEntityPermission(permissionSet, 'MAKE_ADMINS'),
    canViewSystem: admin && permissionSet.has('SUPER_ADMIN'),
  };
}
