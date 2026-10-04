import {
  buildEntityPermissionSet,
  getViewerSupplierId,
  hasEntityPermission,
} from '../shared/entityModel.js';

export const COMMISSION_CONTEXT = Object.freeze({ OWNER: 'OWNER', ADMIN: 'ADMIN', SYSTEM: 'SYSTEM' });

export function buildCommissionAccess({ commission, viewer, context = COMMISSION_CONTEXT.OWNER }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isOwner = Boolean(commission?.supplierId && getViewerSupplierId(viewer) === commission.supplierId);
  const admin = [COMMISSION_CONTEXT.ADMIN, COMMISSION_CONTEXT.SYSTEM].includes(context);
  const isPlatformPayout = commission?.direction === 'PLATFORM_TO_VENDOR';
  const canManageVendorPayouts = admin && hasEntityPermission(permissionSet, 'MANAGE_VENDOR_PAYOUTS');
  const canUrgePayment = admin && !isPlatformPayout && hasEntityPermission(permissionSet, 'URGE_COMMISSION_PAYMENT');
  const canSubmitPayment = (isOwner && !isPlatformPayout) || (canManageVendorPayouts && isPlatformPayout);
  const canViewFinancials = isOwner
    || (admin && hasEntityPermission(permissionSet, 'VIEW_FINANCIAL_DATA'))
    || canUrgePayment
    || canManageVendorPayouts;
  return {
    permissionSet,
    isOwner,
    canRead: canViewFinancials,
    canSubmitPayment,
    canUrgePayment,
    canViewSystem: admin && permissionSet.has('SUPER_ADMIN'),
  };
}
