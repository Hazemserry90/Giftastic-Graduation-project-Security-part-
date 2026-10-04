import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { getGiftFlowExecutionSteps, parseGiftFlowRouteId } from '../../../utils/giftFlowExecution.js';

const source = (path) => fs.readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

test('Gift Flow execution keeps note and product customization steps', () => {
  const steps = [
    { id: 'question', type: 'note' },
    { id: 'products', type: 'multiple', products: [{ productId: 'p1' }] },
  ];

  assert.deepEqual(getGiftFlowExecutionSteps({ steps }), steps);
  assert.deepEqual(getGiftFlowExecutionSteps(null), []);
});

test('Gift Flow execution imports the canonical money formatter', () => {
  const execution = source('pages/GiftFlowStep.jsx');

  assert.match(execution, /formatProductMoney,/);
  assert.match(execution, /from '\.\.\/ui\/entities\/product'/);
  assert.match(execution, /formatProductMoney\(totalPrice\)/);
});

test('Gift Flow modal uses a stable default product list', () => {
  const controller = source('components/controllers/GiftFlowModalController.jsx');

  assert.match(controller, /const EMPTY_PRODUCTS = Object\.freeze\(\[\]\)/);
  assert.match(controller, /products = EMPTY_PRODUCTS/);
  assert.doesNotMatch(controller, /products = \[\]/);
});

test('Gift Flow route IDs accept backend UUIDs and reject malformed paths', () => {
  const id = '123e4567-e89b-42d3-a456-426614174000';
  assert.equal(parseGiftFlowRouteId(id), id);
  assert.equal(parseGiftFlowRouteId(`%20${id}%20`), id);
  assert.equal(parseGiftFlowRouteId('undefined'), null);
  assert.equal(parseGiftFlowRouteId('../vendor/flows'), null);
});

test('vendor product editing uses canonical category IDs and applies the successful response', () => {
  const editProduct = source('pages/EditProduct.jsx');
  assert.match(editProduct, /option key=\{cat\.id\} value=\{cat\.id\}/);
  assert.match(editProduct, /const updatedResponse = await productService\.updateProduct/);
  assert.match(editProduct, /stockQuantity: updatedProduct\.stockQuantity/);
  assert.match(editProduct, /updatedProduct\.stockQuantity !== requestedStockQuantity/);
  assert.match(editProduct, /STOCK_NOT_PERSISTED/);
  assert.doesNotMatch(editProduct, /cat\.categoryId/);
});

test('vendor Gift Flow screens do not render serialized JSON', () => {
  const editor = source('pages/VendorGiftFlows.jsx');
  const configuration = source('ui/entities/giftFlow/sections/GiftFlowConfigurationSection.jsx');

  assert.doesNotMatch(editor, /Persisted JSON Preview/);
  assert.doesNotMatch(configuration, /<pre|flow\?\.configuration/);
  assert.match(configuration, /Customization steps/);
});

test('vendor product rows use the bounded compact image presentation', () => {
  const row = source('ui/entities/product/ProductInventoryRow.jsx');
  const summary = source('ui/entities/product/ProductSummary.jsx');

  assert.match(row, /<ProductSummary product=\{product\} access=\{access\} compact/);
  assert.match(summary, /h-16 w-20/);
  assert.match(summary, /object-contain/);
});

test('public Vendor hero clips the banner and layers identity content above it', () => {
  const hero = source('ui/entities/vendor/sections/VendorHeroSection.jsx');

  assert.match(hero, /isolate h-40 overflow-hidden/);
  assert.match(hero, /absolute inset-0 block h-full w-full object-cover object-center/);
  assert.match(hero, /relative z-10 px-5 pb-6/);
  assert.match(hero, /relative z-20 h-24 w-24/);
  assert.match(hero, /sm:h-48 md:h-56 lg:h-64/);
});

test('Super Admin Vendors reads and reviews pending vendor applications', () => {
  const dashboard = source('pages/AdminDashboard.jsx');

  assert.match(dashboard, /vendorApplicationService\.getPendingApplications\(\)/);
  assert.match(dashboard, /adaptVendorApplicationResponse/);
  assert.match(dashboard, /vendorApplicationService\.reviewApplication/);
  assert.match(dashboard, /<VendorApplicationModal/);
  assert.doesNotMatch(dashboard, /adminService\.getPendingVendors\(\)/);
});

test('Super Admin vendor cards contain long text and media without widening the page', () => {
  const application = source('ui/entities/vendorApplication/VendorApplicationSummary.jsx');
  const managementCard = source('ui/entities/vendor/VendorManagementCard.jsx');
  const summary = source('ui/entities/vendor/VendorSummary.jsx');

  assert.match(application, /max-w-full whitespace-normal break-words[^\n]+\[overflow-wrap:anywhere\]/);
  assert.match(managementCard, /min-w-0 max-w-full flex-col/);
  assert.match(summary, /block h-full w-full max-w-full object-cover/);
  assert.match(summary, /max-w-full whitespace-normal break-words[^\n]+\[overflow-wrap:anywhere\]/);
});

test('Admin dashboard modals render a real close icon', () => {
  const dashboard = source('pages/AdminDashboard.jsx');

  assert.match(dashboard, /aria-label=\{`Close \$\{title\}`\}/);
  assert.match(dashboard, /material-symbols-outlined[^>]*aria-hidden="true">close/);
  assert.doesNotMatch(dashboard, /Ã-|âœ•/);
});
