import { addDecimals, formatMoney, formatRatePercent } from '../shared/decimal.js';
import { formatEntityDateTime, getEntityDateTimestamp } from '../shared/date.js';

export function formatCommissionRate(rate) {
  return rate === null || rate === undefined ? null : formatRatePercent(rate);
}

export function formatCommissionMoney(value) {
  if (value === null || value === undefined) return null;
  return formatMoney(value);
}

export const formatCommissionDate = (value) => formatEntityDateTime(value);
export const getCommissionDaysUntilDue = (commission, now = Date.now()) => {
  if (!commission?.dueDate) return null;
  const dueAt = getEntityDateTimestamp(commission.dueDate, { dateOnly: true });
  return dueAt === null ? null : Math.ceil((dueAt - now) / 86400000);
};
export const getCommissionOrderLabel = (commission) =>
  commission?.orderId ? `#${String(commission.orderId).slice(0, 8)}` : null;
export const isCommissionOverdue = (commission) => commission?.overdue === true || commission?.status === 'OVERDUE';
export function sumCommissionAmounts(commissions = []) {
  let total = '0';
  for (const commission of commissions) {
    if (commission?.commissionAmount === null || commission?.commissionAmount === undefined) return null;
    total = addDecimals(total, commission.commissionAmount);
    if (total === null) return null;
  }
  return total;
}

export function groupInstapayPayoutsByVendor(payouts = []) {
  const groups = new Map();
  for (const payout of payouts) {
    const key = payout?.supplierId || 'unknown-vendor';
    const group = groups.get(key) || {
      supplierId: payout?.supplierId || null,
      supplierName: payout?.supplierName || 'Unknown Vendor',
      payouts: [],
      grossTotal: '0',
      commissionTotal: '0',
      netTotal: '0',
    };
    group.payouts.push(payout);
    group.grossTotal = addDecimals(group.grossTotal, payout?.orderSubtotal);
    group.commissionTotal = addDecimals(group.commissionTotal, payout?.commissionAmount);
    group.netTotal = addDecimals(group.netTotal, payout?.payableAmount);
    groups.set(key, group);
  }
  return [...groups.values()].sort((left, right) => (
    left.supplierName.localeCompare(right.supplierName)
  ));
}
export const inferCommissionKind = (entity, kind) => {
  if (kind) return kind;
  if (entity?.entityType === 'commissionPaymentRequest' || entity?.commissionId) return 'paymentRequest';
  if (entity?.entityType === 'commissionRule' || (entity?.type && entity?.rate !== undefined)) return 'rule';
  return 'commission';
};
