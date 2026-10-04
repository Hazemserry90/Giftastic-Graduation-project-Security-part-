import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Bell } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuthStore } from '../store/useAuthStore';
import { getFriendlyErrorMessage } from '../services/api';
import NotificationModal from '../components/modals/NotificationModal';
import {
  buildNotificationAccess,
  buildNotificationActions,
  buildNotificationCollectionActions,
  NotificationSummary,
  NOTIFICATION_CONTEXT,
} from '../ui/entities/notification';
import { loadNotificationWorkflow, markAllNotificationsRead, markNotificationRead } from '../ui/workflows/notificationWorkflow';

export default function Notifications() {
  const user = useAuthStore((state) => state.user);
  const viewer = useAuthStore((state) => state.viewer);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const result = await loadNotificationWorkflow();
      setNotifications(result.notifications);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not load notifications. Please refresh and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      await fetchNotifications();
      setSelectedNotification(null);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not update this notification. Please try again.'));
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      await fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not update notifications. Please try again.'));
    }
  };
  const notificationAccess = (notification) => buildNotificationAccess({
    notification,
    viewer,
    context: NOTIFICATION_CONTEXT.OWNER,
  });
  const collectionActions = buildNotificationCollectionActions({
    notifications,
    accessFor: notificationAccess,
    handlers: { markAllRead: markAllAsRead },
  });
  const markAllAction = collectionActions.find((action) => action.key === 'markAllRead');

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <header className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-8 h-8 text-primary" />
              <h1 className="font-display-xl text-headline-lg text-primary">Notifications</h1>
            </div>
            <p className="font-body-md text-on-surface-variant max-w-2xl">
              Stay updated with your orders, gift reminders, and personalized artisanal offers.
            </p>
          </div>
          
          {markAllAction && (
            <button 
              onClick={markAllAction.onSelect}
              className="text-sm font-bold text-primary hover:underline pb-1"
            >
              Mark all as read
            </button>
          )}
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-outline-variant shadow-sm">
                <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bell className="w-10 h-10 text-primary/30" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">No notifications yet</h3>
                <p className="text-on-surface-variant font-body-md mb-8 max-w-sm mx-auto">We'll let you know when something important happens.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-plum border border-outline-variant overflow-hidden">
                <div className="divide-y divide-outline-variant">
                  {notifications.map((notification) => (
                    <NotificationSummary
                      key={notification.id}
                      notification={notification}
                      access={notificationAccess(notification)}
                      onSelect={setSelectedNotification}
                      onMarkRead={markAsRead}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <NotificationModal
        isOpen={!!selectedNotification}
        entity={selectedNotification}
        access={selectedNotification ? buildNotificationAccess({
          notification: selectedNotification,
          viewer,
          context: NOTIFICATION_CONTEXT.OWNER,
        }) : null}
        actions={selectedNotification ? buildNotificationActions({
          notification: selectedNotification,
          access: buildNotificationAccess({ notification: selectedNotification, viewer, context: NOTIFICATION_CONTEXT.OWNER }),
          handlers: { markRead: () => markAsRead(selectedNotification.id) },
        }) : []}
        onClose={() => setSelectedNotification(null)}
      />
      <Footer />
    </div>
  );
}
