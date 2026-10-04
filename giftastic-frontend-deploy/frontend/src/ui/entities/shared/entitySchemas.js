const group = (title, fields) => ({ title, fields });

export const ENTITY_SCHEMAS = Object.freeze({
  user: [
    group('Identity', ['id', 'fullName', 'email', 'phoneNumber', 'birthday']),
    group('Account', ['isBanned', 'requestedAdmin']),
    group('Relations', ['addresses', 'facets.vendor', 'facets.admin', 'facets.reviewRestriction']),
  ],
  vendor: [
    group('Storefront', ['storeName', 'description', 'logoUrl', 'bannerUrl']),
    group('Contact', ['contactEmail', 'contactPhone', 'address', 'workingHours']),
    group('Social', ['websiteUrl', 'instagramUrl', 'facebookUrl']),
    group('Status', ['isVerified']),
    group('System', ['supplierId', 'userId']),
  ],
  product: [
    group('Product', ['name', 'description', 'price', 'currentPrice', 'customerOriginalPrice', 'status']),
    group('Commerce', ['pricingMode', 'currentCommissionRate', 'estimatedVendorPayout', 'stockQuantity', 'discountPercentage', 'discountStartDate', 'discountEndDate']),
    group('Review Request', ['reviewRequestStatus', 'reviewRequestedFromStatus', 'reviewRequestedAt', 'reviewReviewedAt', 'reviewRequestMessage', 'reviewRejectionReason']),
    group('Reputation', ['averageRating', 'reviewCount']),
    group('Taxonomy and media', ['categories', 'images']),
    group('Details', ['details']),
    group('System', ['id', 'supplierId', 'createdAt', 'updatedAt', 'publishedAt']),
  ],
  order: [
    group('Order', ['id', 'status', 'placedAt', 'items']),
    group('Customer', ['customerId', 'customerName', 'customerEmail', 'customerPhone', 'guestInfo']),
    group('Shipping', ['shippingAddress', 'deliveryZoneId', 'deliveryCost', 'estimatedDeliveryDate', 'actualDeliveryDate', 'deliveryNotes']),
    group('Payment', ['paymentMethod', 'instapayPhoneNumber', 'instapayTransactionIds', 'instapayPaymentMessages', 'paymentMethodLockedAt', 'paymentConfirmedAt', 'paymentConfirmedBy', 'paymentRejectionReason', 'totalAmount']),
    group('Vendor progress', ['vendorStatuses']),
    group('Commission snapshot', ['commissionRates', 'commissionRatesSnapshottedAt']),
    group('Commission', ['commissionPaid', 'commissionPaidAt']),
  ],
  giftFlow: [
    group('Flow', ['name', 'description', 'imageUrl']),
    group('Journey', ['parsedConfiguration', 'productIds']),
    group('System', ['id', 'supplierId', 'createdAt', 'updatedAt']),
  ],
  cart: [group('Cart', ['id', 'customerId', 'items', 'total', 'updatedAt'])],
  review: [
    group('Review', ['rating', 'comment', 'reviewType', 'entityId', 'createdAt']),
    group('Moderation', ['status', 'reviewedAt', 'reviewedBy', 'moderatorNotes', 'contentScore']),
    group('System', ['id', 'userId', 'orderId', 'isAnonymous']),
  ],
  category: [group('Category', ['name', 'relations.productCount', 'relations.products']), group('System', ['id'])],
  vendorApplication: [
    group('Application', ['storeName', 'description', 'logoUrl', 'bannerUrl']),
    group('Contact', ['contactEmail', 'contactPhone', 'address', 'websiteUrl', 'instagramUrl', 'facebookUrl', 'workingHours']),
    group('Review', ['status', 'submittedAt', 'reviewedAt', 'reviewedBy', 'rejectionReason']),
    group('System', ['id', 'userId']),
  ],
  commission: [
    group('Commission', ['commissionAmount', 'commissionRate', 'orderSubtotal', 'payableAmount', 'direction', 'status']),
    group('Timeline', ['orderPlacedAt', 'completedAt', 'dueDate', 'paidAt', 'createdAt', 'overdue']),
    group('System', ['id', 'orderId', 'supplierId', 'supplierName']),
  ],
  commissionPaymentRequest: [
    group('Request', ['message', 'proofImageUrl', 'status']),
    group('Review', ['submittedAt', 'reviewedAt', 'reviewedBy', 'rejectionReason']),
    group('System', ['id', 'commissionId', 'supplierId', 'supplierName']),
  ],
  commissionRule: [
    group('Rule', ['type', 'rate', 'startDate', 'endDate', 'active']),
    group('System', ['id', 'supplierId', 'createdAt', 'createdBy']),
  ],
  report: [
    group('Report', ['reportType', 'reason', 'description', 'status']),
    group('Outcome', ['outcomeType', 'outcomeAction', 'adminNotes']),
    group('Review', ['createdAt', 'reviewedAt', 'reviewedBy']),
    group('System', ['id', 'reporterId', 'reportedEntityId']),
  ],
  adminRequest: [
    group('Request', ['userFullName', 'userEmail', 'message', 'status']),
    group('Review', ['requestedAt', 'reviewedAt', 'reviewedBy', 'reviewNotes', 'canReapplyAt']),
    group('System', ['id', 'userId']),
  ],
  orderAssistance: [
    group('Request', ['supplierName', 'message', 'status', 'messages']),
    group('Resolution', ['requestedAt', 'resolvedAt', 'resolvedBy', 'resolution']),
    group('System', ['id', 'orderId', 'supplierId']),
  ],
  notification: [
    group('Notification', ['title', 'message', 'type', 'read', 'createdAt']),
    group('Related data', ['relatedEntity', 'parsedMetadata']),
    group('System', ['id', 'userId']),
  ],
  vendorFeedback: [
    group('Feedback', ['feedback', 'status', 'createdAt']),
    group('Moderation', ['reviewedAt', 'reviewedBy', 'moderatorNotes', 'contentScore']),
    group('System', ['id', 'userId', 'vendorId', 'orderId']),
  ],
  deliveryZone: [group('Delivery zone', ['zoneName', 'description', 'isActive']), group('System', ['id'])],
  vendorDeliveryPricing: [
    group('Delivery price', ['zoneName', 'deliveryCost', 'updatedAt']),
    group('System', ['vendorId', 'zoneId']),
  ],
  reminder: [group('Reminder', ['description', 'scheduledAt', 'processed']), group('System', ['id', 'customerId'])],
  vendorActivity: [
    group('Activity', ['activityType', 'description', 'occurredAt']),
    group('Related data', ['relatedEntityId', 'parsedMetadata']),
    group('System', ['id', 'vendorId']),
  ],
  userReviewRestriction: [
    group('Capabilities', ['canComment', 'canReview', 'isActive']),
    group('Restriction', ['reason', 'restrictedAt', 'expiresAt']),
    group('System', ['userId', 'restrictedBy']),
  ],
  favorite: [group('Favorite', ['productId', 'flowId', 'addedAt']), group('System', ['id', 'userId'])],
});
