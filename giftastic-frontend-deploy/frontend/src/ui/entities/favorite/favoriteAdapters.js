import {
  adaptEntity, hasLoadedEntityField, markEntityFieldInvalid,
} from '../shared/entityModel.js';
import { createFavoriteModel } from './favoriteModel.js';

export function adaptFavorite(input = {}, { source = 'favorite', complete = false } = {}) {
  if (
    input?.entityType === 'favorite'
    && input?.meta?.loadedFields instanceof Set
  ) {
    return input;
  }
  const model = adaptEntity(input, createFavoriteModel({ source }), {
    id: ['id', 'favoriteId'], userId: ['userId'], productId: ['productId'],
    flowId: ['flowId', 'giftFlowId'], addedAt: ['addedAt'],
  });
  const productLoaded = hasLoadedEntityField(model, 'productId');
  const flowLoaded = hasLoadedEntityField(model, 'flowId');
  if (productLoaded && flowLoaded && Boolean(model.productId) === Boolean(model.flowId)) {
    markEntityFieldInvalid(model, 'productId', model.productId, 'Favorite must contain exactly one Product or Gift Flow target');
    markEntityFieldInvalid(model, 'flowId', model.flowId, 'Favorite must contain exactly one Product or Gift Flow target');
  }
  model.meta.isPartial = !complete;
  return model;
}
