import {
  ENTITY_FIELD_STATE, getEntityFieldState, getEntityValue, hasLoadedEntityField,
  mergeEntityModels, setEntityValue,
} from '../shared/entityModel.js';

export const USER_ENTITY_TYPE = 'user';

export const USER_FIELD_STATE = ENTITY_FIELD_STATE;

export function createUserModel({ source = 'unknown' } = {}) {
  return {
    entityType: USER_ENTITY_TYPE,
    schemaVersion: 1,
    identity: { id: null },
    data: {},
    relations: {},
    id: null,
    email: null,
    fullName: null,
    phoneNumber: null,
    instapayRefundPhoneNumber: null,
    instapayRefundName: null,
    birthday: null,
    addresses: [],
    isBanned: null,
    requestedAdmin: null,
    memberSince: null,
    facets: {
      vendor: {
        isVendor: null,
        supplierId: null,
        vendorId: null,
      },
      admin: {
        isAdmin: null,
        permissions: [],
        isSuperAdmin: null,
        isCommunityHelper: null,
      },
      reviewRestriction: {
        canComment: null,
        canReview: null,
        restrictedAt: null,
        restrictedBy: null,
        reason: null,
        expiresAt: null,
        isActive: null,
      },
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

export function isUserModel(value) {
  return value?.entityType === USER_ENTITY_TYPE && value?.meta?.loadedFields instanceof Set;
}

export function getUserValue(model, path) {
  return getEntityValue(model, path);
}

export function setUserValue(model, path, value) {
  return setEntityValue(model, path, value);
}

export function hasLoadedUserField(model, path) {
  return hasLoadedEntityField(model, path);
}

export function getUserFieldState(model, path, allowed = true) {
  return getEntityFieldState(model, path, allowed);
}

export function mergeUserModels(base, incoming) {
  if (!isUserModel(base)) return incoming;
  if (!isUserModel(incoming)) return base;
  return mergeEntityModels(base, incoming);
}
