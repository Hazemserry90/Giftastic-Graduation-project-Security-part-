import { SemanticActionBar, SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';
import {
  formatAdminRequestDate,
  getAdminRequestStatusLabel,
  getAdminRequestStatusStyle,
} from '../adminRequestSelectors';

export const ADMINREQUEST_VIEW_SECTIONS = [
  {
    "title": "Request",
    "fields": [
      {
        "path": "message"
      },
      {
        "path": "status"
      },
      {
        "path": "requestedAt",
        "label": "Requested",
        "format": "datetime"
      }
    ]
  },
  {
    "title": "Outcome",
    "fields": [
      {
        "path": "reviewedAt",
        "label": "Reviewed",
        "format": "datetime"
      },
      {
        "path": "reviewNotes"
      },
      {
        "path": "canReapplyAt",
        "label": "Can reapply",
        "format": "datetime"
      }
    ]
  },
  {
    "title": "Applicant",
    "fields": [
      {
        "path": "userFullName"
      },
      {
        "path": "userEmail"
      },
      {
        "path": "userId"
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
        "path": "reviewedBy"
      }
    ]
  }
];

export function AdminRequestSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="message" subtitlePath="status" />;
}

export function AdminRequestCard(props) { return <div className="h-full"><AdminRequestSummary {...props} /></div>; }
export function AdminRequestRow(props) { return <div role="row"><AdminRequestSummary {...props} /></div>; }

export function AdminRequestModerationCard({ entity, access, actions = [], onDetails, pendingKey }) {
  if (!entity || !access?.canRead) return null;
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-5" data-entity-summary="adminRequest">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${getAdminRequestStatusStyle(entity.status)}`}>
              {getAdminRequestStatusLabel(entity.status)}
            </span>
            <span className="text-sm text-slate-500">{formatAdminRequestDate(entity.requestedAt) || '-'}</span>
          </div>
          <h4 className="break-words font-semibold text-slate-800">{entity.userFullName || 'Unknown User'}</h4>
          {entity.userEmail && <p className="break-all text-sm text-slate-500">{entity.userEmail}</p>}
          {entity.message && <p className="mt-3 max-w-full overflow-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-lg border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-700">{entity.message}</p>}
          {entity.reviewNotes && <p className="mt-3 break-words text-sm text-slate-600"><strong>Review notes:</strong> {entity.reviewNotes}</p>}
          {entity.canReapplyAt && <p className="mt-2 text-xs font-semibold text-amber-600">Can reapply: {formatAdminRequestDate(entity.canReapplyAt) || '-'}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <SemanticActionBar actions={actions.filter((action) => ['approve', 'reject'].includes(action.key))} pendingKey={pendingKey} />
          <button
            type="button"
            onClick={() => onDetails?.(entity)}
            disabled={Boolean(pendingKey)}
            className="min-h-11 rounded-lg border border-red-500 bg-white px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
          >
            Details
          </button>
        </div>
      </div>
    </article>
  );
}

export function AdminRequestDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={ADMINREQUEST_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function AdminRequestWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <AdminRequestDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}
