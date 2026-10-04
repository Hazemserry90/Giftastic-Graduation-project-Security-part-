import { createEntityModel } from '../shared/entityModel.js';

export const FAVORITE_ENTITY_TYPE = 'favorite';
export const createFavoriteModel = ({ source } = {}) =>
  createEntityModel(FAVORITE_ENTITY_TYPE, ['id', 'userId', 'productId', 'flowId', 'addedAt'], source);
