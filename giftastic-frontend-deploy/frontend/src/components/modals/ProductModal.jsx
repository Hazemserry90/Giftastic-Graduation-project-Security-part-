import { Link } from 'react-router-dom';
import ProductHeroSection from '../../ui/entities/product/sections/ProductHeroSection';
import ProductTaxonomySection from '../../ui/entities/product/sections/ProductTaxonomySection';
import ProductDetailsSection from '../../ui/entities/product/sections/ProductDetailsSection';
import ProductInventorySection from '../../ui/entities/product/sections/ProductInventorySection';
import ProductVendorInfoSection from '../../ui/entities/product/sections/ProductVendorInfoSection';
import ProductSeoSection from '../../ui/entities/product/sections/ProductSeoSection';
import ProductAdminActionsSection from '../../ui/entities/product/sections/ProductAdminActionsSection';
import ProductSystemSection from '../../ui/entities/product/sections/ProductSystemSection';
import EntityDialog from './EntityDialog';
import { getProductDisplayName } from '../../ui/entities/product';

export default function ProductModal({
  entity,
  access,
  actions = [],
  isOpen = true,
  onClose,
  title = 'Product Details',
  showPublicLink = false,
  actionLoading = false,
  loading = false,
  loadError = '',
}) {
  if (!isOpen || !entity || !access?.canRead) return null;

  const publicLink = showPublicLink && entity.id ? (
    <Link
      to={`/products/${entity.id}`}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary hover:bg-primary/5"
    >
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">open_in_new</span>
      Product Page
    </Link>
  ) : null;

  const content = (
    <div className="grid gap-4">
      {loading && <div role="status" className="rounded-lg border border-stone-200 bg-white p-4 text-sm font-semibold text-on-surface-variant">Loading complete product details…</div>}
      {loadError && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{loadError}</div>}
      {access.sections.hero && <ProductHeroSection product={entity} action={publicLink} showStatus={access.fields.status} />}
      {access.sections.categories && <ProductTaxonomySection product={entity} />}
      {access.sections.giftOptions && <ProductDetailsSection product={entity} type="gift" />}
      <div className="grid gap-4 lg:grid-cols-2">
        {access.sections.delivery && <ProductDetailsSection product={entity} type="delivery" />}
        {access.sections.recipient && <ProductDetailsSection product={entity} type="recipient" />}
        {access.sections.composition && <ProductDetailsSection product={entity} type="composition" />}
        {access.sections.inventory && <ProductInventorySection product={entity} />}
      </div>
      {access.sections.vendorInfo && <ProductVendorInfoSection product={entity} />}
      {access.sections.seo && <ProductSeoSection product={entity} />}
      <ProductAdminActionsSection product={entity} actions={actions} loading={actionLoading} />
      {access.sections.system && <ProductSystemSection product={entity} />}
    </div>
  );

  return (
    <EntityDialog isOpen={isOpen} onClose={onClose} title={title || getProductDisplayName(entity)} eyebrow="Product">
      {content}
    </EntityDialog>
  );
}
