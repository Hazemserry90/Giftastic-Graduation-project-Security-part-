import { BACKEND_DOMAIN_CONTRACTS } from './shared/backendContract.js';

const canonicalBackendFields = (entityType) => {
  const contract = BACKEND_DOMAIN_CONTRACTS[entityType];
  return contract.fields.map((field) => contract.aliases?.[field] || field).filter((field, index, all) => all.indexOf(field) === index);
};
const c = (entityType, fields, endpoints, complete = false) => Object.freeze({ entityType, fields: Object.freeze(fields), endpoints: Object.freeze(endpoints), complete });

const full = (entityType, endpoints) => c(entityType, canonicalBackendFields(entityType), endpoints, true);

export const NAMED_SOURCE_CONTRACTS = Object.freeze({
  adaptUserDomain: full('user', ['adminService.getAllUsers']),
  adaptUserMe: full('user', ['userService.getMyProfile', 'userService.updateMyProfile']),
  adaptUserPublicProfile: c('user', ['id', 'fullName', 'memberSince', 'facets.admin.isCommunityHelper'], ['userService.getPublicProfile']),
  adaptUserAdminRow: c('user', ['id', 'email', 'fullName', 'phoneNumber', 'isBanned', 'requestedAdmin'], ['adminService.getAllUsers']),
  adaptUserAdminManagementRecord: c('user', [
    'id', 'email', 'fullName', 'phoneNumber', 'birthday', 'addresses', 'isBanned', 'requestedAdmin',
    'facets.admin.isAdmin', 'facets.admin.permissions', 'facets.admin.isSuperAdmin',
  ], ['adminService.getAllUsers + adminService.getAllAdmins composition']),
  adaptUserAnalyticsCustomerReference: c('user', ['id', 'fullName'], ['adminService.getPlatformAnalytics']),
  adaptUserOrderCustomerSnapshot: c('user', ['id', 'fullName', 'email'], ['orderService customer snapshots']),
  adaptUserAuthSession: c('user', ['id', 'email', 'fullName', 'isBanned', 'facets.vendor.supplierId', 'facets.admin.permissions'], ['authService.login', 'authService.register', 'authService.getSession']),

  adaptVendorDomain: full('vendor', ['adminService.getAllVendors']),
  adaptVendorPublicListRecord: c('vendor', canonicalBackendFields('vendor'), ['vendorService.getAllVendors']),
  adaptVendorMe: full('vendor', ['vendorService.getMyVendorProfile', 'vendorService.updateVendorProfile']),
  adaptVendorUnifiedSearchResult: c('vendor', ['supplierId', 'storeName', 'description', 'logoUrl'], ['unified search vendor result']),
  adaptVendorAnalyticsReference: c('vendor', ['supplierId', 'storeName'], ['adminService.getPlatformAnalytics', 'analyticsService.getVendorAnalytics']),

  adaptProductDomain: full('product', ['productService.getProductById', 'productService.getProducts', 'productService.getVendorProducts']),
  adaptProductSearchResult: c('product', [
    'id', 'supplierId', 'name', 'description', 'price', 'currentPrice',
    'discountPercentage', 'hasActiveDiscount', 'stockQuantity',
    'averageRating', 'reviewCount', 'images', 'createdAt',
  ], ['productSearchService.search', 'quickSearch', 'searchWithFilters', 'searchOnSale']),
  adaptProductUnifiedSearchResult: c('product', ['id', 'name', 'description', 'currentPrice', 'images'], ['unified search product result']),
  adaptProductRecommendationReference: c('product', ['id', 'name', 'currentPrice', 'averageRating', 'images'], ['recommendationService.*']),
  adaptProductAnalyticsReference: c('product', ['id', 'name'], ['adminService.getPlatformAnalytics', 'analyticsService.getVendorAnalytics']),
  adaptProductOrderItemSnapshot: c('product', ['id', 'name', 'price', 'images'], ['OrderItem snapshot']),
  adaptProductCartItemSnapshot: c('product', ['id', 'name', 'price', 'images', 'stockQuantity'], ['CartResponse item snapshot']),

  adaptOrderDomain: full('order', ['orderService.getOrderById', 'placeOrder', 'placeGuestOrder']),
  adaptOrderCustomerListRecord: c('order', ['id', 'customerId', 'status', 'items', 'totalAmount', 'placedAt', 'paymentMethod', 'instapayPhoneNumber', 'instapayRefundPhoneNumber', 'instapayRefundName', 'instapayTransactionIds'], ['orderService.getCustomerOrders']),
  adaptOrderVendorListRecord: c('order', ['id', 'status', 'items', 'placedAt', 'shippingAddress', 'customerName', 'customerEmail', 'paymentMethod', 'vendorStatuses'], ['orderService.getVendorOrders']),
  adaptOrderAdminListRecord: c('order', canonicalBackendFields('order'), ['orderService.getAllOrders', 'adminService.getAllOrders']),
  adaptOrderSecurityProjection: c('order', ['id', 'customerId', 'items'], ['OrderSecurityDTO']),
  adaptOrderAnalyticsReference: c('order', ['id', 'status', 'totalAmount', 'placedAt'], ['analytics order reference']),

  adaptGiftFlowDomain: full('giftFlow', ['GiftFlow domain']),
  adaptGiftFlowResponse: c('giftFlow', canonicalBackendFields('giftFlow'), ['giftFlowService.*']),
  adaptGiftFlowUnifiedSearchResult: c('giftFlow', ['id', 'supplierId', 'name', 'description', 'imageUrl'], ['unified search flow result']),
  adaptGiftFlowFavoriteReference: c('giftFlow', ['id', 'supplierId', 'name', 'description', 'imageUrl'], ['favorite flow reference']),
  adaptCartDomain: full('cart', ['Cart domain']),
  adaptCartResponse: c('cart', ['id', 'customerId', 'items', 'total', 'updatedAt'], ['cartService.*']),
  adaptGuestCart: c('cart', ['items', 'total'], ['useCartStore guest cart']),
  adaptReviewDomain: full('review', ['Review domain']),
  adaptReviewPublicResponse: c('review', ['id', 'userId', 'authorName', 'reviewType', 'entityId', 'rating', 'comment', 'status', 'createdAt', 'isAnonymous'], ['reviewService.getReviewsByEntity']),
  adaptReviewSelfResponse: c('review', [...canonicalBackendFields('review'), 'authorName'], ['reviewService.getMyReviews']),
  adaptReviewModerationResponse: c('review', [...canonicalBackendFields('review'), 'authorName'], ['reviewService.getPendingReviews', 'getReviewsByStatus']),
  adaptCategoryDomain: full('category', ['Category domain']),
  adaptCategoryListRecord: c('category', ['id', 'name'], ['productService.getCategories', 'adminService.getCategories']),
  adaptProductEmbeddedCategory: c('category', ['id', 'name'], ['Product.categories']),
  adaptVendorApplicationDomain: full('vendorApplication', ['VendorApplication domain']),
  adaptVendorApplicationResponse: c('vendorApplication', canonicalBackendFields('vendorApplication'), ['vendorApplicationService.*']),
  adaptCommissionDomain: full('commission', ['Commission domain']),
    adaptCommissionDto: c('commission', [...canonicalBackendFields('commission'), 'supplierName', 'orderPlacedAt', 'completedAt'], ['commissionService commission lists']),
  adaptCommissionPaymentRequestDomain: full('commissionPaymentRequest', ['CommissionPaymentRequest domain']),
  adaptCommissionPaymentRequestDto: c('commissionPaymentRequest', [
    ...canonicalBackendFields('commissionPaymentRequest'),
    'orderId', 'vendorUserId', 'supplierName', 'customerId', 'customerName', 'customerEmail',
    'orderStatus', 'paymentMethod', 'payableAmount', 'direction', 'senderLabel', 'receiverLabel',
  ], ['commissionService payment request lists']),
  adaptCommissionRuleDomain: full('commissionRule', ['CommissionRule domain']),
  adaptCommissionRuleDto: c('commissionRule', [...canonicalBackendFields('commissionRule'), 'supplierName'], ['commissionService.getCommissionRules']),
  adaptReportDomain: full('report', ['reportService.*', 'adminService report lists']),
  adaptAdminRequestDomain: full('adminRequest', ['AdminRequest domain']),
  adaptAdminRequestDto: c('adminRequest', [...canonicalBackendFields('adminRequest'), 'userEmail', 'userFullName'], ['adminRequestService.*', 'adminService.getAdminRequests']),
  adaptOrderAssistanceDomain: full('orderAssistance', ['OrderAssistanceRequest domain']),
  adaptOrderAssistanceDto: c('orderAssistance', [...canonicalBackendFields('orderAssistance'), 'supplierName', 'messages'], ['commissionService assistance methods']),
  adaptNotificationOwnerRecord: c('notification', canonicalBackendFields('notification'), ['notificationService.*']),
  adaptVendorFeedbackDomain: full('vendorFeedback', ['VendorFeedback domain']),
  adaptVendorFeedbackResponse: c('vendorFeedback', canonicalBackendFields('vendorFeedback'), ['reviewService vendor feedback methods']),
  adaptDeliveryZoneDomain: full('deliveryZone', ['DeliveryZone domain']),
  adaptDeliveryZoneResponse: c('deliveryZone', canonicalBackendFields('deliveryZone'), ['deliveryService.getAllZones']),
  adaptVendorDeliveryPricingDomain: full('vendorDeliveryPricing', ['VendorDeliveryPricing domain']),
  adaptVendorDeliveryPricingResponse: c('vendorDeliveryPricing', [...canonicalBackendFields('vendorDeliveryPricing'), 'zoneName'], ['deliveryService.getVendorPricing']),
  adaptReminderDomain: full('reminder', ['reminderService.*']),
  adaptVendorActivityDomain: full('vendorActivity', ['VendorActivity domain']),
  adaptVendorActivityResponse: c('vendorActivity', canonicalBackendFields('vendorActivity'), ['vendorActivityService.getActivities']),
  adaptUserReviewRestrictionDomain: full('userReviewRestriction', ['UserReviewRestriction domain']),
  adaptUserReviewRestrictionResponse: c('userReviewRestriction', [...canonicalBackendFields('userReviewRestriction'), 'isActive'], ['reviewService restriction methods']),
  adaptFavoriteDomain: full('favorite', ['FavoriteProduct domain']),
  adaptFavoriteLegacyRecord: c('favorite', canonicalBackendFields('favorite'), ['favoriteService.*']),
});
