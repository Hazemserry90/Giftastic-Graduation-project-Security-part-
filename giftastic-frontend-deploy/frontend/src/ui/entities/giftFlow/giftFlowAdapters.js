import { adaptEntity, markDerivedFieldInvalid, safeParseJson, setDerivedEntityValue } from '../shared/entityModel.js';
import { createGiftFlowModel } from './giftFlowModel.js';

export function parseGiftFlowConfiguration(value) {
  const result = safeParseJson(value);
  if (!result.ok) return null;
  const parsed = result.value || { steps: [] };

  const steps = Array.isArray(parsed?.steps) ? parsed.steps.map((step) => {
    const sourceProducts = Array.isArray(step?.products)
      ? step.products
      : (Array.isArray(step?.productIds) ? step.productIds : []);
    const products = sourceProducts.map((product) => (
      typeof product === 'string' ? { productId: product } : product
    )).filter((product) => product?.productId);
    return { ...step, products };
  }) : [];
  return { ...parsed, steps };
}

export function adaptGiftFlow(input = {}, { source = 'gift-flow', complete = false } = {}) {
  if (input?.entityType === 'giftFlow' && input?.meta?.loadedFields instanceof Set) return input;
  const model = adaptEntity(input, createGiftFlowModel({ source }), {
    id: ['id', 'flowId'],
    supplierId: ['supplierId', 'vendorId'],
    name: ['name', 'flowName'],
    description: ['description'],
    configuration: ['configuration', 'config'],
    imageUrl: ['imageUrl', 'coverImageUrl'],
    createdAt: ['createdAt'],
    updatedAt: ['updatedAt'],
  });
  if (model.meta.loadedFields.has('configuration')) {
    const parsed = parseGiftFlowConfiguration(model.configuration);
    if (!parsed) {
      markDerivedFieldInvalid(model, 'parsedConfiguration', model.configuration, 'Malformed Gift Flow configuration');
      model.meta.isPartial = !complete;
      return model;
    }
    setDerivedEntityValue(model, 'parsedConfiguration', parsed);
    const ids = [...new Set(parsed.steps.flatMap((step) =>
      (step.products || []).map((product) => product.productId).filter(Boolean)))];
    setDerivedEntityValue(model, 'productIds', ids);
  }
  model.meta.isPartial = !complete;
  return model;
}
