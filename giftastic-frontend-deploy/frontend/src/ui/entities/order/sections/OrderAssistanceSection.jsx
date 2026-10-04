// Canonical Order presentation section.
import OrderSection from './OrderSection';
import { formatOrderAssistanceDate } from '../../orderAssistance';

export default function OrderAssistanceSection({
  requests = [],
  actionsById = new Map(),
  messagesById = new Map(),
  loading = false,
  newMessage = '',
  onNewMessageChange,
  onRequestAssistance,
  submitting = false,
  replies = {},
  onReplyChange,
  replyLoading = false,
}) {
  return (
    <OrderSection
      title="Order Assistance"
      icon="forum"
      action={loading ? <span className="text-xs text-secondary">Loading...</span> : null}
    >
      {onRequestAssistance && (
        <div className="mb-5">
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-secondary">
            New Assistance Request
          </label>
          <textarea
            value={newMessage}
            onChange={(event) => onNewMessageChange?.(event.target.value)}
            rows="3"
            placeholder="Describe the issue and what you need help with."
            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onRequestAssistance}
              disabled={submitting}
              className="rounded-lg bg-secondary px-5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-on-secondary hover:shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No assistance requests for this order yet.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const actions = actionsById.get(request.id) || [];
            const messages = messagesById.get(request.id) || [];
            return (
            <div key={request.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
                  {request.status}
                </span>
                <span className="text-xs text-on-surface-variant">
                  {formatOrderAssistanceDate(request.requestedAt) || 'Unknown date'}
                </span>
              </div>
              <p className="mt-2 break-all text-xs text-on-surface-variant">Request ID: {request.id}</p>
              <div className="mt-3 space-y-2">
                {messages.length === 0 ? (
                  <p className="text-sm font-semibold text-primary">{request.message}</p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="text-sm">
                      <span className="mr-2 text-[10px] uppercase tracking-[0.16em] text-secondary">
                        {message.senderRole}
                      </span>
                      <span className="text-primary">{message.message}</span>
                    </div>
                  ))
                )}
              </div>

              {actions.length > 0 && (
                <div className="mt-4">
                  <textarea
                    value={replies[request.id] || ''}
                    onChange={(event) => onReplyChange?.(request.id, event.target.value)}
                    rows="2"
                    placeholder="Add a reply or feedback..."
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-primary outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    {actions.map((action) => (
                      <button
                        key={action.key}
                        type="button"
                        onClick={action.onSelect}
                        disabled={replyLoading}
                        className={`rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50 ${
                          action.key === 'close'
                            ? 'bg-emerald-600'
                            : action.key === 'reopen'
                              ? 'bg-amber-500'
                              : 'bg-primary'
                        }`}
                      >
                        {action.key === 'close' ? 'Yes, Resolved' : action.key === 'reopen' ? 'No, Need Help' : action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )})}
        </div>
      )}
    </OrderSection>
  );
}

