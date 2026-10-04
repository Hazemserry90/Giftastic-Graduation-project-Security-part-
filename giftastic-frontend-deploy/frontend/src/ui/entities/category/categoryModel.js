import { createEntityModel } from '../shared/entityModel.js';

export const CATEGORY_ENTITY_TYPE = 'category';
export const createCategoryModel = ({ source } = {}) => ({
  ...createEntityModel(CATEGORY_ENTITY_TYPE, ['id', 'name'], source),
  relations: { products: [], productCount: null },
});
