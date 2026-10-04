import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import {
  formatProductMoney,
  formatProductRating,
  getProductDisplayName,
  getProductDisplayPrice,
  getProductPrimaryImage,
  getProductAvailability,
  PRODUCT_STOCK_STATE,
} from './productSelectors';

export default function ProductSummary({ product, access, to, action, compact = false }) {
  if (!product || !access?.canRead) return null;
  const image = getProductPrimaryImage(product);
  const availability = getProductAvailability(product, access);

  const imageContent = (
    <div className={compact
      ? 'relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-50'
      : 'relative aspect-square overflow-hidden rounded-lg bg-stone-100'}>
      {image ? (
        <img
          src={image}
          alt={getProductDisplayName(product)}
          className={compact ? 'h-full w-full object-contain p-1' : 'h-full w-full object-cover'}
        />
      ) : (
        <div className="flex h-full items-center justify-center px-2 text-center text-xs text-on-surface-variant">
          No image
        </div>
      )}
      {availability === PRODUCT_STOCK_STATE.OUT_OF_STOCK && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-1 text-center text-xs font-bold text-white">
          Out of stock
        </div>
      )}
    </div>
  );

  const detailsContent = (
    <div className={compact ? 'min-w-0 flex-1' : 'mt-4'}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="truncate font-bold text-primary">{getProductDisplayName(product)}</h3>
        {!compact && product.averageRating !== null && product.averageRating !== undefined && (
          <span className="text-sm font-semibold text-primary">★ {formatProductRating(product.averageRating)}</span>
        )}
      </div>
      {!compact && product.description && (
        <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">{product.description}</p>
      )}
      <p className={`${compact ? 'mt-1 text-sm' : 'mt-2'} font-bold text-primary`}>
        {formatProductMoney(getProductDisplayPrice(product))}
      </p>
    </div>
  );

  const content = compact ? (
    <div className="flex min-w-[15rem] items-center gap-3">
      {imageContent}
      {detailsContent}
    </div>
  ) : (
    <>
      {imageContent}
      {detailsContent}
    </>
  );

  if (to && action) {
    return (
      <article className="overflow-hidden rounded-xl bg-white">
        <Link to={to} className="group block">{content}</Link>
        <div className="px-4 pb-4">{action}</div>
      </article>
    );
  }
  return to ? <Link to={to} className="group block">{content}</Link> : <div>{content}{action}</div>;
}
