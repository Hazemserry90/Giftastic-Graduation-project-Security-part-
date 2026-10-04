import commissionService from '../../services/commissionService.js';
import { adaptEntityFromNamedSource } from '../entities/namedAdapters.js';
import { adaptFinancialAnalyticsProjection } from '../projections/index.js';
import { selectFinancialAnalyticsView } from '../projections/financialAnalytics/FinancialAnalyticsSelectors.js';

export async function loadFinancialSection(section) {
  if (section === 'unpaid') return (await commissionService.getUnpaidCommissions() || [])
    .map((record) => adaptEntityFromNamedSource('adaptCommissionDto', record));
  if (section === 'instapay') return (await commissionService.getInstapayPayouts() || [])
    .map((record) => adaptEntityFromNamedSource('adaptCommissionDto', record));
  if (section === 'instapayRequests') return (await commissionService.getVendorPayoutRequests() || [])
    .map((record) => adaptEntityFromNamedSource('adaptCommissionPaymentRequestDto', record));
  if (section === 'requests') return (await commissionService.getPendingPaymentRequests() || [])
    .map((record) => adaptEntityFromNamedSource('adaptCommissionPaymentRequestDto', record));
  if (section === 'rules') return (await commissionService.getCommissionRules() || [])
    .map((record) => adaptEntityFromNamedSource('adaptCommissionRuleDto', record));
  if (section === 'analytics') return selectFinancialAnalyticsView(
    adaptFinancialAnalyticsProjection(await commissionService.getFinancialAnalytics()),
  );
  return null;
}

export function executeFinancialAction(action, entityId, payload = {}) {
  if (action === 'urge') return commissionService.urgePayment(entityId);
  if (action === 'approve') return commissionService.approvePaymentRequest(entityId);
  if (action === 'reject') return commissionService.rejectPaymentRequest(entityId, payload.reason);
  if (action === 'deactivate') return commissionService.deactivateRule(entityId);
  if (action === 'createRule') return commissionService.createCommissionRule(payload);
  if (action === 'submitVendorPayout') return commissionService.submitVendorPayout(entityId, payload);
  throw new TypeError(`Unknown financial action: ${action}`);
}
