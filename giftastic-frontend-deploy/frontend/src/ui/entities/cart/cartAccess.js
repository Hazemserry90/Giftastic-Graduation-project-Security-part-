import { buildEntityPermissionSet, getViewerUserId } from '../shared/entityModel.js';

export const CART_CONTEXT = Object.freeze({
  OWNER: 'OWNER',
  GUEST_LOCAL: 'GUEST_LOCAL',
});

export function buildCartAccess({ cart, viewer, context = CART_CONTEXT.OWNER }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isOwner = Boolean(cart?.customerId && getViewerUserId(viewer) === cart.customerId);
  const isLocalGuest = context === CART_CONTEXT.GUEST_LOCAL && !cart?.customerId && !getViewerUserId(viewer);
  const canRead = isOwner || isLocalGuest;
  return {
    permissionSet,
    ownership: { isOwner, isLocalGuest },
    participation: {},
    fields: { items: canRead, total: canRead },
    sections: { items: canRead, totals: canRead, actions: canRead },
    isOwner,
    isLocalGuest,
    canRead,
    canManage: canRead,
  };
}
