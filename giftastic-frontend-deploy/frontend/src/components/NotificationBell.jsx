import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import NotificationModal from './modals/NotificationModal';
import {
  buildNotificationAccess,
  buildNotificationActions,
  buildNotificationCollectionActions,
  NotificationSummary,
  NOTIFICATION_CONTEXT,
} from '../ui/entities/notification';
import { loadNotificationWorkflow, markAllNotificationsRead, markNotificationRead } from '../ui/workflows/notificationWorkflow';

export default function NotificationBell() {
  const viewer = useAuthStore((state) => state.viewer);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const result = await loadNotificationWorkflow({ limit: 5 });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setSelectedNotification(null);
      await fetchNotifications();
    } catch {
      await fetchNotifications();
    }
  };

  const notificationAccess = (notification) => buildNotificationAccess({
    notification,
    viewer,
    context: NOTIFICATION_CONTEXT.OWNER,
  });
  const markAllAction = buildNotificationCollectionActions({
    notifications,
    unreadCount,
    accessFor: notificationAccess,
    handlers: {
      markAllRead: async () => {
        await markAllNotificationsRead();
        await fetchNotifications();
      },
    },
  }).find((action) => action.key === 'markAllRead');

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="giftastic-nav-action"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded border border-[#eadfd7] bg-white shadow-xl shadow-primary/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h3 className="font-bold text-primary">Notifications</h3>
            {markAllAction && (
              <button 
                onClick={markAllAction.onSelect}
                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <Bell className="w-8 h-8 text-on-surface-variant/20 mx-auto mb-2" />
                <p className="text-sm text-on-surface-variant">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant">
                {notifications.map((notification) => (
                  <NotificationSummary
                    key={notification.id}
                    notification={notification}
                    access={notificationAccess(notification)}
                    compact
                    onSelect={(entity) => {
                      setSelectedNotification(entity);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <Link 
            to="/notifications" 
            onClick={() => setIsOpen(false)}
            className="block py-3 text-center text-xs font-bold text-primary bg-surface-container-low border-t border-outline-variant hover:bg-surface-container transition-colors"
          >
            View All Notifications
          </Link>
        </div>
      )}
      <NotificationModal
        isOpen={!!selectedNotification}
        entity={selectedNotification}
        access={selectedNotification ? buildNotificationAccess({ notification: selectedNotification, viewer, context: NOTIFICATION_CONTEXT.OWNER }) : null}
        actions={selectedNotification ? buildNotificationActions({
          notification: selectedNotification,
          access: buildNotificationAccess({ notification: selectedNotification, viewer, context: NOTIFICATION_CONTEXT.OWNER }),
          handlers: { markRead: () => markAsRead(selectedNotification.id) },
        }) : []}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );
}
