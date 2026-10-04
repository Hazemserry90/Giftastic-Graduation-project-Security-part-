import { buildEntityPermissionSet, getViewerUserId, hasEntityPermission } from '../shared/entityModel.js';

export const VENDOR_FEEDBACK_CONTEXT = Object.freeze({ SUBMISSION: 'SUBMISSION', MODERATION: 'MODERATION', SYSTEM: 'SYSTEM' });

export function buildVendorFeedbackAccess({ feedback, viewer, context }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isSubmitter = Boolean(feedback?.userId && getViewerUserId(viewer) === feedback.userId);
  const moderation = [VENDOR_FEEDBACK_CONTEXT.MODERATION, VENDOR_FEEDBACK_CONTEXT.SYSTEM].includes(context);
  const canView = moderation && hasEntityPermission(permissionSet, 'VIEW_VENDOR_FEEDBACK');
  const canModerate = moderation && hasEntityPermission(permissionSet, 'MODERATE_REVIEWS');
  return {
    permissionSet, isSubmitter, canRead: isSubmitter || canView || canModerate,
    canModerate, canViewModeration: canView || canModerate,
    canViewSystem: context === VENDOR_FEEDBACK_CONTEXT.SYSTEM && permissionSet.has('SUPER_ADMIN'),
  };
}
