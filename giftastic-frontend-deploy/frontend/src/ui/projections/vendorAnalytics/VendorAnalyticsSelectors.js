export const selectVendorAnalyticsData = (projection) => projection?.projectionType === 'vendorAnalytics' ? projection.data : null;

export const selectVendorAnalyticsOrderStatusLabel = (status) => ({
  PENDING: 'Pending',
  PAID: 'Paid',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  WAITING_FOR_RELEASE: 'Waiting for release',
  IN_PROGRESS: 'In progress',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DONE: 'Done',
  INVALID: 'Invalid',
}[status] || 'Unknown');
