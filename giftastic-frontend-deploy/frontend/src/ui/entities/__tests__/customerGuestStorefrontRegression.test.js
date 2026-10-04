import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const frontend = (path) => fs.readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');
const backend = (path) => fs.readFileSync(new URL(`../../../../../src/main/java/com/giftastic/giftastic/${path}`, import.meta.url), 'utf8');

test('guest favorites use local storage, are public in routes, and sync after auth', () => {
  const favoriteService = frontend('services/favoriteService.js');
  const app = frontend('App.jsx');
  const authStore = frontend('store/useAuthStore.js');
  const favoriteActions = frontend('ui/entities/favorite/favoriteActions.js');
  const favoriteAccess = frontend('ui/entities/favorite/favoriteAccess.js');

  assert.match(favoriteService, /GUEST_FAVORITES_KEY/);
  assert.match(favoriteService, /if \(!hasToken\(\)\) return readGuestFavorites\(\)/);
  assert.match(favoriteService, /syncGuestFavorites/);
  assert.doesNotMatch(app, /<ProtectedRoute>\s*<Favorites \/>/);
  assert.match(authStore, /favoriteService\.syncGuestFavorites\(\)/);
  assert.doesNotMatch(favoriteActions, /viewer\?\.userId \|\|/);
  assert.match(favoriteAccess, /favorite\?\.userId === 'guest'/);
});

test('auth UI removes forgot password and product price range is dynamic', () => {
  const login = frontend('pages/Login.jsx');
  const catalog = frontend('pages/ProductCatalog.jsx');

  assert.doesNotMatch(login, /Forgot password|Forget password/i);
  assert.match(catalog, /priceRangeMax/);
  assert.match(catalog, /setPriceRangeMax/);
  assert.doesNotMatch(catalog, /max="5000"/);
});

test('guest checkout can use Instapay and redirects to contact-verified tracking', () => {
  const checkout = frontend('pages/Checkout.jsx');
  const orderService = frontend('services/orderService.js');
  const app = frontend('App.jsx');
  const guestTracking = frontend('pages/GuestOrderTracking.jsx');

  assert.doesNotMatch(checkout, /user && instapayPhone/);
  assert.match(checkout, /sessionStorage\.setItem\('giftastic_guest_order_tracking'/);
  assert.match(checkout, /navigate\(`\/guest-orders\/\$\{createdOrder\.id\}`\)/);
  assert.match(orderService, /trackGuestOrder/);
  assert.match(orderService, /submitGuestInstapayTransactions/);
  assert.match(app, /path="\/guest-orders\/:orderId"/);
  assert.match(guestTracking, /email/);
  assert.match(guestTracking, /phone/);
});

test('notification details and customer orders hide internal fields/vendor progress', () => {
  const notificationViews = frontend('ui/entities/notification/views/NotificationSemanticViews.jsx');
  const orderAccess = frontend('ui/entities/order/orderAccess.js');
  const orderModal = frontend('components/modals/OrderModal.jsx');

  assert.doesNotMatch(notificationViews, /"path": "id"/);
  assert.doesNotMatch(notificationViews, /"path": "userId"/);
  assert.doesNotMatch(notificationViews, /"path": "type"/);
  assert.doesNotMatch(notificationViews, /"path": "read"/);
  assert.match(orderAccess, /vendorProgress: context !== ORDER_CONTEXT\.CUSTOMER && canRead/);
  assert.match(orderModal, /access\.sections\.vendorProgress/);
});

test('backend supports secure guest tracking and descriptive stock errors', () => {
  const controller = backend('modules/order/controller/OrderController.java');
  const service = backend('modules/order/service/OrderServiceImpl.java');
  const security = backend('common/security/SecurityConfig.java');

  assert.match(controller, /guest-track\/\{orderId\}/);
  assert.match(controller, /submitGuestInstapayTransactions/);
  assert.match(security, /\/api\/v1\/orders\/guest-track\/\*\*/);
  assert.doesNotMatch(service, /Instapay checkout requires a registered customer/);
  assert.match(service, /getAuthorizedGuestOrder/);
  assert.match(service, /matchesGuestContact/);
  assert.match(service, /stockErrorMessage/);
  assert.match(service, /only has/);
  assert.match(service, /but you requested/);
});
