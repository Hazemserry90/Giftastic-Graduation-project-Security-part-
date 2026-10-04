import { formatEntityDateTime, getEntityDateTimestamp } from '../shared/date.js';

export const formatOrderAssistanceDate = (value) =>
  formatEntityDateTime(value);

export const getOrderAssistanceStatusLabel = (status) => ({
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}[status] || 'Unknown');

export const getOrderAssistanceStatusClass = (status) => ({
  PENDING: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-slate-100 text-slate-600',
}[status] || 'bg-slate-100 text-slate-600');

export const getOrderAssistanceShortReference = (value) =>
  value ? String(value).slice(0, 8) : '-';

export const getOrderAssistanceSenderLabel = (role) => ({
  VENDOR: 'Vendor',
  ADMIN: 'Admin',
  SYSTEM: 'System',
}[role] || 'Participant');

export function getOrderAssistanceMessages(request) {
  const messages = Array.isArray(request?.messages) ? [...request.messages] : [];
  const requestMessage = request?.message?.trim();
  if (
    requestMessage
    && !messages.some((message) => message.message?.trim() === requestMessage)
  ) {
    messages.unshift({
      id: `request-${request.id}`,
      requestId: request.id,
      senderRole: 'VENDOR',
      message: requestMessage,
      createdAt: request.requestedAt || null,
    });
  }
  return messages.sort((left, right) => {
    const leftAt = getEntityDateTimestamp(left.createdAt);
    const rightAt = getEntityDateTimestamp(right.createdAt);
    if (leftAt === null && rightAt === null) return 0;
    if (leftAt === null) return 1;
    if (rightAt === null) return -1;
    return leftAt - rightAt;
  });
}
