import { hasLoadedEntityField } from '../shared/entityModel.js';

export function buildFavoriteActions({ favorite, access, handlers = {} }) {
  const productLoaded = hasLoadedEntityField(favorite, 'productId');
  const flowLoaded = hasLoadedEntityField(favorite, 'flowId');
  const hasOneTarget = productLoaded && flowLoaded && Boolean(favorite.productId) !== Boolean(favorite.flowId);
  if (!access.canManage || !hasOneTarget || typeof handlers.remove !== 'function') return [];
  return [{ key: 'remove', label: 'Remove favorite', tone: 'danger', onSelect: handlers.remove }];
}

export function buildFavoriteToggleAction({ favorite, access, target, viewer, handlers = {} }) {
  if (favorite) return buildFavoriteActions({ favorite, access, handlers })[0] || null;
  if (!target?.id || !['product', 'giftFlow'].includes(target.type) || typeof handlers.add !== 'function') return null;
  return { key: 'add', label: 'Add favorite', tone: 'primary', onSelect: handlers.add };
}
