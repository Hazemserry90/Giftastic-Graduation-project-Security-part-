import { adaptEntity, ENTITY_FIELD_STATE, getEntityFieldState, setDerivedEntityValue } from '../shared/entityModel.js';
import { createCommissionModel } from './commissionModel.js';
import { validateCanonicalModel } from '../shared/modelValidation.js';
import { getEntityDateTimestamp } from '../shared/date.js';

export function adaptCommission(input = {}, { source = 'commission', complete = false } = {}) {
  if (
    input?.entityType === 'commission'
    && input?.meta?.loadedFields instanceof Set
  ) {
    return input;
  }
  const model = adaptEntity(input, createCommissionModel({ source }), {
    id: ['id', 'commissionId'],
    orderId: ['orderId'],
    supplierId: ['supplierId', 'vendorId'],
    supplierName: ['supplierName', 'vendorName', 'storeName'],
    orderSubtotal: ['orderSubtotal'],
    commissionRate: ['commissionRate', 'rate'],
    commissionAmount: ['commissionAmount', 'amount'],
    payableAmount: ['payableAmount'],
    direction: ['direction'],
    status: ['status'],
    dueDate: ['dueDate'],
    paidAt: ['paidAt'],
    createdAt: ['createdAt'],
    orderPlacedAt: ['orderPlacedAt', 'orderDate'],
    completedAt: ['completedAt', 'vendorCompletedAt'],
    overdue: ['overdue', 'isOverdue'],
  });
  validateCanonicalModel(model);
  if (
    !model.meta.loadedFields.has('overdue')
    && getEntityFieldState(model, 'dueDate') === ENTITY_FIELD_STATE.AVAILABLE
    && getEntityFieldState(model, 'status') === ENTITY_FIELD_STATE.AVAILABLE
    && ['PENDING', 'OVERDUE'].includes(model.status)
  ) {
    setDerivedEntityValue(model, 'overdue', getEntityDateTimestamp(model.dueDate, { dateOnly: true }) < Date.now());
  }
  model.meta.isPartial = !complete;
  return model;
}
