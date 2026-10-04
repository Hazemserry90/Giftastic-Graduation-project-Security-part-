import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const NOTIFICATION_VIEW_SECTIONS = [
  {
    "title": "Notification",
    "fields": [
      {
        "path": "title"
      },
      {
        "path": "message"
      },
      {
        "path": "createdAt",
        "label": "Received",
        "format": "datetime"
      }
    ]
  }
];

export function NotificationSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="title" subtitlePath="message" />;
}

export function NotificationCard(props) { return <div className="h-full"><NotificationSummary {...props} /></div>; }
export function NotificationRow(props) { return <div role="row"><NotificationSummary {...props} /></div>; }

export function NotificationDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={NOTIFICATION_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} showHeader={false} />;
}

export function NotificationWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <NotificationDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}
