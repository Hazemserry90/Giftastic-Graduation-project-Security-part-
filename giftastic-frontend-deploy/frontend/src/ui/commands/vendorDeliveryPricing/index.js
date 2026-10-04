import { normalizeDecimal } from '../../entities/shared/entityModel.js';

export function mapVendorDeliveryPricingPayload(pricing = {}) {
  const payload = {};
  for (const [zoneId, value] of Object.entries(pricing)) {
    const normalized = normalizeDecimal(value);
    if (!normalized.ok || normalized.value === null || normalized.value.startsWith('-')) {
      return { ok: false, errors: { [zoneId]: 'Delivery price must be a non-negative decimal' } };
    }
    payload[zoneId] = normalized.value;
  }
  return { ok: true, payload };
}
