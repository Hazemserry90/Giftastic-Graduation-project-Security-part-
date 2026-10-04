import { buildEntityPermissionSet, getViewerUserId } from '../shared/entityModel.js';
export function buildReminderAccess({ reminder, viewer }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const isOwner = Boolean(reminder?.customerId && getViewerUserId(viewer) === reminder.customerId);
  return {
    permissionSet,
    ownership: { isOwner },
    participation: {},
    fields: { schedule: isOwner, processed: isOwner },
    sections: { reminder: isOwner, system: isOwner, actions: isOwner },
    isOwner,
    canRead: isOwner,
    canManage: isOwner,
  };
}
