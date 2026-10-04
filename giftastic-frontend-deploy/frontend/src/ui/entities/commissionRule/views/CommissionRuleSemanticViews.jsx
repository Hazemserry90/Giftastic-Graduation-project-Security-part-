import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const COMMISSIONRULE_VIEW_SECTIONS = [
  {
    "title": "Rule",
    "fields": [
      {
        "path": "type"
      },
      {
        "path": "rate",
        "label": "Rate",
        "format": "percent"
      },
      {
        "path": "startDate",
        "label": "Start",
        "format": "datetime",
        "emptyLabel": "Not specified"
      },
      {
        "path": "endDate",
        "label": "End",
        "format": "datetime",
        "emptyLabel": "Not specified"
      },
      {
        "path": "active",
        "label": "Active",
        "format": "boolean"
      }
    ]
  },
  {
    "title": "Scope",
    "fields": [
      {
        "path": "supplierId"
      },
      {
        "path": "supplierName"
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
        "path": "createdAt",
        "label": "Created",
        "format": "datetime"
      },
      {
        "path": "createdBy"
      }
    ]
  }
];

export function CommissionRuleSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="id" subtitlePath="type" />;
}

export function CommissionRuleCard(props) { return <div className="h-full"><CommissionRuleSummary {...props} /></div>; }
export function CommissionRuleRow(props) { return <div role="row"><CommissionRuleSummary {...props} /></div>; }

export function CommissionRuleDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={COMMISSIONRULE_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function CommissionRuleWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <CommissionRuleDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}
