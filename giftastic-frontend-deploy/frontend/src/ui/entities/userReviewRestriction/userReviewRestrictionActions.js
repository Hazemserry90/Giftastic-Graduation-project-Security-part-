import { hasLoadedEntityField } from '../shared/entityModel.js';

export function buildUserReviewRestrictionActions({ restriction, access, handlers = {} }) {
  if (!access.canManage || !restriction?.userId) return [];
  const exists = hasLoadedEntityField(restriction, 'restrictedAt');
  return [
    typeof handlers.save === 'function' && {
      key: 'save',
      label: exists ? 'Update restrictions' : 'Create restrictions',
      onSelect: handlers.save,
    },
    exists && typeof handlers.remove === 'function' && {
      key: 'remove', label: 'Remove restrictions', tone: 'danger', onSelect: handlers.remove,
    },
  ].filter(Boolean);
}
