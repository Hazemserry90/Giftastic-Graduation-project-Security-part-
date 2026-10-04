import { adaptEntity, consumeEntitySourceField, createEntityReference, markDerivedFieldInvalid, markEntityFieldInvalid, safeParseJson, setDerivedEntityValue, setEntityValue } from '../shared/entityModel.js';
import { createOrderModel } from './orderModel.js';
import { adaptEmbeddedValue, applyEmbeddedResult } from '../shared/embeddedAdapters.js';
import { adaptProduct } from '../product/productAdapters.js';
import { adaptVendor } from '../vendor/vendorAdapters.js';

export function adaptOrder(input = {}, { source = 'order', complete = false } = {}) {
  if (input?.entityType === 'order' && input?.meta?.loadedFields instanceof Set) return input;
  const fields = [
    'id', 'customerId', 'guestInfo', 'status', 'totalAmount', 'placedAt',
    'shippingAddress', 'paymentMethod', 'customerName', 'customerEmail',
    'customerPhone', 'instapayPhoneNumber', 'instapayRefundPhoneNumber', 'instapayRefundName',
    'deliveryZoneId', 'deliveryCost',
    'deliveryCostBreakdown', 'estimatedDeliveryDate', 'actualDeliveryDate',
    'deliveryNotes', 'commissionPaid', 'commissionPaidAt',
    'instapayTransactionIds', 'instapayPaymentMessages', 'paymentMethodLockedAt', 'paymentConfirmedAt',
    'paymentConfirmedBy', 'paymentRejectionReason', 'vendorStatuses',
    'vendorCompletedAt', 'vendorFinancialReleaseAt', 'commissionRates',
    'vendorSubtotals', 'vendorCommissionAmounts', 'commissionRatesSnapshottedAt',
    'vendorInvalidatedAt', 'vendorInvalidatedBy', 'vendorInvalidationReasons',
    'vendorInvalidationDetails',
  ];
  const model = adaptEntity(
    input,
    createOrderModel({ source }),
    Object.fromEntries(fields.map((field) => [field, [field]])),
  );
  if (Object.hasOwn(input, 'guestInfo')) {
    if (input.guestInfo == null) setEntityValue(model, 'guestInfo', null);
    else {
      const result = adaptEmbeddedValue('guestInfo', input.guestInfo, { path: 'guestInfo' });
      setEntityValue(model, 'guestInfo', applyEmbeddedResult(model, 'guestInfo', result));
    }
  }
  if (Object.hasOwn(input, 'items')) {
    consumeEntitySourceField(model, 'items');
    if (!Array.isArray(input.items)) markEntityFieldInvalid(model, 'items', input.items, 'Expected Order Item array');
    else setEntityValue(model, 'items', input.items.map((item, index) => {
      const root = `items.${index}`;
      const result = adaptEmbeddedValue('orderItem', item, { path: root });
      const normalized = applyEmbeddedResult(model, root, result);
      const productSnapshot = adaptProduct(item, { source: 'order-item-product-snapshot', complete: false });
      normalized.product = createEntityReference('product', normalized.productId, productSnapshot);
      normalized.vendor = createEntityReference('vendor', normalized.supplierId, adaptVendor({ supplierId: normalized.supplierId }, { source: 'order-item-vendor-snapshot', complete: false }));
      if (result.loadedFields.has('metadata')) {
        const metadata = safeParseJson(normalized.metadata);
        normalized.parsedMetadata = metadata.value;
        model.meta.derivedFields.add(`${root}.parsedMetadata`);
        if (!metadata.ok) markDerivedFieldInvalid(model, `${root}.parsedMetadata`, normalized.metadata, metadata.reason);
      }
      return normalized;
    }));
  }
  if (model.meta.loadedFields.has('deliveryCostBreakdown')) {
    const result = safeParseJson(model.deliveryCostBreakdown);
    if (result.ok) setDerivedEntityValue(model, 'parsedDeliveryCostBreakdown', result.value);
    else markDerivedFieldInvalid(model, 'parsedDeliveryCostBreakdown', model.deliveryCostBreakdown, result.reason);
  }
  model.meta.isPartial = !complete;
  return model;
}
