import { buildEntityPermissionSet, getViewerSupplierId, hasEntityPermission } from '../shared/entityModel.js';
import { hasLoadedEntityField } from '../shared/entityModel.js';

export const ORDER_ASSISTANCE_CONTEXT = Object.freeze({ VENDOR: 'VENDOR', ADMIN: 'ADMIN', SYSTEM: 'SYSTEM' });

export function buildOrderAssistanceAccess({ request, viewer, context }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isVendorOwner = Boolean(request?.supplierId && getViewerSupplierId(viewer) === request.supplierId);
  const admin = [ORDER_ASSISTANCE_CONTEXT.ADMIN, ORDER_ASSISTANCE_CONTEXT.SYSTEM].includes(context);
  const canReview = admin && hasEntityPermission(permissionSet, 'REVIEW_ORDER_ASSISTANCE');
  const statusLoaded = hasLoadedEntityField(request, 'status');
  const isClosed = statusLoaded && request.status === 'CLOSED';
  return {
    permissionSet, isVendorOwner, canRead: isVendorOwner || canReview,
    canReply: (isVendorOwner || canReview) && statusLoaded && !isClosed,
    canResolve: canReview && statusLoaded && !['RESOLVED', 'CLOSED'].includes(request.status),
    canGiveResolutionFeedback: isVendorOwner && statusLoaded && request.status === 'RESOLVED',
    canViewSystem: context === ORDER_ASSISTANCE_CONTEXT.SYSTEM && permissionSet.has('SUPER_ADMIN'),
  };
}
