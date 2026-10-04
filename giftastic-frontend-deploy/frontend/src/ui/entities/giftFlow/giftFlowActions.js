import { hasEntityIdentity, hasLoadedEntityField } from '../shared/entityModel.js';

export function buildGiftFlowActions({ flow, access, handlers = {} }) {
  if (!access.canManage || !hasEntityIdentity(flow) || !hasLoadedEntityField(flow, 'supplierId')) return [];
  return [
    typeof handlers.edit === 'function' && { key: 'edit', label: 'Edit', onSelect: handlers.edit },
    typeof handlers.delete === 'function' && { key: 'delete', label: 'Delete', tone: 'danger', onSelect: handlers.delete },
  ].filter(Boolean);
}
