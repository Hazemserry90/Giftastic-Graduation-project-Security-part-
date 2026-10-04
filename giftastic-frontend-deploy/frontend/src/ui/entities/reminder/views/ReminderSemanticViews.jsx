import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const REMINDER_VIEW_SECTIONS = [
  {
    "title": "Reminder",
    "fields": [
      {
        "path": "description"
      },
      {
        "path": "scheduledAt",
        "label": "Scheduled",
        "format": "datetime"
      },
      {
        "path": "processed",
        "label": "Processed",
        "format": "boolean"
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
        "path": "customerId"
      }
    ]
  }
];

export function ReminderSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="description" subtitlePath="scheduledAt" />;
}

export function ReminderCard(props) { return <div className="h-full"><ReminderSummary {...props} /></div>; }
export function ReminderRow(props) { return <div role="row"><ReminderSummary {...props} /></div>; }

export function ReminderDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={REMINDER_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function ReminderWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <ReminderDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}
