import { createEntityModel } from '../shared/entityModel.js';

export const REVIEW_ENTITY_TYPE = 'review';
export const createReviewModel = ({ source } = {}) => createEntityModel(
  REVIEW_ENTITY_TYPE,
  [
    'id', 'userId', 'authorName', 'reviewType', 'entityId', 'rating',
    'comment', 'status', 'createdAt', 'reviewedAt', 'reviewedBy',
    'moderatorNotes', 'isAnonymous', 'contentScore', 'orderId',
  ],
  source,
);
