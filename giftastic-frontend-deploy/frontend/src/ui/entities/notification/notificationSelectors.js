import { formatEntityDateTime } from '../shared/date.js';
import { hasLoadedEntityField } from '../shared/entityModel.js';

export function formatNotificationDate(value) {
  return formatEntityDateTime(value);
}

export const getNotificationIcon = (type) => ({
  ORDER_STATUS_UPDATE: 'package_2',
  VENDOR_ALERT: 'storefront',
  SYSTEM_ALERT: 'warning',
  PROMOTION: 'check_circle',
}[type] || 'info');

export const isNotificationUnread = (notification) =>
  hasLoadedEntityField(notification, 'read') && notification.read === false;

export const hasUnreadNotifications = (notifications = []) => notifications.some(isNotificationUnread);
