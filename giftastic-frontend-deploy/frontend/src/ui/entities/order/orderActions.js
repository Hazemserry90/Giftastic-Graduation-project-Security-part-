import { hasEntityIdentity, hasLoadedEntityField } from '../shared/entityModel.js';

export const ORDER_STATUSES = Object.freeze([
  'PENDING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);

export const ACTIVE_ORDER_STATUSES = Object.freeze([
  'PENDING_CONFIRMATION', 'IN_PROGRESS', 'OUT_FOR_DELIVERY', 'DONE', 'INVALID',
]);

const VENDOR_FORWARD_STATUS = Object.freeze({
  WAITING_FOR_RELEASE: 'IN_PROGRESS',
  PENDING: 'PAID',
  PAID: 'SHIPPED',
  SHIPPED: 'DELIVERED',
  IN_PROGRESS: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DONE',
});

export function getOrderStatusOptions(order, access) {
  const current = order?.status;
  if (!current || !access?.sections?.statusControls) return current ? [current] : [];
  if (access.canManageAllStatuses) {
    if (current === 'INVALID') return [current];
    if (order?.paymentMethod === 'INSTAPAY' && ACTIVE_ORDER_STATUSES.includes(current)) {
      return [current];
    }
    return ACTIVE_ORDER_STATUSES.includes(current)
      ? ACTIVE_ORDER_STATUSES.filter((status) => status !== 'INVALID')
      : ORDER_STATUSES;
  }
  if (access.isParticipatingVendor) {
    return [current, VENDOR_FORWARD_STATUS[current]].filter(Boolean);
  }
  return ORDER_STATUSES;
}

export function buildOrderActions({ order, access, handlers = {} }) {
  if (!hasEntityIdentity(order) || !hasLoadedEntityField(order, 'status')) return [];
  const actions = [];
  if (access.sections.customerActions && typeof handlers.cancel === 'function') {
    actions.push({ key: 'cancel', label: 'Cancel order', tone: 'danger', onSelect: handlers.cancel });
  }
  if (access.sections.statusControls && typeof handlers.changeStatus === 'function') {
    actions.push({ key: 'changeStatus', label: 'Change status', onSelect: handlers.changeStatus });
  }
  if (access.sections.statusControls && typeof handlers.updateEstimate === 'function') {
    actions.push({ key: 'updateEstimate', label: 'Update delivery estimate', onSelect: handlers.updateEstimate });
  }
  if (access.sections.statusControls && typeof handlers.notifyDelay === 'function') {
    actions.push({ key: 'notifyDelay', label: 'Notify delivery delay', onSelect: handlers.notifyDelay });
  }
  return actions;
}
