import { useState } from 'react';
import VendorProductsSection from '../../ui/entities/vendor/sections/VendorProductsSection';
import VendorFlowsSection from '../../ui/entities/vendor/sections/VendorFlowsSection';
import EntityDialog from './EntityDialog';
import { getVendorName, VendorDetails } from '../../ui/entities/vendor';

export default function VendorModal({
  entity,
  access,
  actions = [],
  isOpen = true,
  onClose,
  reviewsSlot,
  actionLoading = false,
  title = 'Vendor Details',
  showPublicLink = false,
  showProductsPreview = false,
  showFlowsPreview = false,
  productAccessFor,
  flowAccessFor,
  headerAction,
  renderFlowModal,
}) {
  const [selectedFlow, setSelectedFlow] = useState(null);

  if (!isOpen || !entity || !access?.canRead) return null;
  const vendorId = entity.supplierId;
  const publicLink = showPublicLink && vendorId ? (
    <a
      href={`/vendors/${vendorId}`}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary hover:bg-primary/5"
    >
      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
      Public Store
    </a>
  ) : null;

  const content = (
    <>
      <VendorDetails
        model={entity}
        access={access}
        actions={actions}
        actionLoading={actionLoading}
        headerAction={headerAction || publicLink}
        renderProducts={showProductsPreview
          ? (loadedProducts) => (
            <VendorProductsSection products={loadedProducts} accessFor={productAccessFor} />
          )
          : undefined}
        renderGiftFlows={showFlowsPreview
          ? (loadedFlows) => (
            <VendorFlowsSection
              flows={loadedFlows}
              accessFor={flowAccessFor}
              onPreview={setSelectedFlow}
            />
          )
          : undefined}
        reviewsSlot={reviewsSlot}
      />
      {renderFlowModal?.(selectedFlow, () => setSelectedFlow(null))}
    </>
  );

  return (
    <EntityDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title || getVendorName(entity)}
      eyebrow="Vendor"
    >
      {content}
    </EntityDialog>
  );
}
