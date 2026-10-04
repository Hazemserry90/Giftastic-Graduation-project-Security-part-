export const getReportDisplayType = (report) =>
  report?.reportType ? report.reportType.replaceAll('_', ' ') : 'Report';

export const getReportStatusLabel = (status) => status === 'ALL'
  ? 'All'
  : ({
    FINISHED: 'Finished',
    PENDING: 'Active',
    UNDER_REVIEW: 'Active',
    ACTION_TAKEN: 'Action taken',
    DISMISSED: 'Resolved',
    RESOLVED: 'Resolved',
  }[status] || 'Unknown');

export const getReportStatusGroup = (status) =>
  ['ACTION_TAKEN', 'RESOLVED', 'DISMISSED'].includes(status) ? 'FINISHED' : 'PENDING';

export const getReportOutcomeActionLabel = (action) => ({
  BAN_USER: 'Banned user',
  DEACTIVATE_VENDOR: 'Deactivated vendor',
  ACTION_TAKEN: 'Admin action',
}[action] || 'Admin action');

export const getReportOutcomeLabel = (report) => {
  if (report?.outcomeType === 'ACTION_TAKEN') return getReportOutcomeActionLabel(report.outcomeAction);
  if (report?.outcomeType === 'RESOLVED' || ['RESOLVED', 'DISMISSED'].includes(report?.status)) return 'Resolved';
  return null;
};

export const formatReportDate = (value) => formatEntityDateTime(value);

export const getReportTypeIcon = (type) => ({
  PRODUCT: 'inventory_2',
  GIFT_FLOW: 'card_giftcard',
  USER: 'person',
  VENDOR: 'store',
  ADMIN: 'admin_panel_settings',
}[type] || 'flag');

export const getReportStatusStyle = (status) => ({
  PENDING: 'bg-secondary-container text-on-secondary-container',
  UNDER_REVIEW: 'bg-tertiary-container text-on-tertiary-container',
  ACTION_TAKEN: 'bg-primary-container text-on-primary-container',
  DISMISSED: 'bg-surface-container text-on-surface-variant',
  RESOLVED: 'bg-primary-fixed text-on-primary-fixed',
}[status] || 'bg-surface-container text-on-surface');
import { formatEntityDateTime } from '../shared/date.js';
