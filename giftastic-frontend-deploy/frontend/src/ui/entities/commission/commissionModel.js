import { createEntityModel } from '../shared/entityModel.js';

export const COMMISSION_ENTITY_TYPE = 'commission';
export const createCommissionModel = ({ source } = {}) => createEntityModel(
  COMMISSION_ENTITY_TYPE,
  [
    'id', 'orderId', 'supplierId', 'supplierName', 'orderSubtotal',
    'commissionRate', 'commissionAmount', 'payableAmount', 'direction', 'status', 'dueDate', 'paidAt',
    'createdAt', 'orderPlacedAt', 'completedAt', 'overdue',
  ],
  source,
);
