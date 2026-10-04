import { hasLoadedEntityField } from '../shared/entityModel';
import { buildNotificationActions } from './notificationActions';
import { formatNotificationDate, getNotificationIcon } from './notificationSelectors';

export default function NotificationSummary({
  notification,
  access,
  onSelect,
  onMarkRead,
  compact = false,
}) {
  if (!notification || !access?.canRead) return null;
  const actions = buildNotificationActions({
    notification,
    access,
    handlers: { markRead: onMarkRead },
  });
  const unread = hasLoadedEntityField(notification, 'read') && notification.read === false;

  return (
    <article
      role={typeof onSelect === 'function' ? 'button' : undefined}
      tabIndex={typeof onSelect === 'function' ? 0 : undefined}
      onClick={() => onSelect?.(notification)}
      onKeyDown={(event) => event.key === 'Enter' && onSelect?.(notification)}
      className={`${compact ? 'p-4' : 'p-6'} flex gap-4 text-left transition-all cursor-pointer ${
        unread ? 'bg-primary/5 border-l-4 border-l-primary' : 'bg-transparent border-l-4 border-l-transparent'
      }`}
    >
      <div className={`${compact ? 'w-8 h-8' : 'w-12 h-12 rounded-2xl'} rounded-full flex-shrink-0 flex items-center justify-center ${unread ? 'bg-primary/10' : 'bg-surface-container'}`}>
        <span className="material-symbols-outlined text-primary">{getNotificationIcon(notification.type)}</span>
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start gap-3 mb-1">
          {hasLoadedEntityField(notification, 'title') && (
            <h3 className={`${compact ? 'text-sm' : ''} ${unread ? 'font-bold text-primary' : 'text-on-surface'}`}>
              {notification.title}
            </h3>
          )}
          {hasLoadedEntityField(notification, 'createdAt') && notification.createdAt && (
            <span className="text-xs text-on-surface-variant whitespace-nowrap">
              {formatNotificationDate(notification.createdAt)}
            </span>
          )}
        </div>
        {hasLoadedEntityField(notification, 'message') && notification.message && (
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-on-surface-variant line-clamp-2`}>
            {notification.message}
          </p>
        )}
        {!compact && actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              action.onSelect(notification.id);
            }}
            className="mt-4 text-xs font-bold text-primary bg-primary/10 px-4 py-1.5 rounded-full hover:bg-primary hover:text-on-primary"
          >
            {action.label}
          </button>
        ))}
      </div>
    </article>
  );
}
