import EntityDialog from './EntityDialog';
import { NotificationSemanticViews } from '../../ui/entities/notification';

export default function NotificationModal({ entity, access, actions = [], isOpen = true, onClose, actionLoading = false }) {
  if (!isOpen || !entity || !access?.canRead) return null;
  return (
    <EntityDialog isOpen={isOpen} onClose={onClose} title={entity.title || 'Notification'} eyebrow="Notification">
      <NotificationSemanticViews.NotificationDetails entity={entity} access={access} actions={actions} pendingKey={actionLoading ? actions[0]?.key : null} />
    </EntityDialog>
  );
}
