import { buildEntityPermissionSet, getViewerUserId } from '../shared/entityModel.js';
export function buildFavoriteAccess({ favorite, viewer }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isOwner = Boolean(favorite?.userId && getViewerUserId(viewer) === favorite.userId);
  const isGuestOwner = Boolean(favorite?.userId === 'guest' && !viewer?.isAuthenticated);
  const canManage = isOwner || isGuestOwner;
  return {
    permissionSet,
    ownership: { isOwner: canManage },
    participation: {},
    fields: { target: canManage, addedAt: canManage },
    sections: { target: canManage, system: isOwner, actions: canManage },
    isOwner,
    canRead: canManage,
    canManage,
  };
}
