import { hasLoadedEntityField } from '../shared/entityModel';
import {
  formatAdminRequestDate,
  getAdminRequestStatusStyle,
} from './adminRequestSelectors';

export default function AdminRequestSummary({
  request,
  access,
  onSelect,
  messageLimit = 200,
}) {
  if (!request || !access?.canRead) return null;
  const message = request.message || '';
  const displayedMessage = message.length > messageLimit
    ? `${message.slice(0, messageLimit)}…`
    : message;

  return (
    <article className="p-5 bg-stone-50 rounded-xl border border-stone-200">
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            {hasLoadedEntityField(request, 'status') && request.status && (
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getAdminRequestStatusStyle(request.status)}`}>
                {request.status}
              </span>
            )}
            {hasLoadedEntityField(request, 'requestedAt') && request.requestedAt && (
              <span className="text-xs text-on-surface-variant">
                Submitted: {formatAdminRequestDate(request.requestedAt)}
              </span>
            )}
          </div>
          {hasLoadedEntityField(request, 'userFullName') && request.userFullName && (
            <p className="font-semibold text-on-surface">{request.userFullName}</p>
          )}
          {hasLoadedEntityField(request, 'userEmail') && request.userEmail && (
            <p className="text-sm text-on-surface-variant">{request.userEmail}</p>
          )}
          {hasLoadedEntityField(request, 'message') && message && (
            <p className="mt-3 max-w-full overflow-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm text-on-surface-variant bg-white p-3 rounded-lg border border-stone-200">
              {displayedMessage}
            </p>
          )}
          {hasLoadedEntityField(request, 'reviewedAt') && request.reviewedAt && (
            <p className="mt-2 text-xs text-on-surface-variant">
              Reviewed: {formatAdminRequestDate(request.reviewedAt)}
            </p>
          )}
          {hasLoadedEntityField(request, 'reviewNotes') && request.reviewNotes && (
            <p className="mt-3 text-sm text-on-surface-variant bg-white p-3 rounded-lg border border-stone-200">
              <strong>Review notes:</strong> {request.reviewNotes}
            </p>
          )}
          {hasLoadedEntityField(request, 'canReapplyAt') && request.canReapplyAt && (
            <p className="mt-2 text-sm text-amber-700 font-semibold">
              Can reapply: {formatAdminRequestDate(request.canReapplyAt)}
            </p>
          )}
        </div>
        {typeof onSelect === 'function' && (
          <button
            type="button"
            onClick={() => onSelect(request)}
            className="px-4 py-2 border border-primary text-primary rounded-lg font-semibold"
          >
            Details
          </button>
        )}
      </div>
    </article>
  );
}
