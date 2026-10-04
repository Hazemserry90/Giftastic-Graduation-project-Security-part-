import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import {
  formatProductMoney,
  formatProductRating,
  getProductDisplayName,
  getProductDisplayPrice,
  getProductPrimaryImage,
  getProductAvailability,
  PRODUCT_STOCK_STATE,
} from './productSelectors.js';

export default function ProductPublicDetails({
  product,
  access,
  imageFallback,
  favoriteAction,
  reportAction,
  relatedFlows,
  quantityControl,
  primaryAction,
}) {
  const galleryImages = useMemo(() => {
    const images = Array.isArray(product?.images) ? [...product.images] : [];
    return images
      .filter((image) => image?.url)
      .sort((left, right) => {
        if (left.primary && !right.primary) return -1;
        if (!left.primary && right.primary) return 1;
        return (left.displayOrder ?? left.sortOrder ?? 0) - (right.displayOrder ?? right.sortOrder ?? 0);
      });
  }, [product?.images]);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');

  useEffect(() => {
    setSelectedImageUrl(galleryImages[0]?.url || getProductPrimaryImage(product) || imageFallback || '');
  }, [galleryImages, product, imageFallback]);

  if (!product || !access?.canRead) return null;
  const availability = getProductAvailability(product, access);
  const inStock = [PRODUCT_STOCK_STATE.AVAILABLE, PRODUCT_STOCK_STATE.LOW_STOCK].includes(availability);
  const availabilityKnown = availability !== PRODUCT_STOCK_STATE.UNAVAILABLE;
  const mainImageUrl = selectedImageUrl || getProductPrimaryImage(product) || imageFallback;
  return (
    <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-7">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface-container shadow-xl shadow-[#4B2C5E]/5">
          <img alt={getProductDisplayName(product)} className="h-full w-full object-cover" src={mainImageUrl} />
          {favoriteAction && <div className="absolute right-6 top-6">{favoriteAction}</div>}
        </div>
        {galleryImages.length > 1 && (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {galleryImages.map((image, index) => (
              <button
                key={image.id || `${image.url}-${index}`}
                type="button"
                onClick={() => setSelectedImageUrl(image.url)}
                className={`aspect-square overflow-hidden rounded-lg border bg-surface-container transition-all ${
                  image.url === mainImageUrl ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant hover:border-primary/60'
                }`}
                aria-label={`View product image ${index + 1}`}
              >
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col space-y-8 lg:col-span-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-label-sm uppercase tracking-widest text-on-secondary-container">Giftastic selection</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-bold text-on-surface">{formatProductRating(product.averageRating) || '-'}</span>
                <span className="text-sm text-on-surface-variant">({product.reviewCount ?? '-'} reviews)</span>
              </div>
              {reportAction}
            </div>
          </div>
          <h1 className="font-display-xl text-display-xl leading-tight text-primary">{getProductDisplayName(product)}</h1>
          <div className="flex items-baseline space-x-3">
            <p className="font-body-lg text-headline-md font-bold text-on-surface">{formatProductMoney(getProductDisplayPrice(product)) || 'Price unavailable'}</p>
            <span className="font-label-sm text-outline">Incl. VAT</span>
          </div>
        </div>
        <div className="space-y-4">
          {product.description && <p className="font-body-md leading-relaxed text-on-surface-variant">{product.description}</p>}
          {availabilityKnown && (
            <div className="flex items-center space-x-2 text-on-secondary-container">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              <span className="font-label-md">
                {inStock ? 'Available' : <span className="font-bold text-error">Out of stock</span>}
              </span>
            </div>
          )}
          {relatedFlows}
        </div>
        {(!availabilityKnown || inStock) && quantityControl}
        {primaryAction}
      </div>
    </div>
  );
}
