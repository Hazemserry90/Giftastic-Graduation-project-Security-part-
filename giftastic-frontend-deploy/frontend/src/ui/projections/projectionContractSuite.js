import test from 'node:test';
import assert from 'node:assert/strict';
import { PROJECTION_SCHEMAS, adaptProjection } from './index.js';

const fixtures = Object.freeze({
  unifiedSearch: { products: [{ productId: 'p1', productName: 'Gift' }], vendors: [{ supplierId: 'v1', storeName: 'Store' }], giftFlows: [{ id: 'f1', name: 'Flow' }], totalResults: 3 },
  productSearch: { content: [{ id: 'p1', originalPrice: '10.00', currentPrice: '8.00', stockQuantity: 2 }], totalElements: 1, totalPages: 1, number: 0, size: 20 },
  recommendations: { products: [{ id: 'p1', name: 'Gift' }], engine: 'heuristic', strategy: 'trending', count: 1 },
  platformAnalytics: { topProducts: [{ productId: 'p1', productName: 'Gift', totalRevenue: '10.00', totalSales: 1 }], topCustomers: [], topVendors: [] },
  vendorAnalytics: { supplierId: 'v1', storeName: 'Store', overview: { totalRevenue: '10.00' }, topProducts: [], revenueHistory: [], orderBreakdown: [] },
  financialAnalytics: {
    totalItemSubtotal: '10.00', totalDeliveryCost: '1.00', totalCustomerPayments: '11.00',
    totalVendorEarnings: '9.00', totalCommissionsOwed: '1.00', totalCommissionsPaid: '0.00',
    totalPlatformRevenue: '1.00', codOrderValue: '6.00', instapayOrderValue: '5.00',
    pendingVendorPayments: '1.00', submittedVendorPayments: '0.00', completedVendorPayments: '0.00',
    pendingVendorPayouts: '0.00', submittedVendorPayouts: '0.00', completedVendorPayouts: '0.00',
    invalidOrFailedPayments: '0.00', codOrderCount: 1, instapayOrderCount: 1, invalidOrFailedOrderCount: 0,
    byVendor: [], byMonth: [], invalidVendorPortions: [],
  },
  authentication: { token: 'not-serialized', user: { id: 'u1', supplierId: 'v1', roles: ['ROLE_USER', 'ROLE_VENDOR', 'VIEW_ORDERS'] } },
});

export function registerProjectionContract(name) {
  test(`${name}: schema, adapter, selectors, and canonical references remain centralized`, async () => {
    const schema = PROJECTION_SCHEMAS[name];
    assert.ok(schema);
    assert.ok(schema.fields.length > 0);
    const projection = adaptProjection(name, fixtures[name]);
    assert.equal(projection.projectionType, name);
    assert.equal(projection.schemaVersion, 1);
    assert.ok(Array.isArray(projection.meta.issues));
    const pascal = name[0].toUpperCase() + name.slice(1);
    const selectorModule = await import(new URL(`./${name}/${pascal}Selectors.js`, import.meta.url));
    const selector = Object.values(selectorModule).find((value) => typeof value === 'function');
    assert.equal(selector(projection), projection.data);
    assert.equal(JSON.stringify(projection).includes('not-serialized'), false);
  });
}
