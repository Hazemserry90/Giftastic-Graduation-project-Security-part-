import UserSection from './UserSection';
import { formatUserDateTime } from '../userSelectors';
import { isAdminRequestCooldownActive } from '../../adminRequest/adminRequestSelectors';

export default function UserAdminHistorySection({ requests = [], loading = false, onResetCooldown }) {
  return (
    <UserSection title={`Admin Request History (${requests.length})`} icon="admin_panel_settings">
      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading request history…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No admin requests.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm text-primary">{request.status}</strong>
                <span className="text-xs text-on-surface-variant">{formatUserDateTime(request.requestedAt)}</span>
              </div>
              {request.message && <p className="mt-2 text-sm text-on-surface-variant">{request.message}</p>}
              {request.reviewNotes && <p className="mt-2 text-sm text-on-surface-variant">{request.reviewNotes}</p>}
              {onResetCooldown && isAdminRequestCooldownActive(request) && (
                <button
                  type="button"
                  onClick={() => onResetCooldown(request)}
                  className="mt-3 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white"
                >
                  Reset cooldown
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </UserSection>
  );
}
