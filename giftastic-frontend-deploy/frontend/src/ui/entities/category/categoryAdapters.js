import { adaptEntity, consumeEntitySourceField, setEntityValue } from '../shared/entityModel.js';
import { createCategoryModel } from './categoryModel.js';

export function adaptCategory(input = {}, { source = 'category', products, complete = false } = {}) {
  const model = adaptEntity(input, createCategoryModel({ source }), {
    id: ['id', 'categoryId'],
    name: ['name', 'categoryName'],
  });
  if (products !== undefined || Object.hasOwn(input, 'products')) {
    consumeEntitySourceField(model, 'products');
    setEntityValue(model, 'relations.products', products ?? input.products ?? []);
  }
  if (Object.hasOwn(input, 'productCount')) {
    consumeEntitySourceField(model, 'productCount');
    setEntityValue(model, 'relations.productCount', input.productCount);
  }
  model.meta.isPartial = !complete;
  return model;
}

export const adaptDomainCategory = (category) => adaptCategory(category, { complete: true });
