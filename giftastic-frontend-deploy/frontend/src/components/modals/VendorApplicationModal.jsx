import EntityDialog from './EntityDialog';
import { getVendorApplicationDisplayName, VendorApplicationSemanticViews } from '../../ui/entities/vendorApplication';

export default function VendorApplicationModal({
  entity,
  access,
  actions = [],
  isOpen = true,
  onClose,
  actionLoading = false,
  pendingKey,
  children,
}) {
  if (!isOpen || !entity || !access?.canRead) return null;
  return (
    <EntityDialog
      isOpen={isOpen}
      onClose={onClose}
      title={getVendorApplicationDisplayName(entity)}
      eyebrow="Vendor Application"
      maxWidth="max-w-5xl"
    >
      {children}
      <VendorApplicationSemanticViews.VendorApplicationDetails
        entity={entity}
        access={access}
        actions={actions}
        pendingKey={pendingKey || (actionLoading ? actions[0]?.key : null)}
      />
    </EntityDialog>
  );
}
