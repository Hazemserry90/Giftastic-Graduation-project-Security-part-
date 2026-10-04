import {
  buildEntityPermissionSet,
  getViewerSupplierId,
  hasEntityPermission,
} from '../shared/entityModel.js';

export const GIFT_FLOW_CONTEXT = Object.freeze({ PUBLIC: 'PUBLIC', OWNER: 'OWNER', ADMIN: 'ADMIN', SYSTEM: 'SYSTEM' });

export function buildGiftFlowAccess({ flow, viewer, context = GIFT_FLOW_CONTEXT.PUBLIC }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isOwner = Boolean(flow?.supplierId && getViewerSupplierId(viewer) === flow.supplierId);
  const admin = [GIFT_FLOW_CONTEXT.ADMIN, GIFT_FLOW_CONTEXT.SYSTEM].includes(context);
  const canManage = (context === GIFT_FLOW_CONTEXT.OWNER && isOwner)
    || (admin && hasEntityPermission(permissionSet, 'MANAGE_GIFT_FLOWS'));
  return {
    permissionSet,
    isOwner,
    canRead: true,
    canManage,
    sections: {
      hero: true,
      structure: true,
      products: true,
      vendor: canManage,
      configuration: canManage,
      system: context === GIFT_FLOW_CONTEXT.SYSTEM && permissionSet.has('SUPER_ADMIN'),
    },
  };
}
