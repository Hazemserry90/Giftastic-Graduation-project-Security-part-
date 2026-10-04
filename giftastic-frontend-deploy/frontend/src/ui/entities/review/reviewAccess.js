import {
  buildEntityPermissionSet,
  getViewerUserId,
  hasEntityPermission,
} from '../shared/entityModel.js';

export const REVIEW_CONTEXT = Object.freeze({ PUBLIC: 'PUBLIC', SELF: 'SELF', MODERATION: 'MODERATION', SYSTEM: 'SYSTEM' });

export function buildReviewAccess({ review, viewer, context = REVIEW_CONTEXT.PUBLIC }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isOwner = Boolean(review?.userId && getViewerUserId(viewer) === review.userId);
  const moderation = [REVIEW_CONTEXT.MODERATION, REVIEW_CONTEXT.SYSTEM].includes(context);
  const canViewModeration = moderation && hasEntityPermission(permissionSet, 'VIEW_REVIEWS');
  const canModerate = moderation && hasEntityPermission(permissionSet, 'MODERATE_REVIEWS');
  const canRead = context === REVIEW_CONTEXT.PUBLIC
    ? review?.status === 'APPROVED'
    : context === REVIEW_CONTEXT.SELF
      ? isOwner
      : canViewModeration || canModerate;
  return {
    permissionSet,
    isOwner,
    canRead,
    fields: {
      author: !review.isAnonymous || isOwner || canViewModeration || canModerate,
      status: canViewModeration || canModerate,
      moderation: canViewModeration || canModerate,
      system: context === REVIEW_CONTEXT.SYSTEM && permissionSet.has('SUPER_ADMIN'),
    },
    canModerate,
  };
}
