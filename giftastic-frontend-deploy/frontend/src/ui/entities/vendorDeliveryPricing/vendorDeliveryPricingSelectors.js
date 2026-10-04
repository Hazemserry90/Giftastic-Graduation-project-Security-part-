import { formatMoney } from '../shared/decimal.js';
import { formatEntityDateTime } from '../shared/date.js';

export const formatDeliveryCost = (value) => {
  if (value === null || value === undefined || value === '') return null;
  return formatMoney(value);
};

export const hasDeliveryPrice = (pricing, zoneId) =>
  Object.prototype.hasOwnProperty.call(pricing || {}, zoneId)
  && pricing[zoneId] !== '';

export function formatVendorDeliveryPricingDate(value) {
  return formatEntityDateTime(value);
}
