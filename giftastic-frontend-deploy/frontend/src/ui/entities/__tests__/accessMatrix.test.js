import test from 'node:test';
import assert from 'node:assert/strict';

import { createViewer } from '../shared/viewer.js';
import { adaptProduct } from '../product/productAdapters.js';
import { buildProductAccess, PRODUCT_CONTEXT } from '../product/productAccess.js';
import { adaptOrder } from '../order/orderAdapters.js';
import { buildOrderAccess, ORDER_CONTEXT } from '../order/orderAccess.js';
import { adaptReview } from '../review/reviewAdapters.js';
import { buildReviewAccess, REVIEW_CONTEXT } from '../review/reviewAccess.js';
import { adaptCommissionPaymentRequest } from '../commissionPaymentRequest/commissionPaymentRequestAdapters.js';
import {
  buildCommissionPaymentRequestAccess,
  COMMISSION_PAYMENT_REQUEST_CONTEXT,
} from '../commissionPaymentRequest/commissionPaymentRequestAccess.js';
import { adaptNotification } from '../notification/notificationAdapters.js';
import { buildNotificationAccess } from '../notification/notificationAccess.js';

const guest = createViewer();
const user = createViewer({ id: 'u1', roles: ['ROLE_USER'] });
const vendor = createViewer({ id: 'u2', supplierId: 'v1', roles: ['ROLE_USER', 'ROLE_VENDOR'] });
const vendorCustomer = createViewer({ id: 'u1', supplierId: 'v1', roles: ['ROLE_USER', 'ROLE_VENDOR'] });
const limitedAdmin = createViewer({ id: 'u3', roles: ['ROLE_ADMIN', 'VIEW_ORDERS'] });
const unrelatedAdmin = createViewer({ id: 'u4', roles: ['ROLE_ADMIN', 'VIEW_USERS'] });
const vendorAdmin = createViewer({
  id: 'u5', supplierId: 'v1', roles: ['ROLE_VENDOR', 'ROLE_ADMIN', 'VIEW_ORDERS'],
});
const superAdmin = createViewer({ id: 'u6', roles: ['ROLE_ADMIN', 'SUPER_ADMIN'] });

test('representative entity access remains least-privilege across the viewer matrix', () => {
  const product = adaptProduct({
    id: 'p1', supplierId: 'v1', status: 'DRAFT', stockQuantity: 3, name: 'Private draft',
  }, { complete: true });
  assert.equal(buildProductAccess({ product, viewer: guest, context: PRODUCT_CONTEXT.PUBLIC }).sections.inventory, false);
  assert.equal(buildProductAccess({ product, viewer: vendor, context: PRODUCT_CONTEXT.OWNER_MANAGEMENT }).sections.inventory, true);
  assert.equal(buildProductAccess({ product, viewer: vendorAdmin, context: PRODUCT_CONTEXT.OWNER_MANAGEMENT }).isOwner, true);
  assert.equal(buildProductAccess({ product, viewer: unrelatedAdmin, context: PRODUCT_CONTEXT.ADMIN_MODERATION }).sections.inventory, false);
  assert.equal(buildProductAccess({ product, viewer: superAdmin, context: PRODUCT_CONTEXT.SYSTEM }).sections.system, true);

  const order = adaptOrder({
    id: 'o1', customerId: 'u1', status: 'PAID', totalAmount: 30,
    items: [
      { productId: 'p1', supplierId: 'v1', price: 10, quantity: 1 },
      { productId: 'p2', supplierId: 'v2', price: 20, quantity: 1 },
    ],
  });
  assert.equal(buildOrderAccess({ order, viewer: guest }).canRead, false);
  assert.equal(buildOrderAccess({ order, viewer: user }).isCustomer, true);
  assert.deepEqual(buildOrderAccess({
    order, viewer: vendor, context: ORDER_CONTEXT.VENDOR,
  }).visibleItems.map((item) => item.productId), ['p1']);
  assert.deepEqual(buildOrderAccess({
    order, viewer: vendorCustomer, context: ORDER_CONTEXT.CUSTOMER,
  }).visibleItems.map((item) => item.productId), ['p1', 'p2']);
  assert.equal(buildOrderAccess({
    order, viewer: limitedAdmin, context: ORDER_CONTEXT.ADMIN,
  }).canRead, true);
  assert.equal(buildOrderAccess({
    order, viewer: unrelatedAdmin, context: ORDER_CONTEXT.ADMIN,
  }).canRead, false);
  assert.equal(buildOrderAccess({
    order, viewer: superAdmin, context: ORDER_CONTEXT.SYSTEM,
  }).sections.system, true);

  const review = adaptReview({ id: 'r1', userId: 'u1', status: 'APPROVED', isAnonymous: true });
  assert.equal(buildReviewAccess({ review, viewer: guest }).fields.author, false);
  assert.equal(buildReviewAccess({ review, viewer: user, context: REVIEW_CONTEXT.SELF }).fields.author, true);
  assert.equal(buildReviewAccess({
    review, viewer: unrelatedAdmin, context: REVIEW_CONTEXT.MODERATION,
  }).canRead, false);
  assert.equal(buildReviewAccess({
    review, viewer: superAdmin, context: REVIEW_CONTEXT.MODERATION,
  }).canModerate, true);

  const paymentRequest = adaptCommissionPaymentRequest({
    id: 'pay1', supplierId: 'v1', status: 'PENDING', proofImageUrl: '/proof.png',
  });
  assert.equal(buildCommissionPaymentRequestAccess({
    request: paymentRequest, viewer: vendor,
  }).canViewProof, true);
  assert.equal(buildCommissionPaymentRequestAccess({
    request: paymentRequest,
    viewer: limitedAdmin,
    context: COMMISSION_PAYMENT_REQUEST_CONTEXT.ADMIN,
  }).canViewProof, false);
  assert.equal(buildCommissionPaymentRequestAccess({
    request: paymentRequest,
    viewer: superAdmin,
    context: COMMISSION_PAYMENT_REQUEST_CONTEXT.ADMIN,
  }).canViewProof, true);
  assert.equal(buildCommissionPaymentRequestAccess({
    request: adaptCommissionPaymentRequest({
      id: 'pay2', supplierId: 'v1', status: 'PENDING', direction: 'VENDOR_TO_PLATFORM',
    }),
    viewer: vendor,
  }).canReview, false);
  assert.equal(buildCommissionPaymentRequestAccess({
    request: adaptCommissionPaymentRequest({
      id: 'pay3', supplierId: 'v1', status: 'PENDING', direction: 'PLATFORM_TO_VENDOR',
    }),
    viewer: vendor,
  }).canReview, true);

  const notification = adaptNotification({ id: 'n1', userId: 'u1', read: false });
  assert.equal(buildNotificationAccess({ notification, viewer: user }).canRead, true);
  assert.equal(buildNotificationAccess({ notification, viewer: vendorAdmin }).canRead, false);
  assert.equal(buildNotificationAccess({ notification, viewer: superAdmin, context: 'SYSTEM' }).canRead, false);
});
