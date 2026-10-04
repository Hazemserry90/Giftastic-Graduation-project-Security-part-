import { hasEntityIdentity, hasLoadedEntityField } from '../shared/entityModel.js';

export function buildOrderAssistanceActions({ request, access, handlers = {} }) {
  if (!hasEntityIdentity(request) || !hasLoadedEntityField(request, 'status')) return [];
  const actions = [];
  if (access.canReply && typeof handlers.reply === 'function') {
    actions.push({ key: 'reply', label: 'Reply', onSelect: handlers.reply });
  }
  if (access.canResolve && typeof handlers.resolve === 'function') {
    actions.push({ key: 'resolve', label: 'Resolve', onSelect: handlers.resolve });
  }
  if (access.canGiveResolutionFeedback && typeof handlers.reopen === 'function') {
    actions.push({ key: 'reopen', label: 'Reopen', onSelect: handlers.reopen });
  }
  if (access.canGiveResolutionFeedback && typeof handlers.close === 'function') {
    actions.push({ key: 'close', label: 'Close', onSelect: handlers.close });
  }
  return actions;
}
