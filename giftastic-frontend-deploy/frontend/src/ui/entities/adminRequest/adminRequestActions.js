import { hasEntityIdentity, hasLoadedEntityField } from '../shared/entityModel.js';

export function buildAdminRequestActions({ request, access, handlers = {} }) {
  if (!hasEntityIdentity(request) || !hasLoadedEntityField(request, 'status')) return [];
  const actions = [];
  if (access.canReview && request.status === 'PENDING') {
    if (typeof handlers.approve === 'function') actions.push({ key: 'approve', label: 'Approve', onSelect: handlers.approve });
    if (typeof handlers.reject === 'function') actions.push({ key: 'reject', label: 'Reject', tone: 'danger', onSelect: handlers.reject });
    if (typeof handlers.invalidate === 'function') actions.push({ key: 'invalidate', label: 'Invalidate', tone: 'danger', onSelect: handlers.invalidate });
  }
  if (
    access.canResetCooldown
    && hasLoadedEntityField(request, 'canReapplyAt')
    && request.canReapplyAt
    && typeof handlers.resetCooldown === 'function'
  ) {
    actions.push({ key: 'resetCooldown', label: 'Reset cooldown', onSelect: handlers.resetCooldown });
  }
  return actions;
}
