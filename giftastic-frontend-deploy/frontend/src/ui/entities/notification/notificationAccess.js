import {
  buildEntityPermissionSet,
  getViewerUserId,
} from '../shared/entityModel.js';

export const NOTIFICATION_CONTEXT = Object.freeze({ OWNER: 'OWNER', SYSTEM: 'SYSTEM' });

export function buildNotificationAccess({ notification, viewer, context = NOTIFICATION_CONTEXT.OWNER }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isOwner = Boolean(notification?.userId && getViewerUserId(viewer) === notification.userId);
  return {
    permissionSet,
    isOwner,
    canRead: isOwner,
    canViewSystem: isOwner && context === NOTIFICATION_CONTEXT.SYSTEM && permissionSet.has('SUPER_ADMIN'),
  };
}
