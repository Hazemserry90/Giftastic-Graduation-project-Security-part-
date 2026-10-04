import { productService } from '../../../services/productService.js';
import { giftFlowService } from '../../../services/giftFlowService.js';
import { adaptEntityFromNamedSource } from '../namedAdapters.js';
import { buildProductAccess, PRODUCT_CONTEXT } from '../product/index.js';
import { buildGiftFlowAccess, GIFT_FLOW_CONTEXT } from '../giftFlow/index.js';

const caches = {
  product: new Map(),
  giftFlow: new Map(),
};

const definitions = {
  product: {
    load: (id) => productService.getProductById(id),
    adapter: 'adaptProductDomain',
  },
  giftFlow: {
    load: (id) => giftFlowService.getFlowById(id),
    adapter: 'adaptGiftFlowResponse',
  },
};

export function authorizeEntityHydration(entityType, { entity, id, viewer, context } = {}) {
  if (!id && !entity?.id) return false;
  if (entityType === 'product') {
    const candidate = entity || adaptEntityFromNamedSource('adaptProductDomain', { id });
    return buildProductAccess({
      product: candidate,
      viewer,
      context: context || PRODUCT_CONTEXT.PUBLIC,
    }).canRead;
  }
  if (entityType === 'giftFlow') {
    const candidate = entity || adaptEntityFromNamedSource('adaptGiftFlowResponse', { id });
    return buildGiftFlowAccess({
      flow: candidate,
      viewer,
      context: context || GIFT_FLOW_CONTEXT.PUBLIC,
    }).canRead;
  }
  return false;
}

export function hydrateEntityById(entityType, id, { authorized = false } = {}) {
  if (!authorized || !id || !definitions[entityType]) return Promise.resolve(null);
  const key = String(id);
  const cache = caches[entityType];
  if (!cache.has(key)) {
    const definition = definitions[entityType];
    cache.set(key, definition.load(key)
      .then((record) => adaptEntityFromNamedSource(definition.adapter, record))
      .catch((error) => { cache.delete(key); throw error; }));
  }
  return cache.get(key);
}

export async function hydrateEntitiesById(entityType, ids, options) {
  const unique = [...new Set((ids || []).filter(Boolean).map(String))];
  return Promise.all(unique.map((id) => hydrateEntityById(entityType, id, options).catch(() => null)))
    .then((models) => models.filter(Boolean));
}

export function rememberHydratedEntity(entity) {
  const id = entity?.id;
  if (entity?.entityType && caches[entity.entityType] && id) caches[entity.entityType].set(String(id), Promise.resolve(entity));
  return entity;
}

export function invalidateHydratedEntity(entityType, id) {
  caches[entityType]?.delete(String(id));
}
