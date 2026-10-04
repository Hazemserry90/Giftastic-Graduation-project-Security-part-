import { hasEntityIdentity, hasLoadedEntityField } from '../shared/entityModel.js';

export function buildReviewActions({ review, access, handlers = {} }) {
  if (!access.canModerate || !hasEntityIdentity(review) || !hasLoadedEntityField(review, 'status') || review.status !== 'PENDING_REVIEW') return [];
  return [
    typeof handlers.approve === 'function' && { key: 'approve', label: 'Approve', onSelect: handlers.approve },
    typeof handlers.reject === 'function' && { key: 'reject', label: 'Reject', tone: 'danger', onSelect: handlers.reject },
  ].filter(Boolean);
}
