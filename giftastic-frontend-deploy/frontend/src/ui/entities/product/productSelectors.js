import { hasLoadedProductField } from './productModel.js';
import { addDecimals, formatDecimal, formatMoney } from '../shared/decimal.js';
import { formatEntityDateTime } from '../shared/date.js';

export function getProductDisplayName(product) {
  return product?.name || 'Unknown Product';
}

export function getProductDisplayPrice(product) {
  return product?.currentPrice ?? product?.price ?? null;
}

export function getProductOriginalPrice(product) {
  return product?.customerOriginalPrice ?? product?.price ?? null;
}

export function getProductPrimaryImage(product) {
  const primary = product?.images?.find((image) => image.primary);
  return primary?.url || product?.images?.[0]?.url || null;
}

export function isProductInStock(product) {
  if (!hasLoadedProductField(product, 'stockQuantity')) return null;
  return Number(product.stockQuantity) > 0;
}

export function formatProductMoney(value) {
  if (value === null || value === undefined || value === '') return null;
  return formatMoney(value);
}

export const formatProductRating = (value) => formatDecimal(value, {
  minimumFractionDigits: 1, maximumFractionDigits: 1,
});

export function formatProductDate(value) {
  return formatEntityDateTime(value);
}

export const PRODUCT_IMAGE_PLACEHOLDER = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&h=1000&fit=crop';
export const getProductImageWithFallback = (product) => getProductPrimaryImage(product) || PRODUCT_IMAGE_PLACEHOLDER;

export const getProductId = (product) => product?.id || null;
export const isProductApproved = (product) => product?.status === 'APPROVED';

export const PRODUCT_STOCK_STATE = Object.freeze({
  UNAVAILABLE: 'UNAVAILABLE',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  AVAILABLE: 'AVAILABLE',
});

export function getProductStockState(product, lowStockThreshold = 5) {
  if (!hasLoadedProductField(product, 'stockQuantity') || product.stockQuantity === null) {
    return { key: PRODUCT_STOCK_STATE.UNAVAILABLE, quantity: null, canSelect: false };
  }
  const quantity = Number(product.stockQuantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { key: PRODUCT_STOCK_STATE.OUT_OF_STOCK, quantity: 0, canSelect: false };
  }
  return {
    key: quantity <= lowStockThreshold ? PRODUCT_STOCK_STATE.LOW_STOCK : PRODUCT_STOCK_STATE.AVAILABLE,
    quantity,
    canSelect: true,
  };
}

export function getProductAvailability(product, access) {
  if (!access?.fields?.availability || !access?.fields?.stockQuantity) {
    return PRODUCT_STOCK_STATE.UNAVAILABLE;
  }
  return getProductStockState(product).key;
}

export function getProductInventoryStats(products = []) {
  return products.reduce((stats, product) => {
    stats.total += 1;
    if (product?.status === 'APPROVED') stats.approved += 1;
    else if (product?.status === 'PENDING_APPROVAL') stats.pending += 1;
    else if (product?.status === 'DRAFT') stats.drafts += 1;
    return stats;
  }, { total: 0, approved: 0, pending: 0, drafts: 0 });
}

export function sumProductPrices(products = []) {
  return products.reduce((total, product) => {
    if (total === null || product?.price === null || product?.price === undefined) return null;
    return addDecimals(total, product.price);
  }, '0');
}

export function getProductStatusClass(status) {
  if (status === 'APPROVED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'PENDING_APPROVAL') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (['REJECTED', 'DISABLED'].includes(status)) return 'border-red-200 bg-red-50 text-red-700';
  return 'border-stone-200 bg-stone-100 text-stone-700';
}

export const getActiveProductDetails = (details = {}) => Object.entries(details)
  .filter(([, value]) => value !== null && value !== undefined && value !== ''
    && (typeof value !== 'boolean' || value)
    && (typeof value !== 'number' || value > 0));
