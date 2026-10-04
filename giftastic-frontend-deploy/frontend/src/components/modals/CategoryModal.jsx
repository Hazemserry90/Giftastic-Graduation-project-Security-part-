import EntityDialog from './EntityDialog';
import { CategorySemanticViews, getCategoryDisplayName } from '../../ui/entities/category';

export default function CategoryModal({
  entity,
  access,
  actions = [],
  isOpen = true,
  onClose,
  actionLoading = false,
}) {
  if (!isOpen || !entity || !access?.canRead) return null;
  return (
    <EntityDialog isOpen={isOpen} onClose={onClose} title={getCategoryDisplayName(entity)} eyebrow="Category">
      <CategorySemanticViews.CategoryDetails
        entity={entity}
        access={access}
        actions={actions}
        pendingKey={actionLoading ? actions[0]?.key : null}
      />
    </EntityDialog>
  );
}
