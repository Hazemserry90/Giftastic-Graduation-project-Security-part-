import { hasLoadedEntityField, mergeEntityModels } from './entityModel.js';

export function getMissingEntityFields(entity, requiredFields = []) {
  return requiredFields.filter((path) => !hasLoadedEntityField(entity, path));
}

export class EntityHydrationRepository {
  constructor({ load, authorize = () => false, cache = new Map() }) {
    if (typeof load !== 'function') throw new TypeError('Entity hydration requires a loader');
    this.load = load;
    this.authorize = authorize;
    this.cache = cache;
    this.pending = new Map();
  }

  key(entity) {
    const id = entity?.identity?.id ?? entity?.id ?? entity?.supplierId;
    return `${entity?.entityType}:${id}`;
  }

  async hydrate({ entity, requiredFields, viewer, context }) {
    const missingFields = getMissingEntityFields(entity, requiredFields);
    if (!missingFields.length) return { entity, hydrated: false, error: null };
    if (!this.authorize({ entity, fields: missingFields, viewer, context })) {
      return { entity, hydrated: false, error: { code: 'FORBIDDEN_HYDRATION', fields: missingFields } };
    }
    const key = this.key(entity);
    const cached = this.cache.get(key);
    if (cached && missingFields.every((field) => hasLoadedEntityField(cached, field))) {
      return { entity: mergeEntityModels(entity, cached), hydrated: true, error: null };
    }
    if (!this.pending.has(key)) {
      this.pending.set(key, Promise.resolve(this.load({ entity, fields: missingFields, viewer, context }))
        .finally(() => this.pending.delete(key)));
    }
    try {
      const loaded = await this.pending.get(key);
      const merged = mergeEntityModels(entity, loaded);
      this.cache.set(key, merged);
      return { entity: merged, hydrated: true, error: null };
    } catch (cause) {
      return { entity, hydrated: false, error: { code: 'HYDRATION_FAILED', cause } };
    }
  }

  async hydrateMany(requests) {
    return Promise.all(requests.map((request) => this.hydrate(request)));
  }
}
