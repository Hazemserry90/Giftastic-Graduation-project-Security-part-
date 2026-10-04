import { adaptEntity } from '../shared/entityModel.js';
import { createVendorDeliveryPricingModel } from './vendorDeliveryPricingModel.js';

export function adaptVendorDeliveryPricing(input = {}, { source = 'vendor-delivery-pricing', complete = false } = {}) {
  if (
    input?.entityType === 'vendorDeliveryPricing'
    && input?.meta?.loadedFields instanceof Set
  ) {
    return input;
  }
  const model = adaptEntity(input, createVendorDeliveryPricingModel({ source }), {
    vendorId: ['vendorId', 'supplierId'], zoneId: ['zoneId'], zoneName: ['zoneName'],
    deliveryCost: ['deliveryCost', 'cost'], updatedAt: ['updatedAt'],
  });
  model.meta.isPartial = !complete;
  return model;
}
