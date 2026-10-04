import {
  buildEntityPermissionSet,
  getViewerSupplierId,
  hasEntityPermission,
} from '../shared/entityModel.js';

export const COMMISSION_PAYMENT_REQUEST_CONTEXT = Object.freeze({ OWNER: 'OWNER', ADMIN: 'ADMIN', SYSTEM: 'SYSTEM' });

export function buildCommissionPaymentRequestAccess({ request, viewer, context = COMMISSION_PAYMENT_REQUEST_CONTEXT.OWNER }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isOwner = Boolean(request?.supplierId && getViewerSupplierId(viewer) === request.supplierId);
  const admin = [COMMISSION_PAYMENT_REQUEST_CONTEXT.ADMIN, COMMISSION_PAYMENT_REQUEST_CONTEXT.SYSTEM].includes(context);
  const isVendorReceiver = isOwner && request?.direction === 'PLATFORM_TO_VENDOR';
  const isPlatformSender = admin && request?.direction === 'PLATFORM_TO_VENDOR'
    && hasEntityPermission(permissionSet, 'MANAGE_VENDOR_PAYOUTS');
  const canReview = isVendorReceiver
    || (admin && request?.direction !== 'PLATFORM_TO_VENDOR'
      && hasEntityPermission(permissionSet, 'REVIEW_COMMISSION_PAYMENTS'));
  return {
    permissionSet,
    isOwner,
    canRead: isOwner || canReview || isPlatformSender,
    canViewProof: isOwner || canReview || isPlatformSender,
    canReview,
    canMessage: isPlatformSender || (isOwner && request?.direction === 'VENDOR_TO_PLATFORM'),
    canViewSystem: admin && permissionSet.has('SUPER_ADMIN'),
  };
}
