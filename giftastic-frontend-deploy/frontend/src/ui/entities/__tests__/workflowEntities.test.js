import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptCategory } from '../category/categoryAdapters.js';
import { buildCategoryAccess, CATEGORY_CONTEXT } from '../category/categoryAccess.js';
import { adaptNotification } from '../notification/notificationAdapters.js';
import { buildNotificationAccess } from '../notification/notificationAccess.js';
import { buildNotificationActions } from '../notification/notificationActions.js';
import { adaptVendorApplication } from '../vendorApplication/vendorApplicationAdapters.js';
import { buildVendorApplicationAccess, VENDOR_APPLICATION_CONTEXT } from '../vendorApplication/vendorApplicationAccess.js';
import { buildVendorApplicationActions } from '../vendorApplication/vendorApplicationActions.js';
import { adaptAdminRequest } from '../adminRequest/adminRequestAdapters.js';
import { buildAdminRequestAccess, ADMIN_REQUEST_CONTEXT } from '../adminRequest/adminRequestAccess.js';
import { adaptCommission } from '../commission/commissionAdapters.js';
import { buildCommissionAccess, COMMISSION_CONTEXT } from '../commission/commissionAccess.js';
import { buildCommissionActions } from '../commission/commissionActions.js';
import { sumCommissionAmounts } from '../commission/commissionSelectors.js';
import { adaptCommissionPaymentRequest } from '../commissionPaymentRequest/commissionPaymentRequestAdapters.js';
import { buildCommissionPaymentRequestAccess, COMMISSION_PAYMENT_REQUEST_CONTEXT } from '../commissionPaymentRequest/commissionPaymentRequestAccess.js';
import { buildCommissionPaymentRequestActions } from '../commissionPaymentRequest/commissionPaymentRequestActions.js';
import { adaptCommissionRule } from '../commissionRule/commissionRuleAdapters.js';
import { buildCommissionRuleAccess } from '../commissionRule/commissionRuleAccess.js';
import { buildCommissionRuleActions } from '../commissionRule/commissionRuleActions.js';
import { adaptOrder } from '../order/orderAdapters.js';
import { buildOrderAccess, ORDER_CONTEXT } from '../order/orderAccess.js';
import { getOrderStatusOptions } from '../order/orderActions.js';
import { getOrderVisibleTotal } from '../order/orderSelectors.js';
import { adaptGiftFlow } from '../giftFlow/giftFlowAdapters.js';
import { buildGiftFlowAccess, GIFT_FLOW_CONTEXT } from '../giftFlow/giftFlowAccess.js';
import { adaptReview } from '../review/reviewAdapters.js';
import { buildReviewAccess, REVIEW_CONTEXT } from '../review/reviewAccess.js';
import { adaptCart } from '../cart/cartAdapters.js';
import { buildCartAccess, CART_CONTEXT } from '../cart/cartAccess.js';
import { getCartItemCount, getCartTotal, groupCartItems } from '../cart/cartSelectors.js';

test('Category aliases normalize to one identity and management requires exact permission', () => {
  const category = adaptCategory({ categoryId: 'c1', categoryName: 'Flowers' });
  assert.equal(category.id, 'c1');
  assert.equal(category.name, 'Flowers');
  assert.equal(buildCategoryAccess({
    viewer: { permissions: ['VIEW_USERS'] },
    context: CATEGORY_CONTEXT.ADMIN,
  }).canManage, false);
  assert.equal(buildCategoryAccess({
    viewer: { permissions: ['MANAGE_CATEGORIES'] },
    context: CATEGORY_CONTEXT.ADMIN,
  }).canManage, true);
});

test('Notification reading is owner-scoped and metadata parsing is safe', () => {
  const notification = adaptNotification({
    id: 'n1', userId: 'u1', read: false, metadata: '{"orderId":"o1"}',
  });
  assert.deepEqual(notification.relatedEntity, {
    entityType: null,
    id: 'o1',
    loaded: false,
  });
  const denied = buildNotificationAccess({ notification, viewer: { id: 'u2' } });
  const allowed = buildNotificationAccess({ notification, viewer: { id: 'u1' } });
  assert.equal(denied.canRead, false);
  assert.equal(allowed.canRead, true);
  assert.deepEqual(buildNotificationActions({
    notification, access: allowed, handlers: { markRead() {} },
  }).map((action) => action.key), ['markRead']);
});

test('Vendor Application owner cannot review and admin needs the relevant permission', () => {
  const application = adaptVendorApplication({ id: 'a1', userId: 'u1', status: 'PENDING' });
  const owner = buildVendorApplicationAccess({
    application, viewer: { id: 'u1' }, context: VENDOR_APPLICATION_CONTEXT.SELF,
  });
  const reviewer = buildVendorApplicationAccess({
    application,
    viewer: { permissions: ['ACTIVATE_VENDORS'] },
    context: VENDOR_APPLICATION_CONTEXT.ADMIN,
  });
  assert.equal(owner.canRead, true);
  assert.equal(owner.canReview, false);
  assert.deepEqual(buildVendorApplicationActions({
    application, access: reviewer, handlers: { approve() {}, reject() {} },
  }).map((action) => action.key), ['approve', 'reject']);
});

test('Admin Request review and cooldown reset use separate permissions', () => {
  const request = adaptAdminRequest({ id: 'r1', userId: 'u1', status: 'REJECTED', canReapplyAt: '2030-01-01' });
  assert.equal(adaptAdminRequest(request), request);
  const reviewer = buildAdminRequestAccess({
    request,
    viewer: { permissions: ['REVIEW_ADMIN_REQUESTS'] },
    context: ADMIN_REQUEST_CONTEXT.ADMIN,
  });
  const promoter = buildAdminRequestAccess({
    request,
    viewer: { permissions: ['MAKE_ADMINS'] },
    context: ADMIN_REQUEST_CONTEXT.ADMIN,
  });
  assert.equal(reviewer.canReview, true);
  assert.equal(reviewer.canResetCooldown, false);
  assert.equal(promoter.canReview, false);
  assert.equal(promoter.canResetCooldown, true);
});

test('Commission financial access is owner or explicit financial permission only', () => {
  const commission = adaptCommission({
    id: 'c1',
    supplierId: 'v1',
    status: 'PENDING',
    commissionAmount: 50,
    isOverdue: true,
  });
  const owner = buildCommissionAccess({
    commission, viewer: { supplierId: 'v1' },
  });
  assert.equal(owner.canRead, true);
  assert.equal(owner.canSubmitPayment, true);
  assert.equal(commission.overdue, true);
  assert.deepEqual(buildCommissionActions({
    commission,
    access: owner,
    handlers: { submitPayment() {} },
  }).map((action) => action.key), ['submitPayment']);
  const urgeOnly = buildCommissionAccess({
    commission,
    viewer: { permissions: ['URGE_COMMISSION_PAYMENT'] },
    context: COMMISSION_CONTEXT.ADMIN,
  });
  assert.equal(urgeOnly.canRead, true);
  assert.equal(urgeOnly.canUrgePayment, true);
  assert.deepEqual(buildCommissionActions({
    commission,
    access: urgeOnly,
    handlers: { urge() {} },
  }).map((action) => action.key), ['urge']);
  assert.equal(buildCommissionAccess({
    commission,
    viewer: { permissions: ['VIEW_FINANCIAL_DATA'] },
    context: COMMISSION_CONTEXT.ADMIN,
  }).canRead, true);
  assert.equal(sumCommissionAmounts([commission]), '50');
  assert.equal(sumCommissionAmounts([commission, { commissionAmount: null }]), null);
});

test('Payment proof review and Commission Rule access are least-privilege', () => {
  const request = adaptCommissionPaymentRequest({ id: 'p1', supplierId: 'v1', status: 'PENDING', proofImageUrl: '/proof.png' });
  assert.equal(adaptCommissionPaymentRequest(request), request);
  const ownerAccess = buildCommissionPaymentRequestAccess({
    request,
    viewer: { supplierId: 'v1' },
    context: COMMISSION_PAYMENT_REQUEST_CONTEXT.OWNER,
  });
  assert.equal(ownerAccess.canRead, true);
  assert.equal(ownerAccess.canViewProof, true);
  assert.equal(ownerAccess.canReview, false);
  const reviewAccess = buildCommissionPaymentRequestAccess({
    request,
    viewer: { permissions: ['REVIEW_COMMISSION_PAYMENTS'] },
    context: COMMISSION_PAYMENT_REQUEST_CONTEXT.ADMIN,
  });
  assert.equal(reviewAccess.canViewProof, true);
  assert.deepEqual(buildCommissionPaymentRequestActions({
    request, access: reviewAccess, handlers: { approve() {}, reject() {} },
  }).map((action) => action.key), ['approve', 'reject']);

  const rule = adaptCommissionRule({
    id: 'rule1',
    type: 'SUPPLIER_SPECIFIC',
    supplierId: 'v1',
    supplierName: 'Canonical Gifts',
    active: true,
    rate: 0.1,
  });
  assert.equal(rule.supplierName, 'Canonical Gifts');
  assert.equal(adaptCommissionRule(rule), rule);
  assert.equal(buildCommissionRuleAccess({
    rule, viewer: { permissions: ['VIEW_FINANCIAL_DATA'] },
  }).canRead, false);
  const ruleManager = buildCommissionRuleAccess({
    rule, viewer: { permissions: ['MANAGE_COMMISSIONS'] },
  });
  assert.equal(ruleManager.canRead, true);
  assert.deepEqual(buildCommissionRuleActions({
    rule,
    access: ruleManager,
    handlers: { deactivate() {} },
  }).map((action) => action.key), ['deactivate']);
});

test('Order vendor access is limited to participating items and financial permission is separate', () => {
  const order = adaptOrder({
    id: 'o1',
    customerId: 'u1',
    status: 'PAID',
    items: [
      { productId: 'p1', supplierId: 'v1', price: 10, quantity: 1 },
      { productId: 'p2', supplierId: 'v2', price: 20, quantity: 1 },
    ],
    totalAmount: 30,
  });
  const vendor = buildOrderAccess({
    order, viewer: { supplierId: 'v1' }, context: ORDER_CONTEXT.VENDOR,
  });
  assert.equal(vendor.canRead, true);
  assert.deepEqual(vendor.visibleItems.map((item) => item.productId), ['p1']);
  assert.equal(vendor.sections.payment, false);
  assert.equal(vendor.sections.commission, false);
  assert.equal(getOrderVisibleTotal(order, vendor), '10');
  assert.deepEqual(getOrderStatusOptions(order, vendor), ['PAID', 'SHIPPED']);
  const partialOrder = adaptOrder({
    ...order,
    items: [{ productId: 'p1', supplierId: 'v1', price: 10 }],
  });
  const partialVendor = buildOrderAccess({
    order: partialOrder, viewer: { supplierId: 'v1' }, context: ORDER_CONTEXT.VENDOR,
  });
  assert.equal(getOrderVisibleTotal(partialOrder, partialVendor), null);
});

test('Order admin status controls require the exact permission and include backend states', () => {
  const order = adaptOrder({ id: 'o-admin', status: 'PAID', items: [], totalAmount: 20 });
  const readOnly = buildOrderAccess({
    order,
    viewer: { permissions: ['VIEW_ORDERS'] },
    context: ORDER_CONTEXT.ADMIN,
  });
  const statusManager = buildOrderAccess({
    order,
    viewer: { permissions: ['VIEW_ORDERS', 'MANAGE_ORDER_STATUS'] },
    context: ORDER_CONTEXT.ADMIN,
  });
  const vendorAdmin = buildOrderAccess({
    order: adaptOrder({
      id: 'o-vendor-admin', status: 'PAID',
      items: [{ productId: 'p1', supplierId: 'v1', quantity: 1, price: 20 }],
      totalAmount: 20,
    }),
    viewer: { supplierId: 'v1', permissions: ['VIEW_ORDERS', 'MANAGE_ORDER_STATUS'] },
    context: ORDER_CONTEXT.ADMIN,
  });

  assert.equal(readOnly.canRead, true);
  assert.equal(readOnly.sections.statusControls, false);
  assert.equal(statusManager.sections.statusControls, true);
  assert.deepEqual(getOrderStatusOptions(order, readOnly), ['PAID']);
  assert.equal(getOrderStatusOptions(order, statusManager).includes('REFUNDED'), true);
  assert.deepEqual(getOrderStatusOptions(order, vendorAdmin), ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']);
});

test('Gift Flow owner and admin management are additive but public configuration remains hidden', () => {
  const flow = adaptGiftFlow({
    id: 'f1',
    supplierId: 'v1',
    configuration: '{"steps":[{"products":[{"productId":"p1"}]}]}',
  });
  assert.deepEqual(flow.productIds, ['p1']);
  assert.equal(buildGiftFlowAccess({
    flow, context: GIFT_FLOW_CONTEXT.PUBLIC,
  }).sections.configuration, false);
  assert.equal(buildGiftFlowAccess({
    flow, viewer: { supplierId: 'v1' }, context: GIFT_FLOW_CONTEXT.OWNER,
  }).sections.configuration, true);

  const legacyFlow = adaptGiftFlow({
    id: 'f2',
    configuration: { steps: [{ productIds: ['p2', 'p3'] }] },
  });
  assert.deepEqual(legacyFlow.productIds, ['p2', 'p3']);
  assert.deepEqual(
    legacyFlow.parsedConfiguration.steps[0].products.map((product) => product.productId),
    ['p2', 'p3'],
  );
});

test('Anonymous Review author is hidden publicly but moderation still requires permission', () => {
  const review = adaptReview({
    id: 'rev1', userId: 'u1', isAnonymous: true, status: 'PENDING_REVIEW',
  });
  const publicAccess = buildReviewAccess({ review, context: REVIEW_CONTEXT.PUBLIC });
  const moderator = buildReviewAccess({
    review,
    viewer: { permissions: ['MODERATE_REVIEWS'] },
    context: REVIEW_CONTEXT.MODERATION,
  });
  assert.equal(publicAccess.fields.author, false);
  assert.equal(publicAccess.canRead, false);
  assert.equal(moderator.fields.author, true);
  assert.equal(moderator.canModerate, true);
  assert.equal(moderator.canRead, true);

  const approved = adaptReview({ id: 'rev2', status: 'APPROVED', isAnonymous: false });
  assert.equal(buildReviewAccess({ review: approved, context: REVIEW_CONTEXT.PUBLIC }).canRead, true);
});

test('Cart is readable only by its owning User and parses item metadata safely', () => {
  const cart = adaptCart({
    id: 'cart1',
    customerId: 'u1',
    items: [{ productId: 'p1', quantity: 2, metadata: '{"engraving":"Hi"}' }],
  });
  assert.equal(cart.items[0].parsedMetadata.engraving, 'Hi');
  assert.equal(buildCartAccess({ cart, viewer: { id: 'u1' } }).canRead, true);
  assert.equal(buildCartAccess({ cart, viewer: { id: 'u2' } }).canRead, false);
  assert.equal(getCartItemCount(cart), 2);
  assert.equal(getCartTotal(cart), null);
  assert.equal(groupCartItems(cart).length, 1);

  const guestCart = adaptCart({ items: [] }, { source: 'guest-cart' });
  assert.equal(buildCartAccess({
    cart: guestCart,
    context: CART_CONTEXT.GUEST_LOCAL,
  }).canManage, true);
  assert.equal(buildCartAccess({ cart: guestCart, viewer: { id: 'u2' } }).canRead, false);
});
