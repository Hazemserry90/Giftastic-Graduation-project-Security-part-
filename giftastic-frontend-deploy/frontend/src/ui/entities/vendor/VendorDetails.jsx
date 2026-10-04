import VendorHeroSection from './sections/VendorHeroSection';
import VendorContactSection from './sections/VendorContactSection';
import VendorSocialSection from './sections/VendorSocialSection';
import VendorStatusSection from './sections/VendorStatusSection';
import VendorSystemSection from './sections/VendorSystemSection';
import VendorActionsSection from './sections/VendorActionsSection';

export default function VendorDetails({
  model,
  access,
  actions = [],
  onAction,
  actionLoading = false,
  headerAction,
  renderProducts,
  renderGiftFlows,
  reviewsSlot,
}) {
  return (
    <div className="grid gap-4">
      <VendorHeroSection model={model} access={access} headerAction={headerAction} />
      <VendorContactSection model={model} access={access} />
      <VendorSocialSection model={model} access={access} />
      {access.sections.products && renderProducts?.(
        model.relations.products.map((reference) => reference.snapshot).filter(Boolean)
      )}
      {access.sections.giftFlows && renderGiftFlows?.(
        model.relations.giftFlows.map((reference) => reference.snapshot).filter(Boolean)
      )}
      {reviewsSlot}
      <VendorStatusSection model={model} access={access} />
      <VendorActionsSection model={model} actions={actions} onAction={onAction} loading={actionLoading} />
      <VendorSystemSection model={model} access={access} />
    </div>
  );
}
