import { Link } from 'react-router-dom';
import GiftFlowHeroSection from '../../ui/entities/giftFlow/sections/GiftFlowHeroSection';
import GiftFlowJourneySection from '../../ui/entities/giftFlow/sections/GiftFlowJourneySection';
import GiftFlowVendorSection from '../../ui/entities/giftFlow/sections/GiftFlowVendorSection';
import GiftFlowConfigurationSection from '../../ui/entities/giftFlow/sections/GiftFlowConfigurationSection';
import GiftFlowAdminActionsSection from '../../ui/entities/giftFlow/sections/GiftFlowAdminActionsSection';
import GiftFlowSystemSection from '../../ui/entities/giftFlow/sections/GiftFlowSystemSection';
import EntityDialog from './EntityDialog';
import { getGiftFlowDisplayName } from '../../ui/entities/giftFlow';

export default function GiftFlowModal({
  entity,
  access,
  actions = [],
  products = [],
  isOpen = true,
  onClose,
  onProductOpen,
  title = 'Gift Flow Details',
  showPublicLink = false,
  loading = false,
  productsLoading = false,
  loadError = '',
  actionLoading = false,
}) {
  if (!isOpen || !entity || !access?.canRead) return null;
  const config = entity.parsedConfiguration;
  const publicLink = showPublicLink && entity.id ? (
    <Link
      to={`/gift-flow/${entity.id}`}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary hover:bg-primary/5"
    >
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">open_in_new</span>
      Flow Page
    </Link>
  ) : null;

  return (
    <EntityDialog isOpen={isOpen} onClose={onClose} title={title || getGiftFlowDisplayName(entity)} eyebrow="Gift Flow">
      <div className="grid gap-4">
        {loading && <div role="status" className="rounded-lg border border-stone-200 bg-white p-4 text-sm font-semibold text-on-surface-variant">Loading complete gift flow details…</div>}
        {productsLoading && <div role="status" className="rounded-lg border border-stone-200 bg-white p-4 text-sm font-semibold text-on-surface-variant">Loading product options…</div>}
        {loadError && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{loadError}</div>}
        {access.sections.hero && <GiftFlowHeroSection flow={entity} config={config} action={publicLink} />}
        {(access.sections.structure || access.sections.products) && (
          <GiftFlowJourneySection config={config} products={products} onProductOpen={onProductOpen} />
        )}
        {access.sections.vendor && <GiftFlowVendorSection flow={entity} />}
        <GiftFlowAdminActionsSection
          flow={entity}
          actions={actions}
          loading={actionLoading}
        />
        {access.sections.configuration && <GiftFlowConfigurationSection flow={entity} config={config} />}
        {access.sections.system && <GiftFlowSystemSection flow={entity} />}
      </div>
    </EntityDialog>
  );
}
