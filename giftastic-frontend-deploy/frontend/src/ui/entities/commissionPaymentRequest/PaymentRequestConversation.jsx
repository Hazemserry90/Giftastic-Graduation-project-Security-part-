import { formatCommissionPaymentRequestDate } from './commissionPaymentRequestSelectors';

const getSenderLabel = (message, request) =>
  message?.senderRole === 'PLATFORM' ? 'Giftastic' : request?.supplierName || 'Vendor';

export default function PaymentRequestConversation({ request, title = 'Conversation', compact = false }) {
  const messages = Array.isArray(request?.messages)
    ? request.messages.filter((message) => String(message?.message || '').trim())
    : [];

  if (!messages.length) return null;

  return (
    <section className={`rounded-lg border border-stone-200 bg-white ${compact ? 'p-3' : 'p-4'}`}>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-primary">{title}</h3>
      <ol className="space-y-3">
        {messages.map((message, index) => (
          <li key={message.id || `${message.senderRole || 'message'}-${message.sentAt || index}`} className="rounded-lg bg-stone-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-stone-900">{getSenderLabel(message, request)}</p>
              {message.sentAt && (
                <p className="text-xs text-stone-500">{formatCommissionPaymentRequestDate(message.sentAt)}</p>
              )}
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-stone-700">{message.message}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
