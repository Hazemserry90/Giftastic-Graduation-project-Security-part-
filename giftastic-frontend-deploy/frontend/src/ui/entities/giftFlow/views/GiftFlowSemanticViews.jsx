import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const GIFTFLOW_VIEW_SECTIONS = [
  {
    "title": "Flow",
    "fields": [
      {
        "path": "name"
      },
      {
        "path": "description"
      },
      {
        "path": "imageUrl",
        "label": "Image",
        "format": "url"
      }
    ]
  },
  {
    "title": "Journey",
    "fields": [
      {
        "path": "productIds",
        "label": "Products",
        "format": "count"
      },
      {
        "path": "parsedConfiguration.steps",
        "label": "Steps",
        "format": "count"
      }
    ]
  },
  {
    "title": "Vendor",
    "fields": [
      {
        "path": "supplierId"
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
        "path": "updatedAt",
        "label": "Updated",
        "format": "datetime"
      }
    ]
  }
];

export function GiftFlowSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="name" subtitlePath="description" />;
}

export function GiftFlowCard(props) { return <div className="h-full"><GiftFlowSummary {...props} /></div>; }
export function GiftFlowRow(props) { return <div role="row"><GiftFlowSummary {...props} /></div>; }

export function GiftFlowDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={GIFTFLOW_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function GiftFlowWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <GiftFlowDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}
