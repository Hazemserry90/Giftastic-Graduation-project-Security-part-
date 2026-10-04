import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const VENDORFEEDBACK_VIEW_SECTIONS = [
  {
    "title": "Feedback",
    "fields": [
      {
        "path": "feedback"
      },
      {
        "path": "status"
      },
      {
        "path": "createdAt",
        "label": "Created",
        "format": "datetime"
      }
    ]
  },
  {
    "title": "Moderation",
    "fields": [
      {
        "path": "reviewedAt",
        "label": "Reviewed",
        "format": "datetime"
      },
      {
        "path": "reviewedBy"
      },
      {
        "path": "moderatorNotes"
      },
      {
        "path": "contentScore",
        "label": "Content score",
        "format": "decimal"
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
        "path": "userId"
      },
      {
        "path": "vendorId"
      },
      {
        "path": "orderId"
      }
    ]
  }
];

export function VendorFeedbackSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="feedback" subtitlePath="status" />;
}

export function VendorFeedbackCard(props) { return <div className="h-full"><VendorFeedbackSummary {...props} /></div>; }
export function VendorFeedbackRow(props) { return <div role="row"><VendorFeedbackSummary {...props} /></div>; }

export function VendorFeedbackModerationExcerpt({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="feedback" subtitlePath="status" />;
}

export function VendorFeedbackDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={VENDORFEEDBACK_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function VendorFeedbackWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <VendorFeedbackDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}
