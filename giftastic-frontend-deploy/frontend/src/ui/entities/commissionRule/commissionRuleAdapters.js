import { adaptEntity } from '../shared/entityModel.js';
import { createCommissionRuleModel } from './commissionRuleModel.js';

export function adaptCommissionRule(input = {}, { source = 'commission-rule', complete = false } = {}) {
  if (
    input?.entityType === 'commissionRule'
    && input?.meta?.loadedFields instanceof Set
  ) {
    return input;
  }
  const fields = ['id', 'type', 'supplierId', 'supplierName', 'rate', 'startDate', 'endDate', 'active', 'createdAt', 'createdBy'];
  const model = adaptEntity(
    input,
    createCommissionRuleModel({ source }),
    Object.fromEntries(fields.map((field) => [field, [field]])),
  );
  model.meta.isPartial = !complete;
  return model;
}
