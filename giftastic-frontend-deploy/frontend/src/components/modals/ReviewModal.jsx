import EntityDialog from './EntityDialog';
import { ReviewSemanticViews } from '../../ui/entities/review';

export default function ReviewModal({
  entity,
  access,
  actions = [],
  isOpen = true,
  onClose,
  title = 'Review Details',
  actionLoading = false,
  children,
}) {
  if (!isOpen || !entity || !access?.canRead) return null;

  return (
    <EntityDialog isOpen={isOpen} onClose={onClose} title={title} eyebrow="Review" maxWidth="max-w-4xl">
      {children}
      <ReviewSemanticViews.ReviewDetails
        entity={entity}
        access={access}
        actions={actions}
        pendingKey={actionLoading ? actions[0]?.key : null}
      />
    </EntityDialog>
  );
}
