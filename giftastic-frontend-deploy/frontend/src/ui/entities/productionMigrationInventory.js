import { NAMED_SOURCE_CONTRACTS } from './namedSourceContracts.js';

const VIEWERS = Object.freeze(['guest', 'user', 'vendor', 'admin', 'superAdmin']);

const consumer = (file, namedAdapters, serviceMethods, semanticPresentation, overrides = {}) =>
  Object.freeze({
    file,
    component: overrides.component || file.split('/').at(-1).replace(/\.(jsx?|tsx?)$/, ''),
    parentConsumer: overrides.parentConsumer || file,
    namedAdapters: Object.freeze(namedAdapters),
    serviceMethods: Object.freeze(serviceMethods),
    semanticPresentation,
    viewerTypes: Object.freeze(overrides.viewerTypes || VIEWERS),
    viewingContext: overrides.viewingContext || 'Explicit context supplied to the entity access builder',
    relationshipInputs: overrides.relationshipInputs || 'Explicitly supplied when the access policy requires ownership or participation',
    hydrationOwner: overrides.hydrationOwner || file,
    actions: overrides.actions || 'Entity action builder when the representation exposes actions',
    commandDomain: overrides.commandDomain || 'Central command domain for submitted payloads',
    mutationResultStrategy: overrides.mutationResultStrategy || 'Adapt returned DTO or patch the canonical model with confirmed fields',
    status: overrides.status || 'MIGRATED',
    backendBlocker: overrides.backendBlocker || null,
    evidence: overrides.evidence || file,
  });

const domain = (entity, representation, consumers) => Object.freeze({
  entity,
  representation,
  consumers: Object.freeze(consumers.map((item) => item.file)),
  adapters: Object.freeze([...new Set(consumers.flatMap((item) => item.namedAdapters))]),
  serviceMethods: Object.freeze([...new Set(consumers.flatMap((item) => item.serviceMethods))]),
  locations: Object.freeze(consumers),
  status: 'MIGRATED',
});

export const PRODUCTION_MIGRATION_INVENTORY = Object.freeze([
  domain('user', 'UserSummary/UserDetails/UserManagementRow and access-aware workflow references', [
    consumer('src/store/useAuthStore.js', ['adaptUserAuthSession'], ['authService.getSession', 'authService.login', 'authService.register', 'authService.logout', 'authService.setCurrentUser'], 'Canonical Viewer/session hydration'),
    consumer('src/components/Navbar.jsx', ['adaptUserAuthSession'], [], 'Canonical Viewer summary/navigation'),
    consumer('src/components/ProtectedRoute.jsx', ['adaptUserAuthSession'], [], 'Canonical Viewer capability gate'),
    consumer('src/pages/PublicUserProfile.jsx', ['adaptUserPublicProfile'], ['userService.getPublicProfile'], 'UserDetails'),
    consumer('src/pages/UserProfile.jsx', ['adaptUserMe'], ['userService.getMyProfile', 'userService.updateMyProfile', 'userService.updateMyAddresses'], 'UserDetails and profile command workflow'),
    consumer('src/pages/AdminDashboard.jsx', ['adaptUserAdminManagementRecord', 'adaptUserAnalyticsCustomerReference'], ['adminService.getAllUsers', 'adminService.getAllAdmins', 'adminService.getPlatformAnalytics', 'adminService.banUser', 'adminService.unbanUser', 'adminService.promoteToAdmin', 'adminService.demoteAdmin', 'adminService.grantPermission', 'adminService.revokePermission'], 'UserManagementRow, UserSummary, and access-aware User references'),
    consumer('src/pages/AdminReports.jsx', ['adaptUserAdminManagementRecord'], ['adminService.getMyAdminProfile'], 'Canonical Viewer Admin-facet hydration'),
    consumer('src/pages/ModeratorReviews.jsx', ['adaptUserAdminManagementRecord'], ['adminService.getMyAdminProfile'], 'Canonical Viewer Admin-facet hydration'),
    consumer('src/pages/VendorOrders.jsx', ['adaptUserOrderCustomerSnapshot'], ['orderService.getVendorOrders'], 'UserSummary and UserDetails'),
    consumer('src/pages/Checkout.jsx', ['adaptUserMe'], ['userService.getMyProfile'], 'Checkout identity/default projection'),
    consumer('src/components/modals/UserModal.jsx', ['adaptUserAdminManagementRecord'], [], 'Thin UserDetails container'),
    consumer('src/components/modals/UserSummaryButton.jsx', ['adaptUserAdminManagementRecord'], [], 'UserSummary trigger'),
  ]),
  domain('vendor', 'VendorSummary/VendorDetails/VendorManagementCard', [
    consumer('src/pages/VendorCatalog.jsx', ['adaptVendorPublicListRecord'], ['vendorService.getAllVendors'], 'VendorSummary'),
    consumer('src/pages/VendorProfile.jsx', ['adaptVendorPublicListRecord'], ['vendorService.getAllVendors'], 'VendorDetails'),
    consumer('src/pages/VendorSettings.jsx', ['adaptVendorMe'], ['vendorService.getMyVendorProfile', 'vendorService.updateVendorProfile'], 'VendorDetails and owner edit workflow'),
    consumer('src/pages/AdminDashboard.jsx', ['adaptVendorDomain', 'adaptVendorAnalyticsReference'], ['adminService.getAllVendors', 'adminService.getPendingVendors', 'adminService.getPlatformAnalytics', 'adminService.activateVendor', 'adminService.deactivateVendor'], 'VendorManagementCard/VendorDetails'),
    consumer('src/components/GlobalSearch.jsx', ['adaptVendorUnifiedSearchResult'], ['api.get:/api/search/unified'], 'Search result reference'),
    consumer('src/pages/VendorAnalytics.jsx', ['adaptVendorAnalyticsReference'], ['analyticsService.getVendorAnalytics'], 'Analytics-linked Vendor reference'),
    consumer('src/components/modals/VendorModal.jsx', ['adaptVendorDomain'], [], 'Thin VendorDetails container'),
    consumer('src/components/modals/VendorSummaryCard.jsx', ['adaptVendorPublicListRecord'], [], 'VendorSummary trigger'),
  ]),
  domain('product', 'ProductSummary/Product management and inventory rows/Product details sections', [
    consumer('src/pages/HomePage.jsx', ['adaptProductDomain'], ['productService.getProducts'], 'ProductSummary'),
    consumer('src/pages/ProductCatalog.jsx', ['adaptProductDomain'], ['productService.getProducts'], 'ProductSummary with Favorite relationship and canonical local filters'),
    consumer('src/pages/ProductDetails.jsx', ['adaptProductDomain'], ['productService.getProductById'], 'Product detail workflow with entity-owned sections'),
    consumer('src/components/ProductSearch.jsx', ['adaptProductSearchResult'], ['productSearchService.searchWithFilters'], 'ProductSummary search result'),
    consumer('src/components/ProductRecommendations.jsx', ['adaptProductRecommendationReference'], ['recommendationService.getPersonalizedRecommendations', 'recommendationService.getSimilarProducts', 'recommendationService.getTrending', 'recommendationService.getMostFrequentlyBought', 'recommendationService.getWhatOthersAreBuying'], 'ProductSummary recommendation reference'),
    consumer('src/components/GlobalSearch.jsx', ['adaptProductUnifiedSearchResult'], ['api.get:/api/search/unified'], 'Search result reference'),
    consumer('src/pages/VendorDashboard.jsx', ['adaptProductDomain'], ['productService.getVendorProducts', 'productService.deleteProduct'], 'Product inventory row/details'),
    consumer('src/components/DiscountManager.jsx', ['adaptProductDomain'], ['discountService.setDiscount', 'discountService.removeDiscount'], 'Product discount editor workflow'),
    consumer('src/pages/VendorAnalytics.jsx', ['adaptProductAnalyticsReference'], ['analyticsService.getVendorAnalytics'], 'Analytics-linked Product reference'),
    consumer('src/pages/VendorProfile.jsx', ['adaptProductDomain'], ['vendorService.getVendorProducts'], 'ProductSummary'),
    consumer('src/pages/Cart.jsx', ['adaptProductCartItemSnapshot'], [], 'Cart Product snapshot'),
    consumer('src/pages/Checkout.jsx', ['adaptProductCartItemSnapshot'], [], 'Checkout Product snapshot'),
    consumer('src/pages/Orders.jsx', ['adaptProductOrderItemSnapshot'], ['orderService.getCustomerOrders'], 'Historical Order Item Product snapshot'),
    consumer('src/pages/OrderDetails.jsx', ['adaptProductOrderItemSnapshot'], ['orderService.getOrderById'], 'Historical Order Item Product snapshot'),
    consumer('src/pages/VendorOrders.jsx', ['adaptProductOrderItemSnapshot'], ['orderService.getVendorOrders'], 'Historical Order Item Product snapshot'),
    consumer('src/pages/GiftFlowStep.jsx', ['adaptProductDomain'], ['productService.getProductById'], 'Gift Flow Product choice'),
    consumer('src/pages/GiftFlowCatalog.jsx', ['adaptProductDomain'], [], 'Gift Flow Product reference'),
    consumer('src/pages/VendorGiftFlows.jsx', ['adaptProductDomain'], ['productService.getVendorProducts'], 'Gift Flow editor Product reference'),
    consumer('src/pages/AdminDashboard.jsx', ['adaptProductDomain', 'adaptProductAnalyticsReference'], ['adminService.getAllProducts', 'adminService.getPendingProducts', 'adminService.getDraftProducts', 'adminService.getPlatformAnalytics', 'adminService.approveProduct', 'adminService.rejectProduct', 'adminService.activateProduct', 'adminService.deactivateProduct', 'adminService.deleteProduct'], 'ProductManagementCard/ProductDetails'),
    consumer('src/pages/UploadProduct.jsx', ['adaptProductDomain'], ['productService.createProduct', 'productService.submitForApproval', 'commissionService.getCurrentRate'], 'Product command draft preview and commission pricing choice'),
    consumer('src/pages/EditProduct.jsx', ['adaptProductDomain'], ['productService.getProductById', 'productService.updateProduct'], 'Product editor hydration/preview'),
    consumer('src/components/modals/ProductModal.jsx', ['adaptProductDomain'], [], 'Thin ProductDetails container'),
  ]),
  domain('category', 'Category semantic views and command-form taxonomy references', [
    consumer('src/pages/ProductCatalog.jsx', ['adaptCategoryListRecord'], ['productService.getCategories'], 'Category filter reference'),
    consumer('src/pages/AdminDashboard.jsx', ['adaptCategoryListRecord'], ['adminService.getCategories', 'adminService.createCategory', 'adminService.updateCategory', 'adminService.deleteCategory'], 'Category summary/details'),
    consumer('src/pages/UploadProduct.jsx', ['adaptCategoryListRecord'], ['productService.getCategories'], 'Product command taxonomy reference'),
    consumer('src/pages/EditProduct.jsx', ['adaptCategoryListRecord', 'adaptProductEmbeddedCategory'], ['productService.getCategories', 'productService.getProductById'], 'Product command taxonomy reference'),
    consumer('src/components/modals/CategoryModal.jsx', ['adaptCategoryListRecord'], [], 'Thin Category details container'),
  ]),
  domain('order', 'OrderHistoryCard/OrderManagementCard/VendorOrderRow/Order entity sections', [
    consumer('src/pages/Orders.jsx', ['adaptOrderCustomerListRecord'], ['orderService.getCustomerOrders'], 'OrderHistoryCard'),
    consumer('src/pages/OrderDetails.jsx', ['adaptOrderDomain'], ['orderService.getOrderById', 'orderService.changePaymentMethod', 'orderService.submitInstapayTransactions'], 'Order details and post-checkout payment workflow'),
    consumer('src/pages/UserDashboard.jsx', ['adaptOrderCustomerListRecord'], ['orderService.getCustomerOrders'], 'Recent Order summary'),
    consumer('src/pages/VendorOrders.jsx', ['adaptOrderVendorListRecord'], ['orderService.getVendorOrders', 'orderService.updateVendorStatus'], 'VendorOrderRow/details'),
    consumer('src/pages/AdminDashboard.jsx', ['adaptOrderAdminListRecord', 'adaptOrderAnalyticsReference'], ['adminService.getAllOrders', 'adminService.getPlatformAnalytics', 'adminService.confirmOrderPayment', 'adminService.rejectOrderPayment', 'commissionService.updateOrderStatus'], 'OrderManagementCard/details and Instapay review'),
    consumer('src/pages/Checkout.jsx', ['adaptOrderDomain'], ['orderService.placeOrder', 'orderService.placeGuestOrder'], 'Order placement command'),
    consumer('src/components/modals/OrderModal.jsx', ['adaptOrderDomain'], [], 'Thin Order details container'),
  ]),
  domain('cart', 'Cart workflow with canonical selectors and historical Product snapshots', [
    consumer('src/store/useCartStore.js', ['adaptCartResponse', 'adaptGuestCart'], ['cartService.getCart', 'cartService.addItem', 'cartService.addItems', 'cartService.updateItemQuantity', 'cartService.removeItem', 'cartService.removeGroup', 'cartService.clearCart'], 'Canonical Cart hydration and mutations'),
    consumer('src/pages/Cart.jsx', ['adaptCartResponse'], [], 'Cart workflow'),
    consumer('src/pages/Checkout.jsx', ['adaptCartResponse'], [], 'Checkout Cart projection'),
    consumer('src/components/Navbar.jsx', ['adaptCartResponse'], [], 'Cart count projection'),
  ]),
  domain('deliveryZone', 'Delivery Zone selector/editor workflow', [
    consumer('src/components/ZoneSelector.jsx', ['adaptDeliveryZoneResponse'], ['deliveryService.getAllZones', 'deliveryService.getDeliveryCost'], 'Delivery Zone selector'),
    consumer('src/pages/Checkout.jsx', ['adaptDeliveryZoneResponse'], ['deliveryService.getAllZones', 'deliveryService.getDeliveryCost'], 'Checkout Delivery Zone selector'),
    consumer('src/pages/VendorDeliveryPricing.jsx', ['adaptDeliveryZoneResponse'], ['deliveryService.getAllZones'], 'Delivery pricing Zone reference'),
  ]),
  domain('vendorDeliveryPricing', 'VendorDeliveryPricingEditor', [
    consumer('src/pages/VendorDeliveryPricing.jsx', ['adaptVendorDeliveryPricingResponse'], ['deliveryService.getVendorPricing', 'deliveryService.updateVendorPricing'], 'VendorDeliveryPricingEditor'),
    consumer('src/pages/VendorSettings.jsx', ['adaptVendorDeliveryPricingResponse'], [], 'Delivery-pricing navigation/reference'),
  ]),
  domain('orderAssistance', 'Order Assistance cards, thread, and order-owned workflow sections', [
    consumer('src/pages/VendorOrders.jsx', ['adaptOrderAssistanceDto'], ['commissionService.getVendorAssistanceRequests', 'commissionService.requestOrderAssistance', 'commissionService.addVendorAssistanceMessage', 'commissionService.confirmVendorAssistanceResolution'], 'Vendor assistance workflow'),
    consumer('src/pages/AdminDashboard.jsx', ['adaptOrderAssistanceDto'], ['commissionService.getAssistanceRequests', 'commissionService.addAssistanceMessage', 'commissionService.resolveAssistanceRequest'], 'OrderAssistanceAdminCard/OrderAssistanceThread'),
    consumer('src/components/modals/OrderModal.jsx', ['adaptOrderAssistanceDto'], [], 'Order-owned assistance section'),
  ]),
  domain('giftFlow', 'GiftFlowSummary/entity-owned detail sections and specialized execution/editor workflows', [
    consumer('src/pages/HomePage.jsx', ['adaptGiftFlowResponse'], ['giftFlowService.getAllFlows'], 'GiftFlowSummary'),
    consumer('src/pages/GiftFlowCatalog.jsx', ['adaptGiftFlowResponse'], ['giftFlowService.getAllFlows'], 'GiftFlowSummary with Favorite relationship'),
    consumer('src/pages/GiftFlowStep.jsx', ['adaptGiftFlowResponse'], [], 'Gift Flow execution workflow'),
    consumer('src/pages/Favorites.jsx', ['adaptGiftFlowFavoriteReference'], ['favoriteService.getFavorites'], 'Favorite Gift Flow reference'),
    consumer('src/pages/ProductDetails.jsx', ['adaptGiftFlowResponse'], ['giftFlowService.getFlowsByVendor'], 'Related Gift Flow summary'),
    consumer('src/pages/VendorProfile.jsx', ['adaptGiftFlowResponse'], ['vendorService.getVendorFlows'], 'Vendor Gift Flow summary'),
    consumer('src/pages/VendorGiftFlows.jsx', ['adaptGiftFlowResponse'], ['giftFlowService.getFlowsByVendor', 'giftFlowService.createFlow', 'giftFlowService.updateFlow', 'giftFlowService.deleteFlow'], 'Gift Flow editor/preview'),
    consumer('src/components/GlobalSearch.jsx', ['adaptGiftFlowUnifiedSearchResult'], ['api.get:/api/search/unified'], 'Search result reference'),
    consumer('src/components/controllers/GiftFlowModalController.jsx', ['adaptGiftFlowResponse'], [], 'Gift Flow modal hydration owner'),
    consumer('src/components/modals/GiftFlowModal.jsx', ['adaptGiftFlowResponse'], [], 'Thin Gift Flow details container'),
    consumer('src/ui/entities/shared/productionHydration.js', ['adaptGiftFlowResponse'], ['giftFlowService.getFlowById'], 'Shared canonical Gift Flow hydration', { parentConsumer: 'GiftFlowStep/GiftFlowModalController' }),
  ]),
  domain('review', 'Review semantic views, moderation cards/details, and submission command exception', [
    consumer('src/components/ReviewList.jsx', ['adaptReviewPublicResponse'], ['reviewService.getReviewsByEntity'], 'ReviewSummary'),
    consumer('src/components/ReviewForm.jsx', ['adaptReviewDomain'], ['reviewService.createReview'], 'Review submission command'),
    consumer('src/pages/ProductDetails.jsx', ['adaptReviewPublicResponse'], [], 'Product Review list'),
    consumer('src/pages/VendorProfile.jsx', ['adaptReviewPublicResponse'], [], 'Vendor Review list'),
    consumer('src/pages/MyReviews.jsx', ['adaptReviewSelfResponse'], ['reviewService.getMyReviews'], 'ReviewSummary/details'),
    consumer('src/pages/ModeratorReviews.jsx', ['adaptReviewModerationResponse'], ['reviewService.getPendingReviews', 'reviewService.approveReview', 'reviewService.rejectReview'], 'ReviewModerationCard/Excerpt/details'),
    consumer('src/components/modals/ReviewModal.jsx', ['adaptReviewDomain'], [], 'Thin Review details container'),
  ]),
  domain('vendorFeedback', 'VendorFeedbackSummary and submission-command exception', [
    consumer('src/components/VendorFeedbackModal.jsx', ['adaptVendorFeedbackDomain'], ['reviewService.createVendorFeedback'], 'Feedback submission command'),
    consumer('src/pages/ModeratorReviews.jsx', ['adaptVendorFeedbackResponse'], ['reviewService.getPendingVendorFeedback'], 'VendorFeedbackSummary with mutation actions withheld', {
      status: 'BLOCKED_BY_BACKEND',
      backendBlocker: 'Vendor Feedback approve/reject uses a read permission; no safe mutation permission exists.',
      actions: 'No mutation actions emitted until the backend exposes a distinct safe capability.',
      mutationResultStrategy: 'No mutation is attempted.',
    }),
  ]),
  domain('userReviewRestriction', 'UserReviewRestrictionSummary/Editor', [
    consumer('src/pages/MyReviews.jsx', ['adaptUserReviewRestrictionResponse'], ['reviewService.getRestriction'], 'Owner restriction summary'),
    consumer('src/pages/AdminDashboard.jsx', ['adaptUserReviewRestrictionResponse'], ['reviewService.getRestriction', 'reviewService.createOrUpdateRestriction', 'reviewService.removeRestriction'], 'Restriction editor'),
    consumer('src/components/modals/UserModal.jsx', ['adaptUserReviewRestrictionResponse'], [], 'User restriction section'),
  ]),
  domain('vendorApplication', 'VendorApplicationSummary/details and submission-command exception', [
    consumer('src/pages/BecomeVendor.jsx', ['adaptVendorApplicationDomain'], ['vendorApplicationService.submitApplication'], 'Vendor Application command'),
    consumer('src/pages/MyVendorApplications.jsx', ['adaptVendorApplicationResponse'], ['vendorApplicationService.getMyApplications'], 'VendorApplicationSummary/details'),
    consumer('src/pages/UserProfile.jsx', ['adaptVendorApplicationResponse'], ['vendorApplicationService.getMyApplications'], 'VendorApplicationSummary'),
    consumer('src/pages/AdminVendorApplications.jsx', ['adaptVendorApplicationResponse'], ['vendorApplicationService.getPendingApplications', 'vendorApplicationService.reviewApplication'], 'Vendor Application moderation'),
    consumer('src/components/modals/VendorApplicationModal.jsx', ['adaptVendorApplicationResponse'], [], 'Thin Vendor Application details container'),
  ]),
  domain('adminRequest', 'AdminRequestSummary/details', [
    consumer('src/pages/UserProfile.jsx', ['adaptAdminRequestDto'], ['adminRequestService.getMyRequests', 'adminRequestService.submitRequest'], 'Owner Admin Request summary/details'),
    consumer('src/pages/AdminDashboard.jsx', ['adaptAdminRequestDto'], ['adminRequestService.getAllRequests', 'adminRequestService.getPendingRequests', 'adminRequestService.getUserRequests', 'adminRequestService.approveRequest', 'adminRequestService.rejectRequest', 'adminRequestService.invalidateRequest', 'adminRequestService.resetCooldown'], 'Admin Request moderation'),
    consumer('src/components/modals/AdminRequestModal.jsx', ['adaptAdminRequestDto'], [], 'Thin Admin Request details container'),
  ]),
  domain('report', 'ReportSummary/details and submission-command exception', [
    consumer('src/components/ReportButton.jsx', ['adaptReportDomain'], ['reportService.createReport'], 'Report submission command'),
    consumer('src/pages/AdminReports.jsx', ['adaptReportDomain'], ['reportService.getAllReports', 'reportService.getReportsByStatus', 'reportService.markUnderReview', 'reportService.markActionTaken', 'reportService.dismissReport', 'reportService.resolveReport'], 'Report moderation summary/details'),
    consumer('src/components/modals/ReportModal.jsx', ['adaptReportDomain'], [], 'Thin Report details container'),
  ]),
  domain('notification', 'NotificationSummary/details and composition command workflow', [
    consumer('src/components/NotificationBell.jsx', ['adaptNotificationOwnerRecord'], [], 'NotificationSummary'),
    consumer('src/pages/Notifications.jsx', ['adaptNotificationOwnerRecord'], [], 'NotificationSummary/details'),
    consumer('src/components/modals/NotificationModal.jsx', ['adaptNotificationOwnerRecord'], [], 'Thin Notification details container'),
    consumer('src/ui/workflows/notificationWorkflow.js', ['adaptNotificationOwnerRecord'], ['notificationService.getNotifications', 'notificationService.getUnreadCount', 'notificationService.markAsRead', 'notificationService.markAllAsRead'], 'Notification collection hydration/actions', { parentConsumer: 'NotificationBell/Notifications' }),
    consumer('src/pages/AdminDashboard.jsx', ['adaptUserAdminManagementRecord'], ['adminService.getAllUsers', 'adminService.sendNotification'], 'Notification composition with access-aware User target reference'),
  ]),
  domain('commission', 'CommissionSummary/details', [
    consumer('src/pages/VendorCommissions.jsx', ['adaptCommissionDto'], ['commissionService.getVendorCommissionHistory', 'commissionService.getVendorPendingCommissions', 'commissionService.submitPayment', 'commissionService.urgePlatformPayment'], 'Vendor Commission summary/details'),
    consumer('src/pages/AdminFinancial.jsx', ['adaptCommissionDto'], [], 'Admin Commission summary/details'),
    consumer('src/pages/AdminDashboard.jsx', ['adaptCommissionDto'], ['commissionService.submitVendorPayout'], 'Admin Commission summary/details'),
    consumer('src/ui/workflows/financialWorkflow.js', ['adaptCommissionDto'], ['commissionService.getUnpaidCommissions', 'commissionService.getInstapayPayouts', 'commissionService.urgePayment', 'commissionService.getFinancialAnalytics'], 'Commission collection and financial projection hydration/actions', { parentConsumer: 'AdminFinancial/AdminDashboard' }),
    consumer('src/pages/VendorOrders.jsx', ['adaptCommissionDto'], [], 'Order Commission reference'),
    consumer('src/components/modals/CommissionModal.jsx', ['adaptCommissionDto'], [], 'Thin Commission details container'),
  ]),
  domain('commissionPaymentRequest', 'CommissionPaymentRequestSummary/details and proof-command exception', [
    consumer('src/pages/VendorCommissions.jsx', ['adaptCommissionPaymentRequestDto'], ['commissionService.getVendorPaymentRequests', 'commissionService.approvePlatformPayment', 'commissionService.rejectPlatformPayment'], 'Vendor Payment Request summary/details'),
    consumer('src/pages/AdminFinancial.jsx', ['adaptCommissionPaymentRequestDto'], [], 'Admin Payment Request moderation'),
    consumer('src/pages/AdminDashboard.jsx', ['adaptCommissionPaymentRequestDto'], [], 'Admin Payment Request moderation'),
    consumer('src/ui/workflows/financialWorkflow.js', ['adaptCommissionPaymentRequestDto'], ['commissionService.getPendingPaymentRequests', 'commissionService.approvePaymentRequest', 'commissionService.rejectPaymentRequest'], 'Payment Request collection hydration/actions', { parentConsumer: 'AdminFinancial/AdminDashboard' }),
    consumer('src/components/modals/CommissionModal.jsx', ['adaptCommissionPaymentRequestDto'], [], 'Thin Payment Request details container'),
  ]),
  domain('commissionRule', 'CommissionRuleSummary/details and command-form exception', [
    consumer('src/pages/AdminFinancial.jsx', ['adaptCommissionRuleDto'], [], 'Commission Rule summary/details'),
    consumer('src/pages/AdminDashboard.jsx', ['adaptCommissionRuleDto'], [], 'Commission Rule summary/details'),
    consumer('src/ui/workflows/financialWorkflow.js', ['adaptCommissionRuleDto'], ['commissionService.getCommissionRules', 'commissionService.createCommissionRule', 'commissionService.deactivateRule'], 'Commission Rule collection hydration/actions', { parentConsumer: 'AdminFinancial/AdminDashboard' }),
    consumer('src/components/modals/CommissionModal.jsx', ['adaptCommissionRuleDto'], [], 'Thin Commission Rule details container'),
  ]),
  domain('reminder', 'ReminderSummary and command form', [
    consumer('src/pages/UserDashboard.jsx', ['adaptReminderDomain'], ['reminderService.getMyReminders', 'reminderService.createReminder', 'reminderService.deleteReminder'], 'ReminderSummary'),
  ]),
  domain('vendorActivity', 'VendorActivitySummary', [
    consumer('src/pages/VendorActivityDashboard.jsx', ['adaptVendorActivityResponse'], ['vendorActivityService.getActivities'], 'VendorActivitySummary'),
  ]),
  domain('favorite', 'Favorite relationship decoration/removal only', [
    consumer('src/pages/Favorites.jsx', ['adaptFavoriteLegacyRecord'], ['favoriteService.getFavorites', 'favoriteService.removeProductFavorite', 'favoriteService.removeFlowFavorite'], 'Favorite Product/Gift Flow relationship'),
    consumer('src/pages/ProductCatalog.jsx', ['adaptFavoriteLegacyRecord'], ['favoriteService.getFavorites', 'favoriteService.addProductFavorite', 'favoriteService.removeProductFavorite'], 'Product Favorite relationship'),
    consumer('src/pages/ProductDetails.jsx', ['adaptFavoriteLegacyRecord'], ['favoriteService.getFavorites', 'favoriteService.addProductFavorite', 'favoriteService.removeProductFavorite'], 'Product Favorite relationship'),
    consumer('src/pages/GiftFlowCatalog.jsx', ['adaptFavoriteLegacyRecord'], ['favoriteService.addFlowFavorite'], 'Gift Flow Favorite relationship'),
    consumer('src/pages/GiftFlowStep.jsx', ['adaptFavoriteLegacyRecord'], ['favoriteService.getFavorites', 'favoriteService.addFlowFavorite', 'favoriteService.removeFlowFavorite'], 'Gift Flow Favorite relationship'),
  ]),
]);

export const PRODUCTION_INVENTORY_ENTITY_COUNT = PRODUCTION_MIGRATION_INVENTORY.length;

export const PRODUCTION_MIGRATION_LOCATIONS = Object.freeze(
  PRODUCTION_MIGRATION_INVENTORY.flatMap((entityRow) =>
    entityRow.locations.map((item) => {
      const contracts = item.namedAdapters.map((adapter) => NAMED_SOURCE_CONTRACTS[adapter]);
      return Object.freeze({
        entity: entityRow.entity,
        ...item,
        endpointFamilies: Object.freeze([...new Set(contracts.flatMap((contract) => contract.endpoints))]),
        sourceCompleteness: Object.freeze(Object.fromEntries(item.namedAdapters.map((adapter) => [
          adapter,
          NAMED_SOURCE_CONTRACTS[adapter].complete ? 'complete' : 'partial',
        ]))),
        requiredCanonicalFields: Object.freeze(Object.fromEntries(item.namedAdapters.map((adapter) => [
          adapter,
          NAMED_SOURCE_CONTRACTS[adapter].fields,
        ]))),
      });
    })),
);

export const ENTITY_BEARING_SERVICE_METHODS = Object.freeze([
  ...new Set(PRODUCTION_MIGRATION_LOCATIONS.flatMap((location) => location.serviceMethods)),
]);
