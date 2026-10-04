import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMAND_SCHEMAS, commandDraftToPayload, createCommandDraft, validateCommandDraft } from './index.js';

const valid = Object.freeze({
  productCreateEdit: { supplierId: 'v1', name: 'Gift', price: '10.50', stockQuantity: 1, categoryIds: ['c1'], description: 'Description', details: {}, images: [] },
  vendorProfile: { storeName: 'Store' },
  vendorApplication: { storeName: 'Store' },
  giftFlowEditor: { name: 'Flow', configuration: '{"steps":[]}' },
  checkout: { customerId: 'u1', items: [{ productId: 'p1', quantity: 1 }], paymentMethod: 'CASH', deliveryZoneId: 'z1' },
  commissionProof: { proofImageUrl: 'https://example.test/proof.jpg' },
  commissionRule: { type: 'GLOBAL', rate: '0.10', startDate: '2026-06-20T12:00:00Z' },
  reportSubmission: { reportType: 'PRODUCT', reportedEntityId: 'p1', reason: 'OTHER' },
  reviewSubmission: { reviewType: 'PRODUCT', entityId: 'p1', rating: '5', isAnonymous: false },
  feedbackSubmission: { vendorId: 'v1', orderId: 'o1', feedback: 'Helpful' },
  reminder: { description: 'Birthday', scheduledAt: '2026-07-01T12:00:00' },
  reviewRestriction: { canComment: false, canReview: false, reason: 'Abuse', expiresAt: '2026-07-01T12:00:00' },
  productDiscount: { discountPercentage: '10', startDate: '', endDate: '' },
  deliveryEstimate: { estimatedDeliveryDate: '2026-07-01T12:00:00', notes: '' },
  deliveryDelay: { reason: 'Weather', newEstimatedDate: '2026-07-02T12:00:00' },
});

export function registerCommandContract(name) {
  test(`${name}: draft, validation, and payload mapping are centralized and bounded`, () => {
    const schema = COMMAND_SCHEMAS[name];
    assert.ok(schema);
    assert.ok(schema.endpoint);
    const draft = createCommandDraft(name, { ...valid[name], phase1UnknownField: 'ignored' });
    assert.deepEqual(Object.keys(draft).sort(), [...schema.fields].sort());
    assert.equal(validateCommandDraft(name, draft).valid, true);
    const mapped = commandDraftToPayload(name, draft);
    assert.equal(mapped.ok, true);
    assert.equal(Object.hasOwn(mapped.payload, 'phase1UnknownField'), false);
    Object.keys(mapped.payload).forEach((field) => assert.equal(schema.fields.includes(field), true));
  });
}
