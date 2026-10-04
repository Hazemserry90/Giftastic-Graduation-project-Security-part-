import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const DELIVERYZONE_VIEW_SECTIONS = [
  {
    "title": "Zone",
    "fields": [
      {
        "path": "zoneName"
      },
      {
        "path": "description"
      },
      {
        "path": "isActive",
        "label": "Active",
        "format": "boolean"
      }
    ]
  },
  {
    "title": "System",
    "fields": [
      {
        "path": "id"
      }
    ]
  }
];

export function DeliveryZoneSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="zoneName" subtitlePath="description" />;
}

export function DeliveryZoneCard(props) { return <div className="h-full"><DeliveryZoneSummary {...props} /></div>; }
export function DeliveryZoneRow(props) { return <div role="row"><DeliveryZoneSummary {...props} /></div>; }

export function DeliveryZoneDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={DELIVERYZONE_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function DeliveryZoneWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <DeliveryZoneDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}
