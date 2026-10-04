import { adaptEntity } from '../shared/entityModel.js';
import { createCommissionPaymentRequestModel } from './commissionPaymentRequestModel.js';

export function adaptCommissionPaymentRequest(input = {}, { source = 'commission-payment-request', complete = false } = {}) {
  if (
    input?.entityType === 'commissionPaymentRequest'
    && input?.meta?.loadedFields instanceof Set
  ) {
    return input;
  }
  const model = adaptEntity(input, createCommissionPaymentRequestModel({ source }), {
    id: ['id', 'requestId'],
    commissionId: ['commissionId'],
    orderId: ['orderId'],
    supplierId: ['supplierId', 'vendorId'],
    vendorUserId: ['vendorUserId'],
    supplierName: ['supplierName', 'vendorName', 'storeName'],
    customerId: ['customerId'],
    customerName: ['customerName'],
    customerEmail: ['customerEmail'],
    orderStatus: ['orderStatus'],
    paymentMethod: ['paymentMethod'],
    payableAmount: ['payableAmount'],
    direction: ['direction'],
    senderLabel: ['senderLabel'],
    receiverLabel: ['receiverLabel'],
    message: ['message'],
    proofImageUrl: ['proofImageUrl'],
    messages: ['messages'],
    status: ['status'],
    submittedAt: ['submittedAt'],
    reviewedAt: ['reviewedAt'],
    reviewedBy: ['reviewedBy'],
    rejectionReason: ['rejectionReason'],
  });
  model.meta.isPartial = !complete;
  return model;
}
