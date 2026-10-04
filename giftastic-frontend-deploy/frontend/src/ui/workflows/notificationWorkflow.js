import { notificationService } from '../../services/notificationService.js';
import { adaptEntityFromNamedSource } from '../entities/namedAdapters.js';

export async function loadNotificationWorkflow({ limit } = {}) {
  const [records, unreadCount] = await Promise.all([
    notificationService.getNotifications(),
    notificationService.getUnreadCount(),
  ]);
  const notifications = (records || []).map((record) => adaptEntityFromNamedSource('adaptNotificationOwnerRecord', record));
  return { notifications: limit ? notifications.slice(0, limit) : notifications, unreadCount };
}

export const markNotificationRead = (id) => notificationService.markAsRead(id);
export const markAllNotificationsRead = () => notificationService.markAllAsRead();
