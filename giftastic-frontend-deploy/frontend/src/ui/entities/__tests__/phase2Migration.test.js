import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { ENTITY_ADAPTER_NAMES } from '../namedAdapters.js';
import { NAMED_SOURCE_CONTRACTS } from '../namedSourceContracts.js';
import {
  PRODUCTION_MIGRATION_INVENTORY,
  PRODUCTION_MIGRATION_LOCATIONS,
  ENTITY_BEARING_SERVICE_METHODS,
} from '../productionMigrationInventory.js';

const source = (relative) => readFileSync(resolve(process.cwd(), relative), 'utf8');

test('Phase 2 User modal and summary wrappers are thin canonical containers', () => {
  for (const file of [
    'src/components/modals/UserModal.jsx',
    'src/components/modals/UserSummaryButton.jsx',
  ]) {
    const contents = source(file);
    assert.doesNotMatch(contents, /adaptUser|adaptEntity|buildUserAccess|buildUserActions|services\//, file);
    assert.doesNotMatch(contents, /\bviewer\b|\bpermissions\b|\bcontext\b|\bsource\b/, file);
  }
});

test('User action presentation executes canonical action handlers', () => {
  const contents = source('src/ui/entities/user/sections/UserActionsSection.jsx');
  assert.match(contents, /onClick=\{action\.onSelect\}/);
  assert.doesNotMatch(contents, /onAction\(|permissions|ROLE_/);
});

test('migrated User controllers use named sources and the application viewer', () => {
  const publicProfile = source('src/pages/PublicUserProfile.jsx');
  assert.match(publicProfile, /adaptUserPublicProfile/);
  assert.match(publicProfile, /state\) => state\.viewer/);
  const vendorOrders = source('src/pages/VendorOrders.jsx');
  assert.match(vendorOrders, /adaptUserOrderCustomerSnapshot/);
  assert.match(vendorOrders, /state\) => state\.viewer/);
  const adminDashboard = source('src/pages/AdminDashboard.jsx');
  assert.match(adminDashboard, /adaptUserAdminManagementRecord/);
  assert.match(adminDashboard, /adaptPlatformAnalyticsProjection/);
});

test('Phase 2 Vendor containers receive canonical models, access, and actions', () => {
  for (const file of [
    'src/components/modals/VendorModal.jsx',
    'src/components/modals/VendorSummaryCard.jsx',
  ]) {
    const contents = source(file);
    assert.doesNotMatch(contents, /adaptVendor|buildVendorAccess|buildVendorActions|services\//, file);
    assert.doesNotMatch(contents, /\bpermissions\b|\bsource\b/, file);
  }

  for (const file of [
    'src/pages/VendorCatalog.jsx',
    'src/pages/VendorProfile.jsx',
    'src/pages/VendorSettings.jsx',
  ]) {
    const contents = source(file);
    assert.match(contents, /adaptEntityFromNamedSource/);
    assert.match(contents, /state\) => state\.viewer|\{ viewer(?:,|\s*\})/);
    assert.match(contents, /buildVendorAccess/);
  }
});

test('Product catalog, search, and recommendations share the canonical summary boundary', () => {
  for (const file of [
    'src/pages/ProductCatalog.jsx',
    'src/components/ProductSearch.jsx',
    'src/components/ProductRecommendations.jsx',
  ]) {
    const contents = source(file);
    assert.match(contents, /ProductSummary/);
    assert.match(contents, /buildProductAccess/);
    assert.doesNotMatch(contents, /\.toFixed\(|discountedPrice|stockQuantity\s*[<>]/, file);
  }
  assert.match(source('src/components/ProductRecommendations.jsx'), /adaptRecommendationsProjection/);
  assert.match(source('src/components/ProductSearch.jsx'), /adaptProductSearchProjection/);
});

test('shared entity dialog owns accessible overlay behavior', () => {
  const contents = source('src/components/modals/EntityDialog.jsx');
  const userModal = source('src/components/modals/UserModal.jsx');
  assert.match(contents, /role="dialog"/);
  assert.match(contents, /aria-modal="true"/);
  assert.match(contents, /event\.key === 'Escape'/);
  assert.match(contents, /event\.key !== 'Tab'/);
  assert.match(contents, /previousFocusRef\.current\?\.focus/);
  assert.match(contents, /dialogRef\.current\?\.focus/);
  assert.doesNotMatch(contents, /closeRef\.current\?\.focus/);
  assert.doesNotMatch(userModal, /closeButtonRef\.current\?\.focus/);
});

test('super-admin bugfix flows use existing complete request and product submission APIs', () => {
  const adminDashboard = source('src/pages/AdminDashboard.jsx');
  assert.match(adminDashboard, /adminRequestService\.getAllRequests/);
  assert.match(adminDashboard, /adminService\.sendNotification/);
  assert.match(adminDashboard, /commissionService\.updateOrderStatus/);
  assert.match(adminDashboard, /String\(status\)\.toUpperCase\(\)/);
  assert.match(adminDashboard, /setOrders\(\(current\) => current\.map\(applyStatus\)\)/);
  assert.match(adminDashboard, /setDetailOrder\(\(current\).*applyStatus\(current\)/);
  assert.match(source('src/pages/UploadProduct.jsx'), /productService\.submitForApproval/);
  const bannedUser = source('src/pages/BannedUser.jsx');
  assert.match(bannedUser, /role="dialog"/);
  assert.match(bannedUser, /navigator\.clipboard\?\.writeText/);
  assert.match(bannedUser, /document\.execCommand\('copy'\)/);
  assert.match(bannedUser, /Copy Email/);
  assert.match(bannedUser, /Open Email App/);
  assert.match(bannedUser, /support@giftastic\.com/);
  assert.doesNotMatch(bannedUser, /window\.location\.href = supportHref/);
  const protectedRoute = source('src/components/ProtectedRoute.jsx');
  assert.match(protectedRoute, /isUserBanned/);
  assert.match(protectedRoute, /Navigate to="\/banned" replace/);
});

test('Product and Order modal shells are canonical presentation containers', () => {
  for (const file of [
    'src/components/modals/ProductModal.jsx',
    'src/components/modals/OrderModal.jsx',
    'src/ui/entities/order/sections/OrderCustomerSection.jsx',
  ]) {
    const contents = source(file);
    assert.doesNotMatch(contents, /adapt(Product|Order|User)|build(Product|Order|User)Access|services\//, file);
    assert.doesNotMatch(contents, /\bviewer\b|\bpermissions\b|\bcontext\b|\bproductId\b/, file);
  }
  assert.match(source('src/pages/OrderDetails.jsx'), /adaptOrderDomain/);
  assert.match(source('src/pages/VendorOrders.jsx'), /adaptOrderVendorListRecord/);
  assert.match(source('src/pages/Orders.jsx'), /adaptOrderCustomerListRecord/);
});

test('admin product management loads all statuses from the protected dashboard endpoint', () => {
  assert.match(source('src/services/adminService.js'), /api\.get\('\/admin\/dashboard\/products'/);
  assert.match(source('src/pages/AdminDashboard.jsx'), /adminService\.getAllProducts\(\)/);
});

test('super-admin branch UI regressions stay fixed at their frontend boundaries', () => {
  const restrictionEditor = source('src/ui/entities/userReviewRestriction/UserReviewRestrictionEditor.jsx');
  assert.doesNotMatch(restrictionEditor, /Allow comments|Allow reviews|datetime-local/);
  assert.match(restrictionEditor, /saveDisabled/);

  const adminDashboard = source('src/pages/AdminDashboard.jsx');
  assert.match(adminDashboard, /isRestrictionReasonDirty/);
  assert.match(adminDashboard, /setRestrictionBaselineReason\(mapped\.payload\.reason\)/);
  assert.match(adminDashboard, /setRestrictionDraft\(createReviewRestrictionDraft/);
  assert.match(adminDashboard, /adminService\.deleteProduct/);
  assert.match(adminDashboard, /removeProductState/);
  assert.match(adminDashboard, /Delete Product/);

  const notification = source('src/ui/entities/notification/views/NotificationSemanticViews.jsx');
  assert.doesNotMatch(notification, /"title": "Related entity"/);
  assert.match(notification, /showHeader=\{false\}/);

  const productHero = source('src/ui/entities/product/sections/ProductHeroSection.jsx');
  assert.match(productHero, /grid-cols-\[144px_minmax\(0,1fr\)\]/);
  assert.match(productHero, /<ProductImage/);

  const productImage = source('src/ui/entities/product/ProductImage.jsx');
  assert.match(productImage, /onError=/);
  assert.match(productImage, /image_not_supported/);

  const productManagementCard = source('src/ui/entities/product/ProductManagementCard.jsx');
  assert.match(productManagementCard, /access=\{access\} compact/);

  const productSummary = source('src/ui/entities/product/ProductSummary.jsx');
  assert.match(productSummary, /compact \? 'h-20 w-20'/);

  const adminRequest = source('src/ui/entities/adminRequest/views/AdminRequestSemanticViews.jsx');
  assert.match(adminRequest, /overflow-wrap:anywhere/);
});

test('Product modal hydration belongs to controllers', () => {
  const modal = source('src/components/modals/ProductModal.jsx');
  assert.doesNotMatch(modal, /useEffect|useMemo|productService|mergeProductModels/);
  for (const file of [
    'src/pages/VendorDashboard.jsx',
    'src/pages/VendorAnalytics.jsx',
    'src/pages/AdminDashboard.jsx',
  ]) {
    const contents = source(file);
    assert.match(contents, /buildProductAccess/);
    assert.match(contents, /entity=\{/);
  }
});

test('Gift Flow modal shell is thin and controller owns hydration', () => {
  const modal = source('src/components/modals/GiftFlowModal.jsx');
  assert.doesNotMatch(modal, /adaptGiftFlow|buildGiftFlowAccess|giftFlowService|productService|useEffect/);
  assert.doesNotMatch(modal, /\bviewer\b|\bpermissions\b|\bcontext\b|\bflowId\b/);
  const controller = source('src/components/controllers/GiftFlowModalController.jsx');
  assert.match(controller, /adaptGiftFlowResponse/);
  assert.match(controller, /buildGiftFlowAccess/);
  assert.match(controller, /buildGiftFlowActions/);
});

test('Order history and Gift Flow catalog use canonical presentations', () => {
  const orders = source('src/pages/Orders.jsx');
  assert.match(orders, /OrderHistoryCard/);
  assert.match(orders, /adaptOrderCustomerListRecord/);
  const catalog = source('src/pages/GiftFlowCatalog.jsx');
  assert.match(catalog, /GiftFlowSummary/);
  assert.match(catalog, /adaptGiftFlowResponse/);
});

test('Home and Favorites reuse the canonical Gift Flow summary', () => {
  for (const file of ['src/pages/HomePage.jsx', 'src/pages/Favorites.jsx']) {
    const contents = source(file);
    assert.match(contents, /GiftFlowSummary/);
    assert.match(contents, /buildGiftFlowAccess/);
  }
  assert.match(source('src/pages/Favorites.jsx'), /adaptFavoriteLegacyRecord/);
  assert.doesNotMatch(source('src/pages/Favorites.jsx'), /adaptGiftFlow\(|adaptDomainProduct/);
});

test('Cart boundary uses named sources, cached Product hydration, and the checkout command', () => {
  const store = source('src/store/useCartStore.js');
  assert.match(store, /adaptCartResponse/);
  assert.match(store, /adaptGuestCart/);
  assert.match(store, /hydrateEntityById/);
  assert.match(source('src/ui/entities/shared/productionHydration.js'), /const caches/);
  assert.doesNotMatch(store, /adaptCart\(|adaptDomainProduct/);
  const checkout = source('src/pages/Checkout.jsx');
  assert.match(checkout, /mapCartToOrderDraft/);
  assert.match(checkout, /commandDraftToPayload\('checkout'/);
  assert.match(checkout, /adaptDeliveryZoneResponse/);
});

test('Review, Category, Vendor Application, and financial modals are thin semantic containers', () => {
  for (const file of [
    'src/components/modals/ReviewModal.jsx',
    'src/components/modals/CategoryModal.jsx',
    'src/components/modals/VendorApplicationModal.jsx',
    'src/components/modals/CommissionModal.jsx',
  ]) {
    const contents = source(file);
    assert.doesNotMatch(contents, /adapt[A-Z]|build[A-Z].*Access|services\//, file);
    assert.doesNotMatch(contents, /\bviewer\b|\bpermissions\b|\bcontext\b|\bsource\b/, file);
  }
});

test('Review and Vendor Application controllers use named sources and canonical Viewer access', () => {
  assert.match(source('src/components/ReviewList.jsx'), /adaptReviewPublicResponse/);
  assert.match(source('src/pages/MyReviews.jsx'), /adaptReviewSelfResponse/);
  assert.match(source('src/pages/ModeratorReviews.jsx'), /adaptReviewModerationResponse/);
  for (const file of ['src/pages/MyVendorApplications.jsx', 'src/pages/AdminVendorApplications.jsx']) {
    const contents = source(file);
    assert.match(contents, /adaptVendorApplicationResponse/);
    assert.match(contents, /state\) => state\.viewer/);
  }
});

test('Report, Admin Request, and Notification details use thin semantic dialogs', () => {
  for (const file of [
    'src/components/modals/ReportModal.jsx',
    'src/components/modals/AdminRequestModal.jsx',
    'src/components/modals/NotificationModal.jsx',
  ]) {
    const contents = source(file);
    assert.doesNotMatch(contents, /adapt[A-Z]|build[A-Z].*Access|services\//, file);
    assert.doesNotMatch(contents, /\bviewer\b|\bpermissions\b|\bcontext\b|\bsource\b/, file);
  }
  assert.match(source('src/pages/AdminReports.jsx'), /adaptReportDomain/);
  assert.match(source('src/pages/AdminDashboard.jsx'), /adaptAdminRequestDto/);
  assert.match(source('src/pages/Notifications.jsx'), /loadNotificationWorkflow/);
  assert.match(source('src/components/NotificationBell.jsx'), /loadNotificationWorkflow/);
  assert.match(source('src/ui/workflows/notificationWorkflow.js'), /adaptNotificationOwnerRecord/);
});

test('Delivery and assistance controllers use named source contracts', () => {
  assert.match(source('src/components/ZoneSelector.jsx'), /adaptDeliveryZoneResponse/);
  const pricing = source('src/pages/VendorDeliveryPricing.jsx');
  assert.match(pricing, /adaptVendorDeliveryPricingResponse/);
  assert.match(pricing, /state\) => state\.viewer/);
  assert.match(source('src/pages/VendorOrders.jsx'), /adaptOrderAssistanceDto/);
});

test('Reminder, Vendor Activity, restriction, and Favorite production boundaries are canonical', () => {
  const dashboard = source('src/pages/UserDashboard.jsx');
  assert.match(dashboard, /adaptReminderDomain/);
  assert.match(dashboard, /reminderService\.getMyReminders/);
  assert.match(dashboard, /state\) => state\.viewer/);
  const activity = source('src/pages/VendorActivityDashboard.jsx');
  assert.match(activity, /adaptVendorActivityResponse/);
  assert.match(activity, /state\) => state\.viewer/);
  assert.match(source('src/pages/MyReviews.jsx'), /adaptUserReviewRestrictionResponse/);
  for (const file of ['src/pages/Favorites.jsx', 'src/pages/ProductCatalog.jsx', 'src/pages/ProductDetails.jsx']) {
    assert.match(source(file), /adaptFavoriteLegacyRecord/, file);
  }
});

test('Order Assistance presentation receives controller-built actions and messages', () => {
  const section = source('src/ui/entities/order/sections/OrderAssistanceSection.jsx');
  assert.doesNotMatch(section, /buildOrderAssistanceActions|getOrderAssistanceMessages|buildOrderAssistanceAccess/);
  const controller = source('src/pages/VendorOrders.jsx');
  assert.match(controller, /buildOrderAssistanceActions/);
  assert.match(controller, /getOrderAssistanceMessages/);
  assert.match(controller, /adaptOrderAssistanceDto/);
});

test('Tasks 1-2: exhaustive production inventory references existing consumers and registered adapters', () => {
  assert.equal(PRODUCTION_MIGRATION_INVENTORY.length, 23);
  const entities = new Set();
  for (const row of PRODUCTION_MIGRATION_INVENTORY) {
    assert.ok(!entities.has(row.entity), `duplicate inventory entity: ${row.entity}`);
    entities.add(row.entity);
    assert.ok(row.consumers.length > 0, `${row.entity} has no production consumers`);
    assert.ok(row.representation, `${row.entity} has no representation ownership`);
    for (const consumer of row.consumers) {
      assert.ok(existsSync(resolve(process.cwd(), consumer)), `${row.entity}: missing consumer ${consumer}`);
    }
    for (const adapter of row.adapters) {
      assert.ok(ENTITY_ADAPTER_NAMES.includes(adapter), `${row.entity}: unknown adapter ${adapter}`);
      assert.ok(NAMED_SOURCE_CONTRACTS[adapter], `${row.entity}: missing source contract ${adapter}`);
    }
  }
  assert.ok(PRODUCTION_MIGRATION_LOCATIONS.length > PRODUCTION_MIGRATION_INVENTORY.length);
  const allowedStatuses = new Set(['MIGRATED', 'EXCEPTION', 'BLOCKED_BY_BACKEND']);
  for (const location of PRODUCTION_MIGRATION_LOCATIONS) {
    assert.ok(allowedStatuses.has(location.status), `${location.entity}: ${location.file} has invalid status ${location.status}`);
    if (location.status === 'BLOCKED_BY_BACKEND') {
      assert.ok(location.backendBlocker, `${location.entity}: ${location.file} has no backend blocker`);
    }
    assert.ok(location.component, `${location.entity}: ${location.file} has no component/boundary`);
    assert.ok(location.namedAdapters.length > 0, `${location.entity}: ${location.file} has no adapter`);
    assert.ok(location.endpointFamilies.length > 0, `${location.entity}: ${location.file} has no endpoint family`);
    assert.equal(Object.keys(location.requiredCanonicalFields).length, location.namedAdapters.length);
    assert.equal(Object.keys(location.sourceCompleteness).length, location.namedAdapters.length);
    assert.ok(location.semanticPresentation, `${location.entity}: ${location.file} has no presentation`);
    assert.ok(location.evidence, `${location.entity}: ${location.file} has no evidence`);
  }
  const coveredMethods = new Set(PRODUCTION_MIGRATION_LOCATIONS.flatMap((location) => location.serviceMethods));
  for (const method of ENTITY_BEARING_SERVICE_METHODS) {
    assert.ok(coveredMethods.has(method), `entity-bearing service method has no inventory location: ${method}`);
  }
  const adminLocations = PRODUCTION_MIGRATION_LOCATIONS.filter((location) =>
    location.file === 'src/pages/AdminDashboard.jsx');
  assert.ok(adminLocations.some((location) =>
    location.entity === 'orderAssistance'
    && location.namedAdapters.length === 1
    && location.namedAdapters[0] === 'adaptOrderAssistanceDto'));
  assert.ok(adminLocations.some((location) =>
    location.entity === 'user'
    && location.namedAdapters.includes('adaptUserAdminManagementRecord')));
  const discoveredMethods = new Set();
  for (const directory of ['pages', 'components', 'store', 'ui/workflows']) {
    const base = resolve(process.cwd(), `src/${directory}`);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !/\.(js|jsx)$/.test(entry.name)) continue;
      const contents = readFileSync(resolve(entry.parentPath || entry.path, entry.name), 'utf8');
      for (const match of contents.matchAll(/\b([a-z][A-Za-z]+Service)\.([A-Za-z][A-Za-z0-9_]*)/g)) {
        if (match[2] === 'js') continue;
        discoveredMethods.add(`${match[1]}.${match[2]}`);
      }
    }
  }
  const missingMethods = [...discoveredMethods].filter((method) => !coveredMethods.has(method));
  assert.deepEqual(missingMethods, [], `production service methods missing inventory locations: ${missingMethods.join(', ')}`);
});

test('Tasks 1-2: page-owned assistance, permission identity, and review moderation representations are removed', () => {
  const admin = source('src/pages/AdminDashboard.jsx');
  assert.match(admin, /OrderAssistanceSemanticViews\.OrderAssistanceAdminCard/);
  assert.match(admin, /OrderAssistanceSemanticViews\.OrderAssistanceThread/);
  assert.match(admin, /AdminRequestSemanticViews\.AdminRequestModerationCard/);
  assert.match(admin, /getUserReferenceLabel/);
  assert.doesNotMatch(admin, /request\.supplierName|selectedUser\?\.email|u\.email|req\.userEmail|req\.userFullName/);

  const moderation = source('src/pages/ModeratorReviews.jsx');
  assert.match(moderation, /ReviewSemanticViews\.ReviewModerationCard/);
  assert.match(moderation, /ReviewSemanticViews\.ReviewModerationExcerpt/);
  assert.doesNotMatch(moderation, /renderStars|getReviewAuthorName|formatReviewContentScore/);
});

test('Tasks 3-4: interpretation, unsafe writes, and hydration authorization stay centralized', () => {
  const reports = source('src/pages/AdminReports.jsx');
  assert.match(reports, /getReportStatusLabel/);
  assert.doesNotMatch(reports, /replaceAll\('_', ' '\)/);

  const moderation = source('src/pages/ModeratorReviews.jsx');
  assert.doesNotMatch(moderation, /approveVendorFeedback|rejectVendorFeedback|buildVendorFeedbackActions/);

  const admin = source('src/pages/AdminDashboard.jsx');
  assert.match(admin, /rejectProduct/);
  assert.match(admin, /authorizeEntityHydration/);

  const pricing = source('src/pages/VendorDeliveryPricing.jsx');
  assert.match(pricing, /buildVendorDeliveryPricingCollectionActions/);
  assert.match(pricing, /adaptVendorDeliveryPricingResponse/);

  for (const file of [
    'src/store/useCartStore.js',
    'src/pages/Favorites.jsx',
    'src/pages/GiftFlowStep.jsx',
    'src/components/controllers/GiftFlowModalController.jsx',
    'src/pages/AdminDashboard.jsx',
    'src/pages/VendorAnalytics.jsx',
  ]) {
    assert.doesNotMatch(source(file), /authorized:\s*true/, file);
  }
  assert.match(source('src/pages/AdminFinancial.jsx'), /<VendorSummary model=\{vendor\.entity\}/);
});

test('Task 5: superseded unsafe services, raw admin identity, and page-owned permission meaning are absent', () => {
  assert.equal(existsSync(resolve(process.cwd(), 'src/components/modals/shared/EntitySection.jsx')), false);
  assert.match(source('src/services/adminService.js'), /rejectProduct/, 'src/services/adminService.js');
  assert.doesNotMatch(source('src/services/productService.js'), /rejectProduct/, 'src/services/productService.js');
  assert.doesNotMatch(source('src/services/reviewService.js'), /approveVendorFeedback|rejectVendorFeedback/);

  const admin = source('src/pages/AdminDashboard.jsx');
  assert.doesNotMatch(admin, /const PERMISSION_META|document\.createElement|innerHTML|profile\.permissions|profile\.isSuperAdmin|user\?\.email/);
  assert.match(admin, /USER_PERMISSION_META|getReadableUserField|getUserReferenceLabel/);

  const checkout = source('src/pages/Checkout.jsx');
  assert.doesNotMatch(checkout, /selectedZone\.name|user\.email/);
  assert.match(checkout, /selectedZone\.zoneName|getReadableUserField|addDecimals/);

  const feedback = source('src/pages/ModeratorReviews.jsx');
  assert.doesNotMatch(feedback, /selectedItem\.feedback/);
  assert.match(feedback, /VendorFeedbackModerationExcerpt/);
});

test('Task 5: rich entity sections live in entity domains, not modal-owned directories', () => {
  for (const directory of ['product', 'order', 'giftFlow', 'vendor']) {
    const legacyDirectory = resolve(process.cwd(), `src/components/modals/${directory}`);
    const legacyFiles = existsSync(legacyDirectory)
      ? readdirSync(legacyDirectory, { recursive: true, withFileTypes: true })
          .filter((entry) => entry.isFile())
      : [];
    assert.equal(legacyFiles.length, 0, directory);
  }
  for (const directory of ['product', 'order', 'giftFlow', 'vendor']) {
    assert.equal(existsSync(resolve(process.cwd(), `src/ui/entities/${directory}/sections`)), true, directory);
  }
});

test('Task 4: high-use management representations are entity-owned', () => {
  const admin = source('src/pages/AdminDashboard.jsx');
  assert.match(admin, /UserManagementRow/);
  assert.match(admin, /VendorManagementCard/);
  assert.match(admin, /ProductManagementCard/);
  assert.match(admin, /OrderManagementCard/);
  assert.match(source('src/pages/VendorDashboard.jsx'), /ProductInventoryRow/);
  assert.match(source('src/pages/VendorOrders.jsx'), /VendorOrderRow/);
  assert.match(source('src/pages/UserDashboard.jsx'), /OrderHistoryCard/);
  assert.match(source('src/pages/Cart.jsx'), /CartGroupView/);
  assert.match(source('src/pages/ProductDetails.jsx'), /ProductPublicDetails/);
  assert.match(source('src/pages/GiftFlowStep.jsx'), /GiftFlowExecutionHeader/);
  assert.match(source('src/pages/GiftFlowStep.jsx'), /ProductFlowReferenceCard/);
  assert.match(source('src/pages/VendorGiftFlows.jsx'), /GiftFlowEditorListItem/);
  assert.match(source('src/pages/VendorGiftFlows.jsx'), /ProductFlowReferenceCard/);
  assert.match(source('src/components/GlobalSearch.jsx'), /ProductSearchResult/);
  assert.match(source('src/components/GlobalSearch.jsx'), /VendorSearchResult/);
  assert.match(source('src/components/GlobalSearch.jsx'), /GiftFlowSearchResult/);
});

test('Task 3: hydrated Viewer facets are persisted through the canonical session boundary', () => {
  const auth = source('src/services/authService.js');
  const store = source('src/store/useAuthStore.js');
  assert.match(auth, /sessionPayload\(user, viewer = null\)/);
  assert.match(auth, /persistSession\(\{ token: data\.token, user: sessionPayload\(session\.user, session\.viewer\) \}\)/);
  assert.match(auth, /isSuperAdmin: viewer\?\.isSuperAdmin/);
  assert.match(store, /authService\.setCurrentUser\(current\.user, viewer\)/);
  assert.match(store, /set\(sessionState\(session\)\)/);
});

test('Audit chunk 2 regressions stay closed across Product, Vendor, and search consumers', () => {
  const details = source('src/pages/ProductDetails.jsx');
  assert.doesNotMatch(details, /isProductInStock/);

  const catalog = source('src/pages/ProductCatalog.jsx');
  assert.match(catalog, /productService\.getProducts/);
  assert.match(catalog, /adaptProductDomain/);
  assert.match(catalog, /filters\.categoryId/);
  assert.match(catalog, /filters\.sortBy === 'price-asc'/);
  assert.match(catalog, /loadError/);

  const vendorProfile = source('src/pages/VendorProfile.jsx');
  assert.match(vendorProfile, /vendorService\.getVendorProducts\(supplierId\)/);
  assert.doesNotMatch(vendorProfile, /productService\.getProducts/);
  assert.match(vendorProfile, /productAccessFor|flowAccessFor/);

  for (const file of [
    'src/components/GlobalSearch.jsx',
    'src/components/ProductSearch.jsx',
    'src/components/ProductRecommendations.jsx',
  ]) {
    assert.match(source(file), /requestGeneration/, file);
  }

  const analytics = source('src/pages/VendorAnalytics.jsx');
  assert.match(analytics, /fetchAnalytics\(clearedRange\)/);
  assert.doesNotMatch(analytics, /setTimeout\(fetchAnalytics/);

  assert.match(source('src/ui/entities/vendor/sections/VendorProductsSection.jsx'), /ProductSummary/);
  assert.match(source('src/ui/entities/vendor/sections/VendorFlowsSection.jsx'), /GiftFlowSummary/);
});
