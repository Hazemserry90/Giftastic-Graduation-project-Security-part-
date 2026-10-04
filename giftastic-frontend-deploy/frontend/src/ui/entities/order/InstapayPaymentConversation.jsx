const formatDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getSenderLabel = (message) =>
  message?.senderRole === 'PLATFORM' ? 'Giftastic' : 'Customer';

const getMessages = (order) => {
  const storedMessages = Array.isArray(order?.instapayPaymentMessages)
    ? order.instapayPaymentMessages.filter((message) => String(message?.message || '').trim())
    : [];
  if (storedMessages.length) return storedMessages;

  const fallback = [];
  if (order?.instapayTransactionIds?.length) {
    fallback.push({
      senderRole: 'CUSTOMER',
      message: `Submitted transaction IDs: ${order.instapayTransactionIds.join(', ')}`,
      sentAt: order.placedAt,
    });
  }
  if (order?.paymentRejectionReason) {
    fallback.push({
      senderRole: 'PLATFORM',
      message: `Rejected: ${order.paymentRejectionReason}`,
      sentAt: order.paymentConfirmedAt || null,
    });
  }
  return fallback;
};

export default function InstapayPaymentConversation({ order, title = 'Instapay conversation' }) {
  const messages = getMessages(order);
  if (!messages.length) return null;

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-primary">{title}</h3>
      <ol className="mt-3 space-y-3">
        {messages.map((message, index) => (
          <li key={`${message.senderRole || 'message'}-${message.sentAt || index}`} className="rounded-lg bg-stone-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-stone-900">{getSenderLabel(message)}</p>
              {formatDateTime(message.sentAt) && (
                <p className="text-xs text-stone-500">{formatDateTime(message.sentAt)}</p>
              )}
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-stone-700">{message.message}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
