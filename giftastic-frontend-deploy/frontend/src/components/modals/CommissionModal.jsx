import EntityDialog from './EntityDialog';
import { CommissionSemanticViews } from '../../ui/entities/commission';
import { CommissionPaymentRequestSemanticViews } from '../../ui/entities/commissionPaymentRequest';
import { CommissionRuleSemanticViews } from '../../ui/entities/commissionRule';

const DETAILS = {
  commission: CommissionSemanticViews.CommissionDetails,
  paymentRequest: CommissionPaymentRequestSemanticViews.CommissionPaymentRequestDetails,
  rule: CommissionRuleSemanticViews.CommissionRuleDetails,
};
const TITLES = {
  commission: 'Commission Details',
  paymentRequest: 'Payment Request Details',
  rule: 'Commission Rule Details',
};
const EYEBROWS = {
  commission: 'Commission',
  paymentRequest: 'Payment Request',
  rule: 'Commission Rule',
};

export default function CommissionModal({
  entity,
  access,
  actions = [],
  kind = 'commission',
  isOpen = true,
  onClose,
  actionLoading = false,
  children,
}) {
  if (!isOpen || !entity || !access?.canRead) return null;
  const Details = DETAILS[kind] || DETAILS.commission;
  return (
    <EntityDialog isOpen={isOpen} onClose={onClose} title={TITLES[kind] || TITLES.commission} eyebrow={EYEBROWS[kind] || EYEBROWS.commission} maxWidth="max-w-4xl">
      {children}
      <Details entity={entity} access={access} actions={actions} pendingKey={actionLoading ? actions[0]?.key : null} />
    </EntityDialog>
  );
}
