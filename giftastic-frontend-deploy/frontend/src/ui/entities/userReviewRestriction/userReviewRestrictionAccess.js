import { buildEntityPermissionSet, getViewerUserId, hasEntityPermission } from '../shared/entityModel.js';

export const USER_REVIEW_RESTRICTION_CONTEXT = Object.freeze({ SELF: 'SELF', MODERATION: 'MODERATION', SYSTEM: 'SYSTEM' });

export function buildUserReviewRestrictionAccess({ restriction, viewer, context }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isOwner = Boolean(restriction?.userId && getViewerUserId(viewer) === restriction.userId);
  const moderation = [USER_REVIEW_RESTRICTION_CONTEXT.MODERATION, USER_REVIEW_RESTRICTION_CONTEXT.SYSTEM].includes(context);
  const canManage = moderation && hasEntityPermission(permissionSet, 'MUTE_USERS');
  return {
    permissionSet, isOwner, canRead: isOwner || canManage, canManage,
    canViewAdministrator: canManage,
    canViewSystem: context === USER_REVIEW_RESTRICTION_CONTEXT.SYSTEM && permissionSet.has('SUPER_ADMIN'),
  };
}
