import { getUserFieldState, hasLoadedUserField, USER_FIELD_STATE } from './userModel.js';
import { hasUserPermission } from './userAccess.js';
import { hasEntityIdentity } from '../shared/entityModel.js';

const ACTION_META = {
  ban: { permission: 'BAN_USERS', label: 'Ban User', icon: 'block', tone: 'warning' },
  unban: { permission: 'UNBAN_USERS', label: 'Unban User', icon: 'lock_open', tone: 'success' },
  delete: { permission: 'DELETE_USERS', label: 'Delete User', icon: 'person_remove', tone: 'danger' },
  makeAdmin: { permission: 'MAKE_ADMINS', label: 'Make Admin', icon: 'shield_person', tone: 'primary' },
  demoteAdmin: { permission: 'DEMOTE_ADMINS', label: 'Demote Admin', icon: 'shield_minus', tone: 'danger' },
  mute: { permission: 'MUTE_USERS', label: 'Restrict Reviews', icon: 'volume_off', tone: 'neutral' },
  unmute: { permission: 'MUTE_USERS', label: 'Remove Review Restriction', icon: 'volume_up', tone: 'neutral' },
  grantPermission: { permission: 'MANAGE_ADMIN_PERMISSIONS', label: 'Grant Permission', icon: 'add_moderator', tone: 'success' },
  revokePermission: { permission: 'MANAGE_ADMIN_PERMISSIONS', label: 'Revoke Permission', icon: 'remove_moderator', tone: 'danger' },
};

export function buildUserActions({ user, access, supportedActions, handlers = {}, onAction }) {
  if (!hasEntityIdentity(user)) return [];
  const supported = new Set(supportedActions || Object.keys(ACTION_META));
  const actions = [];
  const bannedLoaded = hasLoadedUserField(user, 'isBanned');
  const adminLoaded = ![USER_FIELD_STATE.UNLOADED, USER_FIELD_STATE.INVALID]
    .includes(getUserFieldState(user, 'facets.admin.isAdmin'));
  const restrictionLoaded = ![USER_FIELD_STATE.UNLOADED, USER_FIELD_STATE.INVALID]
    .includes(getUserFieldState(user, 'facets.reviewRestriction.isActive'));

  const include = (key, stateAllowed) => {
    const meta = ACTION_META[key];
    if (
      supported.has(key)
      && stateAllowed
      && hasUserPermission(access.permissionSet, meta.permission)
      && (typeof handlers[key] === 'function' || typeof onAction === 'function')
    ) {
      actions.push({ key, ...meta, onSelect: handlers[key] || (() => onAction(key)) });
    }
  };

  include('ban', bannedLoaded && user.isBanned === false && !access.isSelf);
  include('unban', bannedLoaded && user.isBanned === true);
  include('delete', Boolean(user.id) && !access.isSelf);
  include('makeAdmin', adminLoaded && user.facets.admin.isAdmin === false);
  include('demoteAdmin', adminLoaded && user.facets.admin.isAdmin === true && user.facets.admin.isSuperAdmin !== true);
  include('mute', restrictionLoaded && user.facets.reviewRestriction.isActive === false);
  include('unmute', restrictionLoaded && user.facets.reviewRestriction.isActive === true);
  include('grantPermission', adminLoaded);
  include('revokePermission', adminLoaded);

  return actions;
}
