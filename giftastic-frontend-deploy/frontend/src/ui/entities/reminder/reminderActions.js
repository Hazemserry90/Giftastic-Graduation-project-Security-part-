import { hasEntityIdentity } from '../shared/entityModel.js';

export function buildReminderActions({ reminder, access, handlers = {} }) {
  if (!access.canManage || !hasEntityIdentity(reminder)) return [];
  return [
    typeof handlers.edit === 'function' && { key: 'edit', label: 'Edit reminder', onSelect: handlers.edit },
    typeof handlers.delete === 'function' && { key: 'delete', label: 'Delete reminder', tone: 'danger', onSelect: handlers.delete },
  ].filter(Boolean);
}
