import { hasEntityIdentity, hasLoadedEntityField } from '../shared/entityModel.js';

export function buildCommissionPaymentRequestActions({ request, access, handlers = {} }) {
  if (!hasEntityIdentity(request) || !hasLoadedEntityField(request, 'status') || request.status !== 'PENDING') return [];
  const receivingPlatformPayout = request.direction === 'PLATFORM_TO_VENDOR' && access.isOwner;
  return [
    access.canMessage && typeof handlers.message === 'function' && {
      key: 'message',
      label: 'Send message',
      onSelect: handlers.message,
    },
    access.canReview && typeof handlers.approve === 'function' && {
      key: 'approve',
      label: receivingPlatformPayout ? 'Confirm received' : 'Approve',
      onSelect: handlers.approve,
    },
    access.canReview && typeof handlers.reject === 'function' && {
      key: 'reject',
      label: receivingPlatformPayout ? 'Deny' : 'Reject',
      tone: 'danger',
      onSelect: handlers.reject,
    },
  ].filter(Boolean);
}
