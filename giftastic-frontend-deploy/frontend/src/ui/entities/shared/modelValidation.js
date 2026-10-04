import {
  ENTITY_ENUM_VALUES, getEntityValue, markEntityFieldInvalid, normalizeEntityScalar, setEntityValue,
} from './entityModel.js';

export const ENTITY_ENUMS = ENTITY_ENUM_VALUES;

function invalid(model, path, value, reason) {
  markEntityFieldInvalid(model, path, value, reason);
}

export function validateCanonicalModel(model) {
  for (const path of [...model.meta.loadedFields]) {
    const value = getEntityValue(model, path);
    if (value === null || value === undefined || value === '') continue;
    const result = normalizeEntityScalar(path, value, model.entityType);
    if (result.ok) setEntityValue(model, path, result.value);
    else invalid(model, path, value, result.reason);
  }
  return model;
}
