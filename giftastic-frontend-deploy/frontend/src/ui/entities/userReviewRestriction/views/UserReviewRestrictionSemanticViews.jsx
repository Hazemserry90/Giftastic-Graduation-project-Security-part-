import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const USERREVIEWRESTRICTION_VIEW_SECTIONS = [
  {
    "title": "Capabilities",
    "fields": [
      {
        "path": "canComment",
        "label": "Can comment",
        "format": "boolean"
      },
      {
        "path": "canReview",
        "label": "Can review",
        "format": "boolean"
      },
      {
        "path": "isActive",
        "label": "Active",
        "format": "boolean"
      }
    ]
  },
  {
    "title": "Restriction",
    "fields": [
      {
        "path": "reason"
      },
      {
        "path": "restrictedAt",
        "label": "Restricted",
        "format": "datetime"
      },
      {
        "path": "expiresAt",
        "label": "Expires",
        "format": "datetime"
      }
    ]
  },
  {
    "title": "System",
    "fields": [
      {
        "path": "userId"
      },
      {
        "path": "restrictedBy"
      }
    ]
  }
];

export function UserReviewRestrictionSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="reason" subtitlePath="userId" />;
}

export function UserReviewRestrictionCard(props) { return <div className="h-full"><UserReviewRestrictionSummary {...props} /></div>; }
export function UserReviewRestrictionRow(props) { return <div role="row"><UserReviewRestrictionSummary {...props} /></div>; }

export function UserReviewRestrictionDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={USERREVIEWRESTRICTION_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function UserReviewRestrictionWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <UserReviewRestrictionDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}
