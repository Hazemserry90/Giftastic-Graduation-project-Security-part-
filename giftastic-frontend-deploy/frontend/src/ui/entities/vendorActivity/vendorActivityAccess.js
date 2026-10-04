import { buildEntityPermissionSet, getViewerSupplierId } from '../shared/entityModel.js';
export function buildVendorActivityAccess({ activity, viewer }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isOwner = Boolean(activity?.vendorId && getViewerSupplierId(viewer) === activity.vendorId);
  return {
    permissionSet,
    ownership: { isOwner },
    participation: {},
    fields: { metadata: isOwner, relatedEntityId: isOwner },
    sections: { activity: isOwner, metadata: isOwner, system: isOwner },
    isOwner,
    canRead: isOwner,
  };
}
