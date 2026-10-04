import { hasEntityIdentity, hasLoadedEntityField } from '../shared/entityModel.js';

export function buildVendorApplicationActions({ application, access, handlers = {} }) {
  if (!access.canReview || !hasEntityIdentity(application) || !hasLoadedEntityField(application, 'status') || application.status !== 'PENDING') return [];
  return [
    typeof handlers.approve === 'function' && { key: 'approve', label: 'Approve', onSelect: handlers.approve },
    typeof handlers.reject === 'function' && { key: 'reject', label: 'Reject', tone: 'danger', onSelect: handlers.reject },
  ].filter(Boolean);
}
