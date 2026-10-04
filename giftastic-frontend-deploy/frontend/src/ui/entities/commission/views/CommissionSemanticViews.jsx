import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const COMMISSION_VIEW_SECTIONS = [
  {
    "title": "Commission",
    "fields": [
      {
        "path": "commissionAmount",
        "label": "Amount",
        "format": "money"
      },
      {
        "path": "commissionRate",
        "label": "Rate",
        "format": "percent"
      },
      {
        "path": "orderSubtotal",
        "label": "Order subtotal",
        "format": "money"
      },
      {
        "path": "status"
      }
    ]
  },
  {
    "title": "Timeline",
    "fields": [
      {
        "path": "dueDate",
        "label": "Due",
        "format": "datetime"
      },
      {
        "path": "paidAt",
        "label": "Paid",
        "format": "datetime"
      },
      {
        "path": "createdAt",
        "label": "Created",
        "format": "datetime"
      },
      {
        "path": "orderPlacedAt",
        "label": "Order placed",
        "format": "datetime"
      },
      {
        "path": "completedAt",
        "label": "Vendor completed",
        "format": "datetime"
      },
      {
        "path": "overdue",
        "label": "Overdue",
        "format": "boolean"
      }
    ]
  },
  {
    "title": "References",
    "fields": [
      {
        "path": "orderId"
      },
      {
        "path": "supplierId"
      },
      {
        "path": "supplierName"
      }
    ]
  }
];

export function CommissionSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="id" subtitlePath="status" />;
}

export function CommissionCard(props) { return <div className="h-full"><CommissionSummary {...props} /></div>; }
export function CommissionRow(props) { return <div role="row"><CommissionSummary {...props} /></div>; }

export function CommissionDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={COMMISSION_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function CommissionWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <CommissionDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}
