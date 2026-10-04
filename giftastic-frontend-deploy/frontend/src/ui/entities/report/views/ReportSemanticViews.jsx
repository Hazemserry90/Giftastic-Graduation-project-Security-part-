import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const REPORT_VIEW_SECTIONS = [
  {
    "title": "Report",
    "fields": [
      {
        "path": "reportType"
      },
      {
        "path": "reason"
      },
      {
        "path": "description"
      },
      {
        "path": "status"
      },
      {
        "path": "outcomeType",
        "label": "Outcome"
      },
      {
        "path": "outcomeAction",
        "label": "Action taken"
      }
    ]
  },
  {
    "title": "Timeline",
    "fields": [
      {
        "path": "createdAt",
        "label": "Created",
        "format": "datetime"
      },
      {
        "path": "reviewedAt",
        "label": "Reviewed",
        "format": "datetime"
      }
    ]
  },
  {
    "title": "Administration",
    "fields": [
      {
        "path": "reviewedBy"
      },
      {
        "path": "adminNotes"
      }
    ]
  },
  {
    "title": "References",
    "fields": [
      {
        "path": "id"
      },
      {
        "path": "reporterId"
      },
      {
        "path": "reportedEntityId"
      }
    ]
  }
];

export function ReportSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="reason" subtitlePath="status" />;
}

export function ReportCard(props) { return <div className="h-full"><ReportSummary {...props} /></div>; }
export function ReportRow(props) { return <div role="row"><ReportSummary {...props} /></div>; }

export function ReportDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={REPORT_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function ReportWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <ReportDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}
