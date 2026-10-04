import { adaptEntity } from '../shared/entityModel.js';
import { createVendorFeedbackModel } from './vendorFeedbackModel.js';

export function adaptVendorFeedback(input = {}, { source = 'vendor-feedback', complete = false } = {}) {
  if (
    input?.entityType === 'vendorFeedback'
    && input?.meta?.loadedFields instanceof Set
  ) {
    return input;
  }
  const fields = ['id', 'userId', 'vendorId', 'orderId', 'feedback', 'status', 'createdAt',
    'reviewedAt', 'reviewedBy', 'moderatorNotes', 'contentScore'];
  const model = adaptEntity(input, createVendorFeedbackModel({ source }),
    Object.fromEntries(fields.map((field) => [field, [field]])));
  model.meta.isPartial = !complete;
  return model;
}
