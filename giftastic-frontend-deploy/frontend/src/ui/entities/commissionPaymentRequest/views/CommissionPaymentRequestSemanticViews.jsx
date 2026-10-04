import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';
import PaymentRequestSummary from '../CommissionPaymentRequestSummary';
import PaymentRequestConversation from '../PaymentRequestConversation';

export const COMMISSIONPAYMENTREQUEST_VIEW_SECTIONS = [
  {
    "title": "Request",
    "fields": [
      {
        "path": "message"
      },
      {
        "path": "proofImageUrl",
        "label": "Proof",
        "format": "url"
      },
      {
        "path": "status"
      }
    ]
  },
  {
    "title": "System",
    "fields": [
      {
        "path": "id"
      },
      {
        "path": "commissionId"
      },
      {
        "path": "supplierId"
      },
      {
        "path": "supplierName"
      },
      {
        "path": "reviewedBy"
      }
    ]
  }
];

export function CommissionPaymentRequestSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="id" subtitlePath="status" />;
}

export function CommissionPaymentRequestCard(props) { return <div className="h-full"><CommissionPaymentRequestSummary {...props} /></div>; }
export function CommissionPaymentRequestRow(props) { return <div role="row"><CommissionPaymentRequestSummary {...props} /></div>; }

export function CommissionPaymentRequestDetails({ entity, access, state, actions = [], pendingKey }) {
  if (state === 'loading') return <SemanticEntityDetails entity={entity} access={access} sections={COMMISSIONPAYMENTREQUEST_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
  if (!entity || state === 'empty') return <SemanticEntityDetails entity={entity} access={access} sections={COMMISSIONPAYMENTREQUEST_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
  return (
    <div className="grid gap-4">
      <PaymentRequestSummary request={entity} access={access} actionItems={actions} />
      <PaymentRequestConversation request={entity} />
      {pendingKey && <p className="text-sm text-stone-500">Working...</p>}
    </div>
  );
}

export function CommissionPaymentRequestWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <CommissionPaymentRequestDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}
