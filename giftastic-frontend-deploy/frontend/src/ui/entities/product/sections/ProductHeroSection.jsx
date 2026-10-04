// Canonical Product presentation section.
import ProductSection from './ProductSection';
import ProductImage from '../ProductImage';
import {
  formatProductMoney,
  formatProductRating,
  getProductOriginalPrice,
  getProductDisplayName,
  getProductDisplayPrice,
  getProductPrimaryImage,
  getProductStatusClass,
} from '../productSelectors';

export default function ProductHeroSection({ product, action, showStatus = false }) {
  const currentPrice = getProductDisplayPrice(product);
  const originalPrice = getProductOriginalPrice(product);
  const hasDiscount = product?.hasActiveDiscount || Number(product?.discountPercentage || 0) > 0;

  return (
    <ProductSection title="Product" icon="inventory_2" action={action}>
      <div className="grid min-w-0 gap-5 md:grid-cols-[144px_minmax(0,1fr)]">
        <div
          className="relative aspect-square w-36 max-w-full justify-self-center overflow-hidden rounded-lg bg-stone-100 md:justify-self-start"
          style={{ maxHeight: '144px' }}
        >
          <ProductImage
            src={getProductPrimaryImage(product)}
            alt={getProductDisplayName(product)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {showStatus && product?.status && (
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getProductStatusClass(product.status)}`}>
                {product.status}
              </span>
            )}
            {product?.inStock === false && (
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                Out of stock
              </span>
            )}
            {hasDiscount && (
              <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                {Number(product.discountPercentage || 0)}% off
              </span>
            )}
          </div>
          <h3 className="break-words font-headline-md text-2xl font-bold text-primary">
            {getProductDisplayName(product)}
          </h3>
          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <p className="text-2xl font-bold text-primary">{formatProductMoney(currentPrice)}</p>
            {hasDiscount && originalPrice !== currentPrice && (
              <p className="text-sm font-semibold text-on-surface-variant line-through">
                {formatProductMoney(originalPrice)}
              </p>
            )}
          </div>
          {(product?.averageRating !== undefined || product?.reviewCount !== undefined) && (
            <p className="mt-3 text-sm font-semibold text-on-surface-variant">
              Rating {formatProductRating(product.averageRating) || '-'} &middot; {product.reviewCount ?? '-'} reviews
            </p>
          )}
          {product?.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-on-surface-variant">
              {product.description}
            </p>
          )}
        </div>
      </div>
    </ProductSection>
  );
}
