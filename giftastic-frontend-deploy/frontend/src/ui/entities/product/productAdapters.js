import {
  createProductModel,
  isProductModel,
  PRODUCT_DETAIL_FIELDS,
  setProductValue,
} from './productModel.js';
import { adaptEmbeddedValue, applyEmbeddedResult } from '../shared/embeddedAdapters.js';
import { validateCanonicalModel } from '../shared/modelValidation.js';
import { adaptCategory } from '../category/categoryAdapters.js';
import { markEntityFieldInvalid } from '../shared/entityModel.js';

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value || {}, key);
}

function assignAlias(model, path, input, aliases, transform = (value) => value) {
  for (const alias of aliases) {
    if (hasOwn(input, alias)) {
      setProductValue(model, path, transform(input[alias]));
      return true;
    }
  }
  return false;
}

function normalizeCategories(categories) {
  return (categories || []).map((category) => adaptCategory(category, {
    source: 'product-embedded-category', complete: false,
  }));
}

export function adaptProduct(input = {}, {
  source = 'unknown',
  complete = false,
  vendor,
  giftFlows,
} = {}) {
  if (isProductModel(input)) return input;
  const model = createProductModel({ source });
  const mappings = {
    id: ['id', 'productId'],
    supplierId: ['supplierId', 'vendorId'],
    name: ['name', 'productName'],
    description: ['description'],
    price: ['price', 'originalPrice'],
    currentPrice: ['customerPrice', 'currentPrice', 'discountedPrice'],
    customerOriginalPrice: ['customerOriginalPrice', 'originalPrice'],
    pricingMode: ['pricingMode', 'effectivePricingMode'],
    currentCommissionRate: ['currentCommissionRate'],
    estimatedVendorPayout: ['estimatedVendorPayout'],
    status: ['status'],
    createdAt: ['createdAt'],
    updatedAt: ['updatedAt'],
    publishedAt: ['publishedAt'],
    reviewRequestStatus: ['reviewRequestStatus'],
    reviewRequestedFromStatus: ['reviewRequestedFromStatus'],
    reviewRequestedAt: ['reviewRequestedAt'],
    reviewReviewedAt: ['reviewReviewedAt'],
    reviewedBy: ['reviewedBy'],
    reviewRequestMessage: ['reviewRequestMessage'],
    reviewRejectionReason: ['reviewRejectionReason'],
    averageRating: ['averageRating'],
    reviewCount: ['reviewCount'],
    stockQuantity: ['stockQuantity'],
    discountPercentage: ['discountPercentage'],
    discountStartDate: ['discountStartDate'],
    discountEndDate: ['discountEndDate'],
    hasActiveDiscount: ['hasActiveDiscount', 'hasDiscount'],
  };
  Object.entries(mappings).forEach(([path, aliases]) => assignAlias(model, path, input, aliases));

  if (hasOwn(input, 'categories')) {
    setProductValue(model, 'categories', Array.isArray(input.categories) ? normalizeCategories(input.categories) : input.categories);
  } else if (hasOwn(input, 'category')) {
    setProductValue(model, 'categories', normalizeCategories([input.category]));
  }

  if (hasOwn(input, 'images')) {
    if (!Array.isArray(input.images)) setProductValue(model, 'images', input.images);
    else setProductValue(model, 'images', input.images.map((image, index) => {
      const result = adaptEmbeddedValue('productImage', image, {
        aliases: { url: ['url', 'imageUrl'], primary: ['primary', 'isPrimary'] }, path: `images.${index}`,
      });
      return applyEmbeddedResult(model, `images.${index}`, result);
    }));
  } else if (hasOwn(input, 'primaryImageUrl') || hasOwn(input, 'imageUrl')) {
    const result = adaptEmbeddedValue('productImage', {
      url: input.primaryImageUrl ?? input.imageUrl,
      primary: true,
    }, { path: 'images.0' });
    setProductValue(model, 'images', [applyEmbeddedResult(model, 'images.0', result)]);
  }

  if (hasOwn(input, 'details')) {
    if (!input.details || typeof input.details !== 'object' || Array.isArray(input.details)) {
      markEntityFieldInvalid(model, 'details', input.details, 'Expected Product Details object');
    } else {
      const detailsResult = adaptEmbeddedValue('productDetails', input.details, { path: 'details' });
      PRODUCT_DETAIL_FIELDS.forEach((field) => {
        if (detailsResult.loadedFields.has(field)) setProductValue(model, `details.${field}`, detailsResult.value[field]);
      });
      applyEmbeddedResult(model, 'details', detailsResult);
    }
  }

  if (vendor !== undefined) setProductValue(model, 'relations.vendor', vendor);
  if (giftFlows !== undefined) setProductValue(model, 'relations.giftFlows', giftFlows || []);

  const knownFields = new Set([
    'id', 'productId', 'supplierId', 'vendorId', 'name', 'productName', 'description',
    'price', 'originalPrice', 'customerPrice', 'currentPrice', 'discountedPrice', 'pricingMode',
    'effectivePricingMode', 'currentCommissionRate', 'estimatedVendorPayout', 'customerOriginalPrice', 'status', 'createdAt',
    'updatedAt', 'publishedAt', 'reviewRequestStatus', 'reviewRequestedFromStatus',
    'reviewRequestedAt', 'reviewReviewedAt', 'reviewedBy', 'reviewRequestMessage',
    'reviewRejectionReason', 'averageRating', 'reviewCount', 'stockQuantity',
    'discountPercentage', 'discountStartDate', 'discountEndDate', 'hasActiveDiscount',
    'hasDiscount', 'inStock', 'categories', 'category', 'images', 'primaryImageUrl',
    'imageUrl', 'details',
  ]);
  model.meta.unknownFields = [...model.meta.unknownFields, ...Object.keys(input || {}).filter((field) => !knownFields.has(field))];

  model.meta.isPartial = !complete;
  return validateCanonicalModel(model);
}

export const adaptDomainProduct = (product, relations = {}) => adaptProduct(product, {
  source: 'product-domain',
  complete: true,
  ...relations,
});

export const adaptProductSearchResult = (product) => adaptProduct(product, {
  source: 'product-search',
});
