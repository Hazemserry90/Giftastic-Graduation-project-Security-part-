import { createEntityModel } from '../shared/entityModel.js';

export const VENDOR_FEEDBACK_ENTITY_TYPE = 'vendorFeedback';
export const createVendorFeedbackModel = ({ source } = {}) => createEntityModel(VENDOR_FEEDBACK_ENTITY_TYPE, [
  'id', 'userId', 'vendorId', 'orderId', 'feedback', 'status', 'createdAt',
  'reviewedAt', 'reviewedBy', 'moderatorNotes', 'contentScore',
], source);
