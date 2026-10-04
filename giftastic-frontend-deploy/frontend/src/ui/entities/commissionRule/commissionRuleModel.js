import { createEntityModel } from '../shared/entityModel.js';

export const COMMISSION_RULE_ENTITY_TYPE = 'commissionRule';
export const createCommissionRuleModel = ({ source } = {}) => createEntityModel(
  COMMISSION_RULE_ENTITY_TYPE,
  ['id', 'type', 'supplierId', 'supplierName', 'rate', 'startDate', 'endDate', 'active', 'createdAt', 'createdBy'],
  source,
);
