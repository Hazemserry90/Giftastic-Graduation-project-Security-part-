import {
  ENTITY_FIELD_STATE, getEntityFieldState, getEntityValue, hasLoadedEntityField,
  mergeEntityModels, setEntityValue,
} from '../shared/entityModel.js';

export const PRODUCT_ENTITY_TYPE = 'product';

export const PRODUCT_FIELD_STATE = ENTITY_FIELD_STATE;

export const PRODUCT_DETAIL_FIELDS = Object.freeze([
  'giftWrapPrice', 'engravingPrice', 'customMessagePrice', 'videoUrl',
  'allowsEngraving', 'engravingMaxLength', 'allowsEmbroidery',
  'allowsCustomMessage', 'maxMessageLength', 'allowsPhotoUpload',
  'allowsColorChoice', 'availableColors', 'allowsSizeChoice', 'availableSizes',
  'allowsGiftWrap', 'isGiftWrapped', 'includesGiftBox', 'includesRibbon',
  'allowsGiftReceipt', 'requiresDeliveryDate', 'allowsScheduledDelivery',
  'minDeliveryDays', 'maxDeliveryDays', 'isPerishable', 'shelfLifeDays',
  'requiresRecipientInfo', 'requiresRecipientName', 'requiresRecipientEmail',
  'requiresRecipientPhone', 'requiresRecipientAddress', 'allowsAnonymousGift',
  'isContainer', 'containsLetter', 'containsCard', 'containsFlowers',
  'containsChocolates', 'containsFood', 'itemCount', 'tags',
  'isFeatured', 'isBestseller', 'isNewArrival', 'gender',
  'seasonalAvailability', 'occasion', 'recipientType', 'ageGroup', 'slug',
  'metaTitle', 'metaDescription', 'vendorSku', 'vendorNotes',
  'fulfillmentTime', 'handmade', 'madeToOrder', 'customizable',
]);

export function createProductModel({ source = 'unknown' } = {}) {
  return {
    entityType: PRODUCT_ENTITY_TYPE,
    schemaVersion: 1,
    identity: { id: null },
    data: {},
    id: null,
    supplierId: null,
    name: null,
    description: null,
    price: null,
    currentPrice: null,
    customerOriginalPrice: null,
    pricingMode: null,
    currentCommissionRate: null,
    estimatedVendorPayout: null,
    status: null,
    createdAt: null,
    updatedAt: null,
    publishedAt: null,
    reviewRequestStatus: null,
    reviewRequestedFromStatus: null,
    reviewRequestedAt: null,
    reviewReviewedAt: null,
    reviewedBy: null,
    reviewRequestMessage: null,
    reviewRejectionReason: null,
    averageRating: null,
    reviewCount: null,
    stockQuantity: null,
    discountPercentage: null,
    discountStartDate: null,
    discountEndDate: null,
    hasActiveDiscount: null,
    categories: [],
    images: [],
    details: Object.fromEntries(PRODUCT_DETAIL_FIELDS.map((field) => [field, null])),
    relations: {
      vendor: null,
      giftFlows: [],
    },
    meta: {
      source,
      loadedFields: new Set(),
      derivedFields: new Set(),
      invalidFields: new Set(),
      isPartial: true,
      adapter: source,
      fetchedAt: null,
      issues: [],
      unknownFields: [],
    },
  };
}

export function isProductModel(value) {
  return value?.entityType === PRODUCT_ENTITY_TYPE && value?.meta?.loadedFields instanceof Set;
}

export function getProductValue(model, path) {
  return getEntityValue(model, path);
}

export function setProductValue(model, path, value) {
  return setEntityValue(model, path, value);
}

export function hasLoadedProductField(model, path) {
  return hasLoadedEntityField(model, path);
}

export function getProductFieldState(model, path, allowed = true) {
  return getEntityFieldState(model, path, allowed);
}

export function mergeProductModels(base, incoming) {
  if (!isProductModel(base)) return incoming;
  if (!isProductModel(incoming)) return base;
  return mergeEntityModels(base, incoming);
}
