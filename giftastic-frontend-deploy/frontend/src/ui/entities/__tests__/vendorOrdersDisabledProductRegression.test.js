import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = (path) => fs.readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');
const backend = (path) => fs.readFileSync(new URL(`../../../../../src/main/java/com/giftastic/giftastic/${path}`, import.meta.url), 'utf8');

test('vendor orders keep estimate and delay controls out of the order view', () => {
  const vendorOrders = source('pages/VendorOrders.jsx');

  assert.doesNotMatch(vendorOrders, /DeliveryEstimateManager/);
  assert.doesNotMatch(vendorOrders, /updateEstimate/);
  assert.doesNotMatch(vendorOrders, /notifyDelay/);
});

test('vendor orders can be filtered by placed date', () => {
  const vendorOrders = source('pages/VendorOrders.jsx');

  assert.match(vendorOrders, /dateFilter/);
  assert.match(vendorOrders, /matchesDateFilter/);
  assert.match(vendorOrders, /filteredOrders/);
  assert.match(vendorOrders, /type="date"/);
});

test('vendor order details show payment method without Instapay refund internals', () => {
  const orderAccess = source('ui/entities/order/orderAccess.js');
  const paymentSection = source('ui/entities/order/sections/OrderPaymentSection.jsx');

  assert.match(orderAccess, /payment: isCustomer \|\| isGuestCustomerContext \|\| isParticipatingVendor/);
  assert.match(orderAccess, /paymentDetails: canViewPaymentDetails/);
  assert.match(paymentSection, /getPaymentMethodLabel/);
  assert.match(paymentSection, /access\?\.fields\?\.paymentDetails !== false/);
});

test('disabled vendor products can request review through the existing submit flow', () => {
  const dashboard = source('pages/VendorDashboard.jsx');
  const actions = source('ui/entities/product/productActions.js');
  const controller = backend('modules/product/controller/ProductController.java');
  const productService = backend('modules/product/service/ProductServiceImpl.java');
  const exceptionHandler = backend('common/exception/GlobalExceptionHandler.java');

  assert.match(dashboard, /handleRequestReview/);
  assert.match(dashboard, /productService\.submitForApproval\(product\.id, viewer\.supplierId, message\.trim\(\) \|\| null\)/);
  assert.match(dashboard, /status: 'PENDING_APPROVAL'/);
  assert.match(actions, /product\.status === 'DISABLED'/);
  assert.match(actions, /key: 'requestReview'/);
  assert.match(controller, /hasPermission\(#productId, 'PRODUCT_OWNER'\)/);
  assert.match(productService, /ProductStatus\.PENDING_APPROVAL/);
  assert.match(exceptionHandler, /handleIllegalState/);
});

test('vendor dashboard navigation remains accessible on mobile', () => {
  const sidebar = source('components/VendorSidebar.jsx');
  const dashboard = source('pages/VendorDashboard.jsx');
  const orders = source('pages/VendorOrders.jsx');

  assert.match(sidebar, /aria-label="Open vendor dashboard menu"/);
  assert.match(sidebar, /mobileOpen/);
  assert.match(sidebar, /md:hidden/);
  assert.match(sidebar, /Products/);
  assert.match(sidebar, /Orders/);
  assert.match(sidebar, /Commissions/);
  assert.match(dashboard, /flex min-w-0 flex-col md:flex-row/);
  assert.match(dashboard, /min-w-0 flex-1 p-4 sm:p-6 lg:p-12/);
  assert.match(orders, /overflow-x-auto/);

  [
    'pages/EditProduct.jsx',
    'pages/UploadProduct.jsx',
    'pages/VendorActivityDashboard.jsx',
    'pages/VendorAnalytics.jsx',
    'pages/VendorCommissions.jsx',
    'pages/VendorDeliveryPricing.jsx',
    'pages/VendorGiftFlows.jsx',
    'pages/VendorSettings.jsx',
  ].forEach((path) => {
    const page = source(path);
    assert.match(page, /<VendorSidebar \/>/);
    assert.match(page, /min-w-0 flex-1/);
  });
});

test('vendor order details include customer phone and delivery snapshot only for vendor order response', () => {
  const dto = backend('modules/order/dto/VendorOrderResponse.java');
  const service = backend('modules/order/service/OrderServiceImpl.java');
  const vendorOrders = source('pages/VendorOrders.jsx');
  const orderAdapter = source('ui/entities/order/orderAdapters.js');
  const userAccess = source('ui/entities/user/userAccess.js');
  const customerSection = source('ui/entities/order/sections/OrderCustomerSection.jsx');

  assert.match(dto, /String customerPhone/);
  assert.match(service, /resolveCustomerPhone/);
  assert.match(service, /VendorOrderResponse\.from\(order, supplierId, resolveCustomerPhone\(order\)\)/);
  assert.match(orderAdapter, /customerPhone/);
  assert.match(vendorOrders, /phoneNumber: order\.customerPhone \|\| order\.guestInfo\?\.phone/);
  assert.match(userAccess, /orderVendorRelationship/);
  assert.match(customerSection, /Phone:/);
});
