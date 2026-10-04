import {
  buildEntityPermissionSet,
  getViewerSupplierId,
  getViewerUserId,
  hasEntityPermission,
} from '../shared/entityModel.js';

export const ORDER_CONTEXT = Object.freeze({
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
  ADMIN: 'ADMIN',
  FINANCIAL: 'FINANCIAL',
  SYSTEM: 'SYSTEM',
});

export function buildOrderAccess({ order, viewer, context = ORDER_CONTEXT.CUSTOMER, relationship = {} }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const viewerUserId = getViewerUserId(viewer);
  const viewerSupplierId = getViewerSupplierId(viewer);
  const isCustomer = Boolean(order?.customerId && viewerUserId === order.customerId);
  const isGuestCustomerContext = context === ORDER_CONTEXT.CUSTOMER
    && !order?.customerId && relationship.isGuestSessionAuthorized === true;
  const vendorItems = (order?.items || []).filter((item) => item.supplierId === viewerSupplierId);
  const isParticipatingVendor = Boolean(viewerSupplierId && vendorItems.length);
  const admin = [ORDER_CONTEXT.ADMIN, ORDER_CONTEXT.FINANCIAL, ORDER_CONTEXT.SYSTEM].includes(context);
  const canViewAll = admin && hasEntityPermission(permissionSet, 'VIEW_ORDERS');
  const canManageAllStatuses = admin && hasEntityPermission(permissionSet, 'MANAGE_ORDER_STATUS');
  const canInvalidateVendorPortions = admin && hasEntityPermission(permissionSet, 'MANAGE_ORDERS');
  const canRead = isCustomer || isGuestCustomerContext || isParticipatingVendor || canViewAll;
  const canViewFinancials = isCustomer || isGuestCustomerContext
    || (admin && hasEntityPermission(permissionSet, 'VIEW_FINANCIAL_DATA'));
  const canViewPaymentDetails = isCustomer || isGuestCustomerContext || canViewAll;
  const shouldScopeToVendorPortion = isParticipatingVendor
    && !isCustomer
    && !isGuestCustomerContext
    && !canViewAll;
  return {
    permissionSet,
    viewerSupplierId,
    isCustomer,
    isParticipatingVendor,
    canManageAllStatuses,
    canInvalidateVendorPortions,
    visibleItems: shouldScopeToVendorPortion ? vendorItems : order.items,
    canViewSystem: context === ORDER_CONTEXT.SYSTEM && permissionSet.has('SUPER_ADMIN'),
    canRead,
    fields: { deliveryCost: canViewFinancials, paymentDetails: canViewPaymentDetails },
    sections: {
      header: canRead,
      items: canRead,
      summary: canViewFinancials || isParticipatingVendor,
      shipping: canRead,
      payment: isCustomer || isGuestCustomerContext || isParticipatingVendor
        || (admin && hasEntityPermission(permissionSet, 'VIEW_ORDERS')),
      customer: isParticipatingVendor || canViewAll,
      statusControls: isParticipatingVendor || canManageAllStatuses,
      customerActions: (isCustomer || isGuestCustomerContext) && order.status === 'PENDING_CONFIRMATION',
      vendorProgress: context !== ORDER_CONTEXT.CUSTOMER && canRead,
      commission: admin && hasEntityPermission(permissionSet, 'VIEW_FINANCIAL_DATA'),
      assistance: context !== ORDER_CONTEXT.CUSTOMER
        && (isParticipatingVendor || (admin && hasEntityPermission(permissionSet, 'REVIEW_ORDER_ASSISTANCE'))),
      system: context === ORDER_CONTEXT.SYSTEM && permissionSet.has('SUPER_ADMIN'),
    },
  };
}
