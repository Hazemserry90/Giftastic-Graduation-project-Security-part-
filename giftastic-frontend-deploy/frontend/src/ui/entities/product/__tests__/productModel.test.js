import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptDomainProduct,
  adaptProductSearchResult,
} from '../productAdapters.js';
import { buildProductAccess, PRODUCT_CONTEXT } from '../productAccess.js';
import { buildProductActions } from '../productActions.js';
import {
  getProductFieldState,
  hasLoadedProductField,
  PRODUCT_FIELD_STATE,
} from '../productModel.js';
import {
  getProductAvailability,
  isProductInStock,
  PRODUCT_STOCK_STATE,
} from '../productSelectors.js';

test('domain adapter follows Product and ProductDetails fields', () => {
  const product = adaptDomainProduct({
    id: 'p1', supplierId: 'v1', name: 'Gift', price: 100, stockQuantity: 0,
    status: 'DRAFT', details: { allowsGiftWrap: false, vendorSku: null },
  });
  assert.equal(product.id, 'p1');
  assert.equal(product.details.allowsGiftWrap, false);
  assert.equal(isProductInStock(product), false);
  assert.equal(getProductFieldState(product, 'details.vendorSku'), PRODUCT_FIELD_STATE.EMPTY);
});

test('search result remains partial and never invents stock', () => {
  const product = adaptProductSearchResult({ productId: 'p2', productName: 'Search Gift', currentPrice: 80 });
  assert.equal(product.id, 'p2');
  assert.equal(hasLoadedProductField(product, 'stockQuantity'), false);
  assert.equal(isProductInStock(product), null);
});

test('public context hides internal inventory, status, SEO, and system identifiers', () => {
  const product = adaptDomainProduct({
    id: 'p3', supplierId: 'v3', name: 'Public', status: 'APPROVED',
    stockQuantity: 4, details: { vendorSku: 'SECRET', slug: 'public' },
  });
  const access = buildProductAccess({ product, context: PRODUCT_CONTEXT.PUBLIC });
  assert.equal(access.sections.inventory, false);
  assert.equal(access.sections.vendorInfo, false);
  assert.equal(access.sections.system, false);
  assert.equal(getProductAvailability(product, access), PRODUCT_STOCK_STATE.UNAVAILABLE);
});

test('owner access requires the exact supplier identity', () => {
  const product = adaptDomainProduct({ id: 'p4', supplierId: 'v4', stockQuantity: 2, details: { vendorSku: 'SKU' } });
  const denied = buildProductAccess({
    product, viewer: { supplierId: 'other' }, context: PRODUCT_CONTEXT.OWNER_MANAGEMENT,
  });
  const allowed = buildProductAccess({
    product, viewer: { supplierId: 'v4' }, context: PRODUCT_CONTEXT.OWNER_MANAGEMENT,
  });
  assert.equal(denied.sections.inventory, false);
  assert.equal(allowed.sections.inventory, true);
});

test('moderation actions require exact permission, state, and supplied handler', () => {
  const product = adaptDomainProduct({ id: 'p5', status: 'PENDING_APPROVAL' });
  const access = buildProductAccess({
    product,
    viewer: { permissions: ['ACTIVATE_PRODUCTS'] },
    context: PRODUCT_CONTEXT.ADMIN_MODERATION,
  });
  assert.deepEqual(buildProductActions({
    product, access, handlers: { approve() {}, reject() {} },
  }).map((action) => action.key), ['approve']);
});

test('admin context cannot grant Product read access without permission', () => {
  const product = adaptDomainProduct({
    id: 'p6', name: 'Rejected', status: 'REJECTED',
  });
  const denied = buildProductAccess({
    product,
    viewer: null,
    context: PRODUCT_CONTEXT.ADMIN_MODERATION,
  });
  const allowed = buildProductAccess({
    product,
    viewer: { permissions: ['ACTIVATE_PRODUCTS'] },
    context: PRODUCT_CONTEXT.ADMIN_MODERATION,
  });
  assert.equal(denied.canRead, false);
  assert.equal(allowed.canRead, true);
});
