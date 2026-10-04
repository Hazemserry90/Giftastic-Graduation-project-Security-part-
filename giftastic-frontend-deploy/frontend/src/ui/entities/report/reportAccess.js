import { buildEntityPermissionSet, getViewerUserId, hasEntityPermission } from '../shared/entityModel.js';

export const REPORT_CONTEXT = Object.freeze({ OWNER: 'OWNER', MODERATION: 'MODERATION', SYSTEM: 'SYSTEM' });

export function buildReportAccess({ report, viewer, context = REPORT_CONTEXT.OWNER }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isReporter = Boolean(report?.reporterId && getViewerUserId(viewer) === report.reporterId);
  const moderation = [REPORT_CONTEXT.MODERATION, REPORT_CONTEXT.SYSTEM].includes(context);
  const canManage = moderation && hasEntityPermission(permissionSet, 'MANAGE_REPORTS');
  return {
    permissionSet, isReporter, canRead: isReporter || canManage, canManage,
    canViewAdminNotes: canManage,
    canViewSystem: context === REPORT_CONTEXT.SYSTEM && permissionSet.has('SUPER_ADMIN'),
  };
}
