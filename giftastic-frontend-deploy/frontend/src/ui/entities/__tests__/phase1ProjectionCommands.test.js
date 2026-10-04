import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROJECTION_SCHEMAS, adaptAuthenticationProjection, adaptFinancialAnalyticsProjection,
  adaptPlatformAnalyticsProjection, adaptProductSearchProjection, adaptRecommendationsProjection,
  adaptUnifiedSearchProjection, adaptVendorAnalyticsProjection,
} from '../../projections/index.js';
import { COMMAND_SCHEMAS, commandDraftToPayload, createCommandDraft, mapCartToOrderDraft, validateCommandDraft } from '../../commands/index.js';

test('all seven backend projections preserve metrics and canonicalize entity references', () => {
  assert.equal(Object.keys(PROJECTION_SCHEMAS).length, 7);
  const unified = adaptUnifiedSearchProjection({ products: [{ id: 'p1', name: 'Gift', price: '10' }], vendors: [{ id: 'v1', storeName: 'Store' }], giftFlows: [{ id: 'f1', name: 'Flow' }], totalResults: 3 });
  assert.equal(unified.data.products[0].entityType, 'product');
  assert.equal(unified.data.vendors[0].entityType, 'vendor');
  assert.equal(unified.data.giftFlows[0].entityType, 'giftFlow');
  const search = adaptProductSearchProjection({ content: [{ id: 'p1', originalPrice: '12.50' }], totalElements: 1, totalPages: 1, number: 0, size: 20 });
  assert.equal(search.data.products[0].price, '12.50');
  const recommendations = adaptRecommendationsProjection({ products: [{ id: 'p1' }], engine: 'heuristic', strategy: 'trending', count: 1 });
  assert.equal(recommendations.data.products[0].entityType, 'product');
  const platform = adaptPlatformAnalyticsProjection({ topProducts: [{ productId: 'p1', productName: 'Gift', totalSales: 2, totalRevenue: '25.00' }], topCustomers: [], topVendors: [] });
  assert.equal(platform.data.topProducts[0].totalRevenue, '25.00');
  const vendor = adaptVendorAnalyticsProjection({ supplierId: 'v1', storeName: 'Store', overview: { totalRevenue: '50.00' }, topProducts: [], revenueHistory: [], orderBreakdown: [] });
  assert.equal(vendor.data.vendor.entityType, 'vendor');
  const financial = adaptFinancialAnalyticsProjection({ totalItemSubtotal: '100.00', byVendor: [{ supplierId: 'v1', totalEarnings: '90.00', commissionsPaid: '5', commissionsOwed: '5' }], byMonth: [] });
  assert.equal(financial.data.totals.totalItemSubtotal, '100.00');
  assert.equal(financial.data.byVendor[0].entity.entityType, 'vendor');
});

test('authentication projection creates one additive viewer without exposing the token', () => {
  const projection = adaptAuthenticationProjection({ token: 'secret-token', user: { id: 'u1', supplierId: 'v1', roles: ['ROLE_VENDOR', 'VIEW_ORDERS'] } });
  assert.equal(projection.data.viewer.userId, 'u1');
  assert.equal(projection.data.viewer.isVendor, true);
  assert.equal(projection.data.viewer.permissions.includes('VIEW_ORDERS'), true);
  assert.equal(projection.data.hasToken, true);
  assert.equal(JSON.stringify(projection).includes('secret-token'), false);
});

const validDrafts = {
  productCreateEdit: { supplierId: 'v1', name: 'Gift', price: '10.50', stockQuantity: 2, categoryIds: ['c1'], description: 'Desc', details: { allowsEmbroidery: true, allowsGiftWrap: true }, images: [{ url: 'https://example.test/gift.jpg', primary: true, displayOrder: 0 }] },
  vendorProfile: { storeName: 'Store' },
  vendorApplication: { storeName: 'Store' },
  giftFlowEditor: { name: 'Flow', configuration: '{"steps":[]}' },
  checkout: { customerId: 'u1', items: [{ productId: 'p1', quantity: 1 }], paymentMethod: 'CASH', deliveryZoneId: 'z1' },
  commissionProof: { proofImageUrl: 'https://example.test/proof.jpg', message: 'Paid' },
  commissionRule: { type: 'GLOBAL', rate: '0.10', startDate: '2026-06-20T12:00:00Z' },
  reportSubmission: { reportType: 'PRODUCT', reportedEntityId: 'p1', reason: 'Misleading' },
  reviewSubmission: { reviewType: 'PRODUCT', entityId: 'p1', rating: '5', comment: 'Great', isAnonymous: false },
  feedbackSubmission: { vendorId: 'v1', orderId: 'o1', feedback: 'Helpful' },
  reminder: { description: 'Birthday', scheduledAt: '2026-07-01T12:00:00' },
  reviewRestriction: { canComment: false, canReview: false, reason: 'Abuse', expiresAt: '2026-07-01T12:00:00' },
  productDiscount: { discountPercentage: '10', startDate: '', endDate: '' },
  deliveryEstimate: { estimatedDeliveryDate: '2026-07-01T12:00:00', notes: '' },
  deliveryDelay: { reason: 'Weather', newEstimatedDate: '2026-07-02T12:00:00' },
  userProfile: { fullName: 'Omar', phoneNumber: '+20123456789', birthday: '2000-01-01' },
  userAddresses: { addresses: [{ street: '1 Main St', city: 'Alexandria' }] },
  adminRequestSubmission: { message: 'I would like to request administrative access for community support duties.' },
  categoryCreate: { categoryName: 'Flowers' },
  notificationComposition: { target: 'ALL_USERS', targetId: '', title: 'Hello', message: 'A system update is available.' },
  moderationDecision: { decision: 'REJECT', notes: 'Does not meet policy requirements.', reason: '' },
  giftFlowCartSelection: { flowId: 'f1', flowName: 'Flow', selectedItems: [{ productId: 'p1', count: 1 }], notes: '', selections: {}, selectedAt: '2026-07-01T12:00:00', groupId: 'g1' },
  assistanceMessage: { mode: 'REPLY', message: 'We can help.', resolved: '' },
};

test('all command domains validate and map only backend-supported payload fields', () => {
  assert.equal(Object.keys(COMMAND_SCHEMAS).length, 23);
  for (const [name, values] of Object.entries(validDrafts)) {
    const draft = createCommandDraft(name, { ...values, ignored: 'never' });
    assert.equal(validateCommandDraft(name, draft).valid, true, name);
    const result = commandDraftToPayload(name, draft);
    assert.equal(result.ok, true, name);
    assert.equal(Object.hasOwn(result.payload, 'ignored'), false, name);
  }
  const product = commandDraftToPayload('productCreateEdit', createCommandDraft('productCreateEdit', validDrafts.productCreateEdit));
  assert.equal(Object.hasOwn(product.payload.details, 'allowsEmbroidery'), false);
  assert.equal(product.payload.details.allowsGiftWrap, true);
});

test('command validation rejects invalid enum, JSON, URL, decimal and checkout identity combinations', () => {
  assert.equal(validateCommandDraft('giftFlowEditor', { name: 'Flow', configuration: '{bad' }).valid, false);
  assert.equal(validateCommandDraft('commissionRule', { type: 'WRONG', rate: 'x', startDate: 'today' }).valid, false);
  assert.equal(validateCommandDraft('commissionProof', { proofImageUrl: 'javascript:alert(1)' }).valid, false);
  assert.equal(validateCommandDraft('checkout', { customerId: 'u1', guestInfo: {}, items: [{}], paymentMethod: 'CASH', deliveryZoneId: 'z1' }).valid, false);
  assert.equal(validateCommandDraft('reviewSubmission', { reviewType: 'PRODUCT', entityId: 'p1', rating: '9', isAnonymous: false }).valid, false);
});

test('Cart-to-Order snapshot mapper preserves historical item values', () => {
  const draft = mapCartToOrderDraft({ customerId: 'u1', items: [{ productId: 'p1', productName: 'Captured', quantity: 2, price: '10.00', supplierId: 'v1' }] }, { paymentMethod: 'CASH', deliveryZoneId: 'z1', shippingAddress: 'Street' });
  assert.equal(draft.items[0].productName, 'Captured');
  assert.equal(draft.items[0].price, '10.00');
});
