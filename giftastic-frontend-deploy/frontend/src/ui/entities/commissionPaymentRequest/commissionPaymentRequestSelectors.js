import { formatEntityDateTime } from '../shared/date.js';

export const formatCommissionPaymentRequestDate = (value) =>
  formatEntityDateTime(value);

export const getCommissionPaymentRequestLabel = (request) =>
  request?.commissionId ? `#${String(request.commissionId).slice(0, 8)}` : null;

export const countPendingCommissionPaymentRequests = (requests = []) =>
  requests.reduce((count, request) => count + (request?.status === 'PENDING' ? 1 : 0), 0);

export const isPendingCommissionPaymentRequest = (request) => request?.status === 'PENDING';

export const getCommissionPaymentRequestStatusClass = (status) => ({
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}[status] || 'bg-gray-100 text-gray-800');
