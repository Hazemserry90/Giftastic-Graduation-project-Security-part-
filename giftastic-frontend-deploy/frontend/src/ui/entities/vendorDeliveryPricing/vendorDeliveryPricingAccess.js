import { buildEntityPermissionSet, getViewerSupplierId } from '../shared/entityModel.js';

export function buildVendorDeliveryPricingAccess({ pricing, viewer }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isOwner = Boolean(pricing?.vendorId && getViewerSupplierId(viewer) === pricing.vendorId);
  return { permissionSet, isOwner, canRead: isOwner || permissionSet.has('SUPER_ADMIN'), canManage: isOwner };
}
