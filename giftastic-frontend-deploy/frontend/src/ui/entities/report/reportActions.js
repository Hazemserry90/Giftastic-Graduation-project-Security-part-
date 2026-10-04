import { hasEntityIdentity, hasLoadedEntityField, hasEntityPermission } from '../shared/entityModel.js';

const CLOSED_STATUSES = ['ACTION_TAKEN', 'DISMISSED', 'RESOLVED'];

export function buildReportActions({ report, access, handlers = {} }) {
  if (!access.canManage || !hasEntityIdentity(report) || !hasLoadedEntityField(report, 'status')) return [];
  const canAct = !CLOSED_STATUSES.includes(report.status);
  const hasReportedEntity = hasLoadedEntityField(report, 'reportedEntityId') && Boolean(report.reportedEntityId);
  const add = (key, label, allowed, tone) =>
    allowed && typeof handlers[key] === 'function' ? { key, label, tone, onSelect: handlers[key] } : null;
  const quickAction = report.reportType === 'USER'
    ? add('banReportedUser', 'Ban user', canAct && hasReportedEntity && hasEntityPermission(access.permissionSet, 'BAN_USERS'), 'danger')
    : report.reportType === 'VENDOR'
      ? add('deactivateReportedVendor', 'Deactivate vendor', canAct && hasReportedEntity && hasEntityPermission(access.permissionSet, 'DEACTIVATE_VENDORS'), 'danger')
      : null;
  return [
    add('resolve', 'Resolve', canAct),
    quickAction,
  ].filter(Boolean);
}
