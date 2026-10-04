import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const VENDORACTIVITY_VIEW_SECTIONS = [
  {
    "title": "Activity",
    "fields": [
      {
        "path": "activityType"
      },
      {
        "path": "description"
      },
      {
        "path": "occurredAt",
        "label": "Occurred",
        "format": "datetime"
      }
    ]
  },
  {
    "title": "Related entity",
    "fields": [
      {
        "path": "relatedEntityId"
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
        "path": "vendorId"
      }
    ]
  }
];

export function VendorActivitySummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="description" subtitlePath="activityType" />;
}

export function VendorActivityCard(props) { return <div className="h-full"><VendorActivitySummary {...props} /></div>; }
export function VendorActivityRow(props) { return <div role="row"><VendorActivitySummary {...props} /></div>; }

export function VendorActivityDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={VENDORACTIVITY_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function VendorActivityWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <VendorActivityDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}
