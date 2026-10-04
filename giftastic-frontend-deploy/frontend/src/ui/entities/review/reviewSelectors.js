export function getReviewAuthorName(review, canViewAuthor = false) {
  if (review?.isAnonymous && !canViewAuthor) return 'Anonymous';
  return review?.authorName || 'Customer';
}
export const getReviewId = (review) => review?.id || null;
export const formatReviewDate = (value) => formatEntityDateTime(value);
export const formatReviewContentScore = (value) => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${Math.round(numeric * 100)}%` : null;
};
export const getReviewContentScoreClass = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'bg-stone-100 text-stone-600';
  return numeric >= 0.7
    ? 'bg-[#d4f4dd] text-[#1e4620]'
    : 'bg-[#ffdad6] text-[#93000a]';
};
export const getReviewStarCount = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};
export const getReviewStatusClass = (status) => status === 'APPROVED'
  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
  : status === 'REJECTED'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';
import { formatEntityDateTime } from '../shared/date.js';
