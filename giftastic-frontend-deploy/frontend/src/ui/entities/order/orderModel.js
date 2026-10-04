import { createEntityModel } from '../shared/entityModel.js';

export const ORDER_ENTITY_TYPE = 'order';
export const createOrderModel = ({ source } = {}) => ({
  ...createEntityModel(ORDER_ENTITY_TYPE, [
    'id', 'customerId', 'guestInfo', 'status', 'items', 'totalAmount',
    'placedAt', 'shippingAddress', 'paymentMethod', 'customerName',
    'customerEmail', 'customerPhone', 'instapayPhoneNumber', 'instapayRefundPhoneNumber',
    'instapayRefundName', 'deliveryZoneId', 'deliveryCost',
    'deliveryCostBreakdown', 'estimatedDeliveryDate', 'actualDeliveryDate',
    'deliveryNotes', 'commissionPaid', 'commissionPaidAt',
    'instapayTransactionIds', 'instapayPaymentMessages', 'paymentMethodLockedAt', 'paymentConfirmedAt',
    'paymentConfirmedBy', 'paymentRejectionReason', 'vendorStatuses',
    'vendorCompletedAt', 'vendorFinancialReleaseAt', 'commissionRates',
    'vendorSubtotals', 'vendorCommissionAmounts', 'commissionRatesSnapshottedAt',
    'vendorInvalidatedAt', 'vendorInvalidatedBy', 'vendorInvalidationReasons',
    'vendorInvalidationDetails',
  ], source),
  items: [],
  guestInfo: null,
  parsedDeliveryCostBreakdown: null,
  instapayTransactionIds: [],
  instapayPaymentMessages: [],
  vendorStatuses: {},
  vendorCompletedAt: {},
  vendorFinancialReleaseAt: {},
  commissionRates: {},
  vendorSubtotals: {},
  vendorCommissionAmounts: {},
  vendorInvalidatedAt: {},
  vendorInvalidatedBy: {},
  vendorInvalidationReasons: {},
  vendorInvalidationDetails: {},
});
