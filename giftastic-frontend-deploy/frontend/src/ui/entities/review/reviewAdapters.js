import { adaptEntity } from '../shared/entityModel.js';
import { createReviewModel } from './reviewModel.js';

export function adaptReview(input = {}, { source = 'review', complete = false } = {}) {
  if (input?.entityType === 'review' && input?.meta?.loadedFields instanceof Set) return input;
  const model = adaptEntity(input, createReviewModel({ source }), {
    id: ['id', 'reviewId'],
    userId: ['userId'],
    authorName: ['authorName', 'userName', 'customerName'],
    reviewType: ['reviewType', 'type'],
    entityId: ['entityId', 'targetId'],
    rating: ['rating'],
    comment: ['comment'],
    status: ['status'],
    createdAt: ['createdAt'],
    reviewedAt: ['reviewedAt'],
    reviewedBy: ['reviewedBy'],
    moderatorNotes: ['moderatorNotes'],
    isAnonymous: ['isAnonymous', 'anonymous'],
    contentScore: ['contentScore'],
    orderId: ['orderId'],
  });
  model.meta.isPartial = !complete;
  return model;
}
