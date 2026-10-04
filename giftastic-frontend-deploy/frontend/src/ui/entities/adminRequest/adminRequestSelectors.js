import {
  formatEntityDate,
  formatEntityDateTime,
  getEntityDateTimestamp,
  toValidEntityDate,
} from '../shared/date.js';

export const formatAdminRequestDate = (value) => formatEntityDateTime(value);

export const getAdminRequestStatusLabel = (status) => ({
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  INVALIDATED: 'Invalidated',
}[status] || 'Unknown');

export const getAdminRequestStatusStyle = (status) => ({
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  INVALIDATED: 'bg-gray-100 text-gray-800',
}[status] || 'bg-gray-100 text-gray-800');

export function getAdminRequestSubmissionState(requests = [], now = Date.now()) {
  if (requests.some((request) => request.status === 'PENDING')) {
    return { canSubmit: false, reason: 'You already have a pending request' };
  }
  const lastRejected = requests
    .filter((request) => request.status === 'REJECTED')
    .sort((a, b) => (getEntityDateTimestamp(b.requestedAt) ?? -Infinity)
      - (getEntityDateTimestamp(a.requestedAt) ?? -Infinity))[0];
  const cooldownAt = getEntityDateTimestamp(lastRejected?.canReapplyAt);
  if (cooldownAt !== null && cooldownAt > now) {
    return {
      canSubmit: false,
      reason: `You can reapply on ${formatEntityDate(lastRejected.canReapplyAt)}`,
      cooldownDate: toValidEntityDate(lastRejected.canReapplyAt),
    };
  }
  return { canSubmit: true };
}

export const isAdminRequestCooldownActive = (request, now = Date.now()) => {
  const cooldownAt = getEntityDateTimestamp(request?.canReapplyAt);
  return cooldownAt !== null && cooldownAt > now;
};

export function matchesAdminRequestSearch(request, query, access) {
  if (!access?.canRead) return false;
  const term = String(query || '').trim().toLowerCase();
  if (!term) return true;
  return ['userEmail', 'userFullName', 'message', 'id'].some((field) =>
    String(request?.[field] || '').toLowerCase().includes(term));
}
