import { hasEntityIdentity } from '../shared/entityModel.js';

export function buildVendorDeliveryPricingActions({ pricing, access, handlers = {} }) {
  if (!access.canManage || !hasEntityIdentity(pricing) || typeof handlers.update !== 'function') return [];
  return [{ key: 'update', label: 'Update price', onSelect: handlers.update }];
}

export function buildVendorDeliveryPricingCollectionActions({
  pricings = [],
  accessFor,
  handlers = {},
}) {
  if (
    pricings.length === 0
    || typeof accessFor !== 'function'
    || !pricings.every((pricing) =>
      hasEntityIdentity(pricing) && accessFor(pricing)?.canManage)
    || typeof handlers.updateAll !== 'function'
  ) return [];
  return [{ key: 'updateAll', label: 'Save all prices', onSelect: handlers.updateAll }];
}
