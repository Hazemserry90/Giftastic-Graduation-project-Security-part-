import { createEntityModel } from '../shared/entityModel.js';

export const VENDOR_DELIVERY_PRICING_ENTITY_TYPE = 'vendorDeliveryPricing';
export const createVendorDeliveryPricingModel = ({ source } = {}) =>
  createEntityModel(VENDOR_DELIVERY_PRICING_ENTITY_TYPE, [
    'vendorId', 'zoneId', 'zoneName', 'deliveryCost', 'updatedAt',
  ], source);
