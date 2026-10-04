import { addDecimals, formatMoney, multiplyDecimal } from '../shared/decimal.js';
import { formatEntityDateTime } from '../shared/date.js';
import { safeParseJson } from '../shared/entityModel.js';

export const getShortOrderId = (order) => order?.id ? String(order.id).slice(0, 8).toUpperCase() : 'UNKNOWN';
export const formatOrderMoney = (value) => formatMoney(value);
export const formatOrderDeliveryCost = (value, freeLabel = 'Free') => {
  const normalized = formatMoney(value);
  return normalized === '0 EGP' ? freeLabel : normalized;
};

export function sumOrderAmounts(values = []) {
  return values.reduce((total, value) => value === null || total === null
    ? null
    : addDecimals(total, value), '0');
}

export function sumVisibleOrderTotals(orders = [], accessForOrder) {
  return sumOrderAmounts(orders.map((order) => getOrderVisibleTotal(order, accessForOrder(order))));
}

export function getOrderItemsTotal(items = []) {
  let total = '0';
  for (const item of items) {
    if (item?.price === null || item?.price === undefined
      || item?.quantity === null || item?.quantity === undefined
      || !Number.isSafeInteger(item.quantity)) return null;
    const itemTotal = multiplyDecimal(item.price, String(item.quantity));
    if (itemTotal === null) return null;
    total = addDecimals(total, itemTotal);
  }
  return total;
}

export function getOrderVisibleTotal(order, access) {
  if (!order) return null;
  if (!access?.isParticipatingVendor || access?.isCustomer) return order.totalAmount;

  return getOrderItemsTotal(access.visibleItems);
}

export function formatOrderDate(value, options) {
  return formatEntityDateTime(value, options);
}

export function parseOrderMetadata(metadata) {
  if (!metadata) return [];
  const result = safeParseJson(metadata);
  if (!result.ok || !result.value || typeof result.value !== 'object' || Array.isArray(result.value)) return [];
  const parsed = result.value;
  return Object.entries(parsed).filter(([key, value]) =>
    !['flowId', 'flowStepId', 'productId', 'selectedAt'].includes(key)
    && value !== null && value !== undefined && value !== ''
    && ['string', 'number', 'boolean'].includes(typeof value))
    .map(([key, value]) => ({
      key,
      label: key.replace(/([A-Z])/g, ' $1').trim(),
      value: String(value),
    }));
}

export function getOrderStatusClass(status) {
  if (status === 'DONE') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'OUT_FOR_DELIVERY') return 'bg-blue-50 text-blue-700 border-blue-100';
  if (status === 'INVALID') return 'bg-red-50 text-red-700 border-red-100';
  if (status === 'PENDING_CONFIRMATION') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (status === 'DELIVERED') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'SHIPPED') return 'bg-blue-50 text-blue-700 border-blue-100';
  if (status === 'CANCELLED') return 'bg-red-50 text-red-700 border-red-100';
  if (status === 'PENDING') return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-primary/5 text-primary border-primary/20';
}

export const getOrderStatusLabel = (status) => ({
  PENDING_CONFIRMATION: 'Pending confirmation',
  IN_PROGRESS: 'In progress',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DONE: 'Done',
  INVALID: 'Invalid',
  WAITING_FOR_RELEASE: 'Waiting for release',
  PENDING: 'Pending',
  PAID: 'Paid',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}[status] || 'Unknown');

export const isOrderPendingConfirmation = (order) => order?.status === 'PENDING_CONFIRMATION';

export function getOrderPaymentWindowState(order, now = Date.now()) {
  const lockedAt = order?.paymentMethodLockedAt ? Date.parse(order.paymentMethodLockedAt) : Number.NaN;
  const secondsLeft = Number.isFinite(lockedAt) ? Math.max(0, Math.ceil((lockedAt - now) / 1000)) : 0;
  return { open: secondsLeft > 0, secondsLeft };
}

export function getVendorFinancialReleaseWindow(order, supplierId, now = Date.now()) {
  const releaseAt = supplierId && order?.vendorFinancialReleaseAt?.[supplierId]
    ? Date.parse(order.vendorFinancialReleaseAt[supplierId])
    : Number.NaN;
  const secondsLeft = Number.isFinite(releaseAt) ? Math.max(0, Math.ceil((releaseAt - now) / 1000)) : 0;
  return {
    releaseAt: Number.isFinite(releaseAt) ? new Date(releaseAt) : null,
    open: secondsLeft > 0,
    secondsLeft,
    finished: Number.isFinite(releaseAt) && secondsLeft === 0,
  };
}

export function formatCountdown(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function matchesOrderSearch(order, query, access) {
  if (!access?.canRead) return false;
  const term = String(query || '').trim().toLowerCase();
  if (!term) return true;
  const customerFields = access.sections?.customer
    ? [order?.customerName, order?.customerId, order?.customerEmail]
    : [];
  return [order?.id, order?.status, ...customerFields]
    .some((value) => String(value || '').toLowerCase().includes(term));
}
