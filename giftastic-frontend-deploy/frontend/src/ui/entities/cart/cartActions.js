import { hasLoadedEntityField } from '../shared/entityModel.js';

export function buildCartActions({ cart, access, handlers = {} }) {
  if (!access.canManage || !hasLoadedEntityField(cart, 'items')) return [];
  return [
    typeof handlers.updateQuantity === 'function' && { key: 'updateQuantity', label: 'Update quantity', onSelect: handlers.updateQuantity },
    typeof handlers.removeItem === 'function' && { key: 'removeItem', label: 'Remove item', onSelect: handlers.removeItem },
    typeof handlers.removeGroup === 'function' && { key: 'removeGroup', label: 'Remove vendor group', onSelect: handlers.removeGroup },
    typeof handlers.clear === 'function' && { key: 'clear', label: 'Clear cart', tone: 'danger', onSelect: handlers.clear },
  ].filter(Boolean);
}
