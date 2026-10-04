import { PRODUCT_DETAIL_FIELDS } from '../product/productModel.js';

export const FIELD_PROVENANCE = Object.freeze({
  INTRINSIC: 'INTRINSIC', EMBEDDED: 'EMBEDDED', RELATION: 'RELATION',
  ENRICHMENT: 'ENRICHMENT', PROJECTION: 'PROJECTION', DERIVED: 'DERIVED',
});

export const FIELD_VISIBILITY = Object.freeze({
  PUBLIC: 'PUBLIC', AUTHENTICATED: 'AUTHENTICATED', SELF: 'SELF', OWNER: 'OWNER',
  PARTICIPANT: 'PARTICIPANT', ADMIN_PERMISSION: 'ADMIN_PERMISSION', FINANCIAL: 'FINANCIAL',
  MODERATION: 'MODERATION', SYSTEM: 'SYSTEM',
});

const f = (type = 'unknown', visibility = 'SYSTEM', provenance = 'INTRINSIC', extra = {}) =>
  Object.freeze({ type, visibility, provenance, ...extra });
const inferField = (name) => {
  const leaf = name.split('.').at(-1);
  const provenance = name.startsWith('relations.') ? 'RELATION'
    : /^(parsed|overdue$|isActive$|relatedEntity$|productIds$|currentPrice$|hasActiveDiscount$)/.test(leaf) ? 'DERIVED'
      : /^(supplierName|storeName|zoneName|userEmail|userFullName|customerName|customerEmail|customerPhone)$/.test(leaf) ? 'ENRICHMENT'
        : /^(total|memberSince)$/.test(leaf) ? 'PROJECTION'
          : /^(addresses|details|images|items|guestInfo|messages)$/.test(leaf) ? 'EMBEDDED'
            : 'INTRINSIC';
  const type = /(^|\.)(id|userId|customerId|supplierId|vendorId|productId|flowId|orderId|commissionId|zoneId|deliveryZoneId|reviewedBy|createdBy|resolvedBy|restrictedBy|reportedEntityId|entityId|requestId|senderId|reporterId|relatedEntityId)$/.test(name) ? 'id'
    : /(^|\.)(createdAt|updatedAt|publishedAt|placedAt|paidAt|commissionPaidAt|submittedAt|reviewedAt|requestedAt|resolvedAt|scheduledAt|occurredAt|restrictedAt|expiresAt|addedAt|canReapplyAt)$/.test(name) ? 'datetime'
      : /(^|\.)(birthday|startDate|endDate|dueDate|estimatedDeliveryDate|actualDeliveryDate)$/.test(name) ? 'date'
        : /(^|\.)(url|logoUrl|bannerUrl|imageUrl|proofImageUrl|videoUrl|websiteUrl|instagramUrl|facebookUrl)$/.test(name) ? 'url'
        : /(^|\.)(is[A-Z]|has[A-Z]|allows[A-Z]|requires[A-Z]|contains[A-Z]|active$|read$|processed$|commissionPaid$|canComment$|canReview$|handmade$|madeToOrder$|customizable$|primary$|overdue$|inStock$)/.test(name) ? 'boolean'
          : /(^|\.)(price|currentPrice|total|totalAmount|deliveryCost|orderSubtotal|commissionRate|commissionAmount|rate|discountPercentage|averageRating|rating|contentScore|revenue)$/.test(name) ? 'decimal'
            : /(^|\.)(quantity|stockQuantity|reviewCount|itemCount|minDeliveryDays|maxDeliveryDays|shelfLifeDays|displayOrder|count)$/.test(name) ? 'integer'
              : /(^|\.)(configuration|metadata|deliveryCostBreakdown)$/.test(name) ? 'json-string'
                : /s$|^(addresses|items|images|categories|messages|permissions|productIds)$/.test(leaf) ? 'array'
                  : /^(status|type|reviewType|reportType|activityType|gender)$/.test(leaf) ? 'enum'
                    : 'string';
  return f(type, 'SYSTEM', provenance);
};
const schema = (identity, fieldNames, overrides = {}) => Object.freeze({
  schemaVersion: 1,
  identity,
  fields: Object.freeze(Object.fromEntries(fieldNames.map((name) => [name, overrides[name] || inferField(name)]))),
});

const publicText = f('string', 'PUBLIC');
const systemId = f('id', 'SYSTEM');
const ownerId = f('id', 'OWNER');
const financial = f('decimal', 'FINANCIAL');
const moderation = f('string', 'MODERATION');
const PRODUCT_DETAIL_OVERRIDES = Object.fromEntries(PRODUCT_DETAIL_FIELDS.map((name) => {
  if (['availableColors', 'availableSizes', 'tags'].includes(name)) return [name, f('string')];
  return [name, inferField(name)];
}));

export const EMBEDDED_SCHEMAS = Object.freeze({
  address: schema(null, ['label', 'street', 'city', 'state', 'zipCode', 'country', 'isDefault']),
  adminFacet: schema('userId', ['userId', 'permissions', 'isAdmin', 'isSuperAdmin']),
  productDetails: schema(null, PRODUCT_DETAIL_FIELDS, PRODUCT_DETAIL_OVERRIDES),
  productImage: schema('id', ['id', 'productId', 'url', 'primary', 'displayOrder']),
  orderItem: schema(null, ['product', 'vendor', 'productId', 'productName', 'imageUrl', 'quantity', 'price', 'supplierId', 'groupId', 'metadata', 'parsedMetadata']),
  guestInfo: schema(null, ['email', 'firstName', 'lastName', 'phone', 'shippingAddress']),
  cartItem: schema(null, ['product', 'vendor', 'productId', 'productName', 'imageUrl', 'stockQuantity', 'quantity', 'groupId', 'metadata', 'parsedMetadata', 'supplierId', 'storeName', 'price']),
  orderAssistanceMessage: schema('id', ['id', 'requestId', 'senderId', 'senderRole', 'message', 'createdAt']),
  vendorDeliveryPricingId: schema(null, ['vendorId', 'zoneId']),
});

export const ENTITY_DOMAIN_SCHEMAS = Object.freeze({
  user: schema('id', [
    'id', 'email', 'fullName', 'phoneNumber', 'instapayRefundPhoneNumber', 'instapayRefundName', 'birthday', 'addresses', 'isBanned',
    'requestedAdmin', 'memberSince', 'facets.vendor', 'facets.vendor.isVendor',
    'facets.vendor.supplierId', 'facets.vendor.vendorId', 'facets.admin',
    'facets.admin.isAdmin', 'facets.admin.permissions', 'facets.admin.isSuperAdmin',
    'facets.admin.isCommunityHelper', 'facets.reviewRestriction',
    'facets.reviewRestriction.canComment', 'facets.reviewRestriction.canReview',
    'facets.reviewRestriction.restrictedAt', 'facets.reviewRestriction.restrictedBy',
    'facets.reviewRestriction.reason', 'facets.reviewRestriction.expiresAt',
    'facets.reviewRestriction.isActive',
  ], {
    id: systemId, fullName: publicText, memberSince: f('date', 'PUBLIC', 'PROJECTION'),
    email: f('string', 'SELF'), phoneNumber: f('string', 'SELF'), instapayRefundPhoneNumber: f('string', 'SELF'), instapayRefundName: f('string', 'SELF'), birthday: f('date', 'SELF'),
    addresses: f('address[]', 'SELF', 'EMBEDDED'), isBanned: moderation, requestedAdmin: f('boolean', 'SELF'),
    'facets.vendor': f('vendorFacet', 'PUBLIC', 'RELATION'),
    'facets.vendor.isVendor': f('boolean', 'PUBLIC', 'DERIVED'),
    'facets.vendor.supplierId': f('id', 'OWNER', 'RELATION'),
    'facets.vendor.vendorId': f('id', 'OWNER', 'ENRICHMENT'),
    'facets.admin': f('adminFacet', 'ADMIN_PERMISSION', 'RELATION'),
    'facets.admin.isAdmin': f('boolean', 'ADMIN_PERMISSION', 'DERIVED'),
    'facets.admin.permissions': f('array', 'ADMIN_PERMISSION', 'EMBEDDED'),
    'facets.admin.isSuperAdmin': f('boolean', 'ADMIN_PERMISSION', 'DERIVED'),
    'facets.admin.isCommunityHelper': f('boolean', 'PUBLIC', 'PROJECTION'),
    'facets.reviewRestriction': f('reviewRestriction', 'MODERATION', 'RELATION'),
    'facets.reviewRestriction.canComment': f('boolean', 'MODERATION', 'EMBEDDED'),
    'facets.reviewRestriction.canReview': f('boolean', 'MODERATION', 'EMBEDDED'),
    'facets.reviewRestriction.restrictedAt': f('datetime', 'MODERATION', 'EMBEDDED'),
    'facets.reviewRestriction.restrictedBy': f('id', 'MODERATION', 'EMBEDDED'),
    'facets.reviewRestriction.reason': f('string', 'MODERATION', 'EMBEDDED'),
    'facets.reviewRestriction.expiresAt': f('datetime', 'MODERATION', 'EMBEDDED'),
    'facets.reviewRestriction.isActive': f('boolean', 'MODERATION', 'DERIVED'),
  }),
  vendor: schema('supplierId', ['userId', 'supplierId', 'storeName', 'description', 'logoUrl', 'bannerUrl', 'contactEmail', 'contactPhone', 'address', 'websiteUrl', 'instagramUrl', 'facebookUrl', 'workingHours', 'isVerified', 'relations.products', 'relations.giftFlows', 'relations.ownerUser'], {
    userId: ownerId, supplierId: systemId, storeName: publicText, description: publicText, logoUrl: f('url', 'PUBLIC'), bannerUrl: f('url', 'PUBLIC'),
    contactEmail: publicText, contactPhone: publicText, address: publicText, websiteUrl: f('url', 'PUBLIC'), instagramUrl: f('url', 'PUBLIC'), facebookUrl: f('url', 'PUBLIC'), workingHours: publicText, isVerified: f('boolean', 'OWNER'),
    'relations.products': f('entityReference[]', 'PUBLIC', 'RELATION'),
    'relations.giftFlows': f('entityReference[]', 'PUBLIC', 'RELATION'),
    'relations.ownerUser': f('entityReference', 'OWNER', 'RELATION'),
  }),
  product: schema('id', ['id', 'supplierId', 'name', 'description', 'price', 'currentPrice', 'customerOriginalPrice', 'pricingMode', 'currentCommissionRate', 'estimatedVendorPayout', 'details', 'status', 'createdAt', 'updatedAt', 'publishedAt', 'reviewRequestStatus', 'reviewRequestedFromStatus', 'reviewRequestedAt', 'reviewReviewedAt', 'reviewedBy', 'reviewRequestMessage', 'reviewRejectionReason', 'averageRating', 'reviewCount', 'stockQuantity', 'discountPercentage', 'discountStartDate', 'discountEndDate', 'categories', 'images', 'hasActiveDiscount'], {
    id: systemId, supplierId: ownerId, name: publicText, description: publicText, price: f('decimal', 'PUBLIC'), currentPrice: f('decimal', 'PUBLIC', 'DERIVED'), customerOriginalPrice: f('decimal', 'PUBLIC', 'DERIVED'), pricingMode: f('enum', 'OWNER'), currentCommissionRate: f('decimal', 'OWNER'), estimatedVendorPayout: f('decimal', 'OWNER', 'DERIVED'), details: f('productDetails', 'PUBLIC', 'EMBEDDED'), status: f('enum', 'OWNER'), createdAt: f('datetime', 'SYSTEM'), updatedAt: f('datetime', 'SYSTEM'), publishedAt: f('datetime', 'PUBLIC'), reviewRequestStatus: f('enum', 'OWNER'), reviewRequestedFromStatus: f('enum', 'OWNER'), reviewRequestedAt: f('datetime', 'OWNER'), reviewReviewedAt: f('datetime', 'OWNER'), reviewedBy: f('id', 'SYSTEM'), reviewRequestMessage: f('string', 'OWNER'), reviewRejectionReason: f('string', 'OWNER'), averageRating: f('decimal', 'PUBLIC'), reviewCount: f('integer', 'PUBLIC'), stockQuantity: f('integer', 'OWNER'), discountPercentage: f('decimal', 'PUBLIC'), discountStartDate: f('datetime', 'PUBLIC'), discountEndDate: f('datetime', 'PUBLIC'), categories: f('categoryRef[]', 'PUBLIC', 'RELATION'), images: f('productImage[]', 'PUBLIC', 'EMBEDDED'), hasActiveDiscount: f('boolean', 'PUBLIC', 'DERIVED'),
  }),
  order: schema('id', ['id', 'customerId', 'guestInfo', 'status', 'items', 'totalAmount', 'placedAt', 'shippingAddress', 'paymentMethod', 'customerName', 'customerEmail', 'customerPhone', 'instapayPhoneNumber', 'instapayRefundPhoneNumber', 'instapayRefundName', 'deliveryZoneId', 'deliveryCost', 'deliveryCostBreakdown', 'parsedDeliveryCostBreakdown', 'estimatedDeliveryDate', 'actualDeliveryDate', 'deliveryNotes', 'commissionPaid', 'commissionPaidAt', 'instapayTransactionIds', 'instapayPaymentMessages', 'paymentMethodLockedAt', 'paymentConfirmedAt', 'paymentConfirmedBy', 'paymentRejectionReason', 'vendorStatuses', 'vendorCompletedAt', 'vendorFinancialReleaseAt', 'commissionRates', 'vendorSubtotals', 'vendorCommissionAmounts', 'commissionRatesSnapshottedAt', 'vendorInvalidatedAt', 'vendorInvalidatedBy', 'vendorInvalidationReasons', 'vendorInvalidationDetails']),
  giftFlow: schema('id', ['id', 'supplierId', 'name', 'description', 'configuration', 'parsedConfiguration', 'imageUrl', 'createdAt', 'updatedAt', 'productIds']),
  cart: schema('id', ['id', 'customerId', 'items', 'total', 'updatedAt']),
  review: schema('id', ['id', 'userId', 'authorName', 'reviewType', 'entityId', 'rating', 'comment', 'status', 'createdAt', 'reviewedAt', 'reviewedBy', 'moderatorNotes', 'isAnonymous', 'contentScore', 'orderId'], {
    authorName: f('string', 'PARTICIPANT', 'ENRICHMENT'),
  }),
  category: schema('id', ['id', 'name', 'relations.products', 'relations.productCount']),
  vendorApplication: schema('id', ['id', 'userId', 'storeName', 'description', 'logoUrl', 'bannerUrl', 'contactEmail', 'contactPhone', 'address', 'websiteUrl', 'instagramUrl', 'facebookUrl', 'workingHours', 'status', 'submittedAt', 'reviewedAt', 'reviewedBy', 'rejectionReason']),
  commission: schema('id', ['id', 'orderId', 'supplierId', 'supplierName', 'orderSubtotal', 'commissionRate', 'commissionAmount', 'payableAmount', 'direction', 'status', 'dueDate', 'paidAt', 'createdAt', 'orderPlacedAt', 'completedAt', 'overdue'], {
    orderSubtotal: financial,
    commissionRate: financial,
    commissionAmount: financial,
    payableAmount: financial,
    orderPlacedAt: f('datetime', 'FINANCIAL', 'ENRICHMENT'),
    completedAt: f('datetime', 'FINANCIAL', 'ENRICHMENT'),
  }),
  commissionPaymentRequest: schema('id', ['id', 'commissionId', 'orderId', 'supplierId', 'vendorUserId', 'supplierName', 'customerId', 'customerName', 'customerEmail', 'orderStatus', 'paymentMethod', 'payableAmount', 'direction', 'senderLabel', 'receiverLabel', 'message', 'proofImageUrl', 'messages', 'status', 'submittedAt', 'reviewedAt', 'reviewedBy', 'rejectionReason']),
  commissionRule: schema('id', ['id', 'type', 'supplierId', 'supplierName', 'rate', 'startDate', 'endDate', 'active', 'createdAt', 'createdBy'], {
    startDate: f('datetime', 'FINANCIAL'),
    endDate: f('datetime', 'FINANCIAL'),
  }),
  report: schema('id', ['id', 'reporterId', 'reportType', 'reportedEntityId', 'reason', 'description', 'status', 'createdAt', 'reviewedAt', 'reviewedBy', 'adminNotes', 'outcomeType', 'outcomeAction']),
  adminRequest: schema('id', ['id', 'userId', 'userEmail', 'userFullName', 'message', 'status', 'requestedAt', 'reviewedAt', 'reviewedBy', 'reviewNotes', 'canReapplyAt']),
  orderAssistance: schema('id', ['id', 'orderId', 'supplierId', 'supplierName', 'message', 'status', 'requestedAt', 'resolvedAt', 'resolvedBy', 'resolution', 'messages']),
  notification: schema('id', ['id', 'userId', 'title', 'message', 'type', 'read', 'createdAt', 'metadata', 'parsedMetadata', 'relatedEntity']),
  vendorFeedback: schema('id', ['id', 'userId', 'vendorId', 'orderId', 'feedback', 'status', 'createdAt', 'reviewedAt', 'reviewedBy', 'moderatorNotes', 'contentScore']),
  deliveryZone: schema('id', ['id', 'zoneName', 'description', 'isActive']),
  vendorDeliveryPricing: schema(['vendorId', 'zoneId'], ['vendorId', 'zoneId', 'zoneName', 'deliveryCost', 'updatedAt']),
  reminder: schema('id', ['id', 'customerId', 'description', 'scheduledAt', 'processed']),
  vendorActivity: schema('id', ['id', 'vendorId', 'activityType', 'description', 'relatedEntityId', 'metadata', 'parsedMetadata', 'relatedEntity', 'occurredAt']),
  userReviewRestriction: schema('userId', ['userId', 'canComment', 'canReview', 'restrictedAt', 'restrictedBy', 'reason', 'expiresAt', 'isActive']),
  favorite: schema('id', ['id', 'userId', 'productId', 'flowId', 'addedAt']),
});

export const ENTITY_TYPES = Object.freeze(Object.keys(ENTITY_DOMAIN_SCHEMAS));

if (ENTITY_TYPES.length !== 23) throw new Error(`Expected 23 entity schemas, found ${ENTITY_TYPES.length}`);
