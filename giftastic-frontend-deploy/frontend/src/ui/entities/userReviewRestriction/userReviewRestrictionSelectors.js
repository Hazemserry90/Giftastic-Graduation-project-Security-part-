import { formatEntityDate } from '../shared/date.js';

export const formatUserReviewRestrictionDate = (value) =>
  formatEntityDate(value);

export const getRestrictedCapabilities = (restriction) => [
  restriction?.canReview === false && 'You are currently restricted from submitting reviews',
  restriction?.canComment === false && 'You are currently restricted from submitting comments',
].filter(Boolean);

export const isRestrictionReasonDirty = (reason, baselineReason) =>
  String(reason ?? '') !== String(baselineReason ?? '');
