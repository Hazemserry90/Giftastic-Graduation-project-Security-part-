import { createEntityModel } from '../shared/entityModel.js';

export const CART_ENTITY_TYPE = 'cart';
export const createCartModel = ({ source } = {}) => ({
  ...createEntityModel(CART_ENTITY_TYPE, ['id', 'customerId', 'items', 'total', 'updatedAt'], source),
  items: [],
});
