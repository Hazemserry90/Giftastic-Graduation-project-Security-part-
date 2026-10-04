import { createEntityModel } from '../shared/entityModel.js';

export const USER_REVIEW_RESTRICTION_ENTITY_TYPE = 'userReviewRestriction';
export const createUserReviewRestrictionModel = ({ source } = {}) =>
  createEntityModel(USER_REVIEW_RESTRICTION_ENTITY_TYPE, [
    'userId', 'canComment', 'canReview', 'restrictedAt', 'restrictedBy',
    'reason', 'expiresAt', 'isActive',
  ], source);
