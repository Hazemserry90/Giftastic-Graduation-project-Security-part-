import { createEntityModel } from '../shared/entityModel.js';

export const COMMISSION_PAYMENT_REQUEST_ENTITY_TYPE = 'commissionPaymentRequest';
export const createCommissionPaymentRequestModel = ({ source } = {}) => createEntityModel(
  COMMISSION_PAYMENT_REQUEST_ENTITY_TYPE,
  [
    'id', 'commissionId', 'orderId', 'supplierId', 'vendorUserId', 'supplierName',
    'customerId', 'customerName', 'customerEmail', 'orderStatus', 'paymentMethod', 'payableAmount',
    'direction', 'senderLabel', 'receiverLabel', 'message', 'proofImageUrl', 'messages',
    'status', 'submittedAt', 'reviewedAt', 'reviewedBy',
    'rejectionReason',
  ],
  source,
);
