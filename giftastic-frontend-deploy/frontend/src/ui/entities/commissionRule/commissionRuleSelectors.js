import { formatCommissionDate, formatCommissionRate } from '../commission/commissionSelectors.js';

export const formatCommissionRuleDate = formatCommissionDate;
export const formatCommissionRuleRate = formatCommissionRate;

export const getCommissionRuleScopeLabel = (rule) => {
  if (rule?.type === 'GLOBAL') return 'Global Rule';
  if (rule?.supplierName) return `Vendor: ${rule.supplierName}`;
  if (rule?.supplierId) return `Vendor: ${rule.supplierId}`;
  return 'Vendor-specific Rule';
};

export const getCommissionRuleState = (rule) => rule?.active
  ? { label: 'Active', className: 'bg-green-100 text-green-800' }
  : { label: 'Inactive', className: 'bg-gray-100 text-gray-800' };
