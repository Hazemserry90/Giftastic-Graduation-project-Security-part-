import {
  createEntityReference,
  ENTITY_FIELD_STATE, getEntityFieldState, getEntityValue, hasLoadedEntityField,
  mergeEntityModels, setEntityValue,
} from '../shared/entityModel.js';

export const VENDOR_ENTITY_TYPE = 'vendor';

export const VENDOR_FIELD_STATE = ENTITY_FIELD_STATE;

export function createVendorModel({ source = 'unknown' } = {}) {
  return {
    entityType: VENDOR_ENTITY_TYPE,
    schemaVersion: 1,
    identity: { id: null },
    data: {},
    userId: null,
    supplierId: null,
    storeName: null,
    description: null,
    logoUrl: null,
    bannerUrl: null,
    contactEmail: null,
    contactPhone: null,
    address: null,
    websiteUrl: null,
    instagramUrl: null,
    facebookUrl: null,
    workingHours: null,
    isVerified: null,
    relations: {
      products: [],
      giftFlows: [],
      ownerUser: null,
    },
    meta: {
      source,
      loadedFields: new Set(),
      derivedFields: new Set(),
      invalidFields: new Set(),
      isPartial: true,
      adapter: source,
      fetchedAt: null,
      issues: [],
      unknownFields: [],
    },
  };
}

export function isVendorModel(value) {
  return value?.entityType === VENDOR_ENTITY_TYPE && value?.meta?.loadedFields instanceof Set;
}

export function getVendorValue(model, path) {
  return getEntityValue(model, path);
}

export function setVendorValue(model, path, value) {
  return setEntityValue(model, path, value);
}

export function hasLoadedVendorField(model, path) {
  return hasLoadedEntityField(model, path);
}

export function getVendorFieldState(model, path, allowed = true) {
  return getEntityFieldState(model, path, allowed);
}

export function mergeVendorModels(base, incoming) {
  if (!isVendorModel(base)) return incoming;
  if (!isVendorModel(incoming)) return base;

  return mergeEntityModels(base, incoming);
}

function normalizeVendorRelation(entityType, value) {
  if (value == null) return null;
  if (value.entityType === entityType && Object.hasOwn(value, 'loaded')) return value;
  const snapshot = value?.entityType === entityType ? value : undefined;
  const id = value?.id
    ?? (entityType === 'vendor' ? value?.supplierId : null);
  return createEntityReference(entityType, id, snapshot);
}

function normalizeVendorRelationList(entityType, values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => normalizeVendorRelation(entityType, value));
}

export function withVendorRelations(model, { products, giftFlows, ownerUser } = {}) {
  if (!isVendorModel(model)) return model;
  const next = {
    ...model,
    relations: { ...model.relations },
    meta: {
      ...model.meta,
      loadedFields: new Set(model.meta.loadedFields),
      derivedFields: new Set(model.meta.derivedFields),
      invalidFields: new Set(model.meta.invalidFields),
      issues: [...(model.meta.issues || [])],
      unknownFields: [...(model.meta.unknownFields || [])],
    },
  };
  if (products !== undefined) {
    setVendorValue(next, 'relations.products', normalizeVendorRelationList('product', products));
  }
  if (giftFlows !== undefined) {
    setVendorValue(next, 'relations.giftFlows', normalizeVendorRelationList('giftFlow', giftFlows));
  }
  if (ownerUser !== undefined) {
    setVendorValue(next, 'relations.ownerUser', normalizeVendorRelation('user', ownerUser));
  }
  return next;
}

export { normalizeVendorRelation, normalizeVendorRelationList };
