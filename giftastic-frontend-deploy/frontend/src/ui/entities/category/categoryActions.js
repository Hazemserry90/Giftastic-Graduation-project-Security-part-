import { hasEntityIdentity } from '../shared/entityModel.js';

export function buildCategoryActions({ category, access, handlers = {} }) {
  if (!access.canManage || !hasEntityIdentity(category)) return [];
  return [
    typeof handlers.edit === 'function' && { key: 'edit', label: 'Edit', tone: 'primary', onSelect: handlers.edit },
    typeof handlers.delete === 'function' && { key: 'delete', label: 'Delete', tone: 'danger', onSelect: handlers.delete },
  ].filter(Boolean);
}
