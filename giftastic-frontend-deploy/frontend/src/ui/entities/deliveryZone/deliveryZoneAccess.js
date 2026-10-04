import { buildEntityPermissionSet, hasLoadedEntityField } from '../shared/entityModel.js';

export const DELIVERY_ZONE_CONTEXT = Object.freeze({ CHECKOUT: 'CHECKOUT', MANAGEMENT: 'MANAGEMENT' });
export function buildDeliveryZoneAccess({ zone, viewer, context = DELIVERY_ZONE_CONTEXT.CHECKOUT }) {
  const activeLoaded = hasLoadedEntityField(zone, 'isActive');
  const permissionSet = buildEntityPermissionSet(viewer);
  const management = context === DELIVERY_ZONE_CONTEXT.MANAGEMENT && permissionSet.has('SUPER_ADMIN');
  return {
    permissionSet,
    canRead: management
      || (activeLoaded && zone.isActive === true),
    canViewSystem: management,
    canManage: false,
  };
}
