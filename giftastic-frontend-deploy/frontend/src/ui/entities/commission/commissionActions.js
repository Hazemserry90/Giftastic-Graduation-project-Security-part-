import { hasEntityIdentity, hasLoadedEntityField } from '../shared/entityModel.js';

export function buildCommissionActions({ commission, access, handlers = {} }) {
  if (!hasEntityIdentity(commission) || !hasLoadedEntityField(commission, 'status')) return [];
  if (!['PENDING', 'OVERDUE'].includes(commission.status)) return [];
  const isPlatformPayout = commission.direction === 'PLATFORM_TO_VENDOR';
  return [
    access.canSubmitPayment && typeof handlers.submitPayment === 'function' && {
      key: 'submitPayment',
      label: isPlatformPayout ? 'Send payout details' : 'Submit payment proof',
      onSelect: handlers.submitPayment,
    },
    access.canUrgePayment && typeof handlers.urge === 'function' && {
      key: 'urge',
      label: 'Send payment reminder',
      onSelect: handlers.urge,
    },
  ].filter(Boolean);
}
