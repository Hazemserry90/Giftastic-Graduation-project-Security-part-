import { adaptEntity, ENTITY_FIELD_STATE, getEntityFieldState, setDerivedEntityValue } from '../shared/entityModel.js';
import { createUserReviewRestrictionModel } from './userReviewRestrictionModel.js';
import { validateCanonicalModel } from '../shared/modelValidation.js';
import { getEntityDateTimestamp } from '../shared/date.js';

export function adaptUserReviewRestriction(input = {}, { source = 'user-review-restriction', complete = false } = {}) {
  if (
    input?.entityType === 'userReviewRestriction'
    && input?.meta?.loadedFields instanceof Set
  ) {
    return input;
  }
  const fields = ['userId', 'canComment', 'canReview', 'restrictedAt', 'restrictedBy', 'reason', 'expiresAt', 'isActive'];
  const model = adaptEntity(input, createUserReviewRestrictionModel({ source }),
    Object.fromEntries(fields.map((field) => [field, [field]])));
  validateCanonicalModel(model);
  if (!model.meta.loadedFields.has('isActive') && [ENTITY_FIELD_STATE.AVAILABLE, ENTITY_FIELD_STATE.EMPTY].includes(getEntityFieldState(model, 'expiresAt'))) {
    setDerivedEntityValue(model, 'isActive', !model.expiresAt || getEntityDateTimestamp(model.expiresAt) > Date.now());
  }
  model.meta.isPartial = !complete;
  return model;
}
