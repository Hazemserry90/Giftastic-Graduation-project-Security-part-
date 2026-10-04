import { hasEntityIdentity, hasLoadedEntityField } from '../shared/entityModel.js';

export function buildNotificationActions({ notification, access, handlers = {} }) {
  if (
    !access.canRead
    || !hasEntityIdentity(notification)
    || !hasLoadedEntityField(notification, 'read')
    || notification.read !== false
    || typeof handlers.markRead !== 'function'
  ) return [];
  return [{ key: 'markRead', label: 'Mark as read', onSelect: handlers.markRead }];
}

export function buildNotificationCollectionActions({ notifications = [], unreadCount = 0, accessFor, handlers = {} }) {
  const hasReadableUnread = unreadCount > 0 || notifications.some((notification) => {
    const access = accessFor?.(notification);
    return access?.canRead && hasLoadedEntityField(notification, 'read') && notification.read === false;
  });
  if (!hasReadableUnread || typeof handlers.markAllRead !== 'function') return [];
  return [{ key: 'markAllRead', label: 'Mark all as read', onSelect: handlers.markAllRead }];
}
