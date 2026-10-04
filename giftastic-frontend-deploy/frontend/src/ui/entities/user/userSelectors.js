import { getUserFieldState, USER_FIELD_STATE } from './userModel.js';
import { formatEntityDate, formatEntityDateTime, toValidEntityDate } from '../shared/date.js';

export function normalizeUserDate(value) {
  return toValidEntityDate(value);
}

export function formatUserDate(value, options = {}) {
  return formatEntityDate(value, options, 'en-US');
}

export function formatUserDateTime(value) {
  return formatEntityDateTime(value);
}

export function getUserDisplayName(model, access) {
  if (model?.fullName) return model.fullName;
  if (access?.fields?.email && model?.email) return model.email;
  return 'Unknown User';
}

export function getUserReferenceLabel(model, access) {
  const name = getReadableUserField(model, 'fullName', access?.fields?.fullName);
  const email = getReadableUserField(model, 'email', access?.fields?.email);
  if (email.value && name.value) return `${email.value} (${name.value})`;
  if (email.value) return email.value;
  if (name.value) return name.value;
  return 'Unknown User';
}

export function getUserBadges(model, access) {
  const badges = [];
  const vendor = model?.facets?.vendor;
  const admin = model?.facets?.admin;

  if (vendor?.isVendor === true && access?.fields?.vendorBadge) {
    badges.push({ key: 'vendor', label: 'Vendor', icon: 'store', tone: 'secondary' });
  }
  if (admin?.isCommunityHelper === true && access?.fields?.communityHelperBadge) {
    badges.push({ key: 'community-helper', label: 'Community Helper', icon: 'verified', tone: 'tertiary' });
  }
  if (admin?.isAdmin === true && access?.fields?.adminBadge) {
    badges.push({ key: 'admin', label: 'Admin', icon: 'shield_person', tone: 'indigo' });
  }
  if (admin?.isSuperAdmin === true && access?.fields?.superAdminBadge) {
    badges.push({ key: 'super-admin', label: 'Super Admin', icon: 'workspace_premium', tone: 'amber' });
  }
  return badges;
}

export function getReadableUserField(model, path, allowed) {
  const state = getUserFieldState(model, path, allowed);
  return {
    state,
    value: state === USER_FIELD_STATE.AVAILABLE
      ? path.split('.').reduce((value, key) => value?.[key], model)
      : null,
  };
}

export const getUserStatusLabel = (user) => user?.isBanned ? 'Banned' : 'Active';
export const getUserStatusClass = (user) => user?.isBanned
  ? 'bg-red-100 text-red-800'
  : 'bg-emerald-100 text-emerald-800';

export function isUserBanned(user, access) {
  const field = getReadableUserField(user, 'isBanned', access?.fields?.isBanned);
  return field.state === USER_FIELD_STATE.AVAILABLE && field.value === true;
}

export function matchesUserSearch(user, query, access) {
  const term = String(query || '').trim().toLowerCase();
  if (!term) return true;
  const fields = ['email', 'fullName', 'phoneNumber', 'id'];
  return fields.some((field) => {
    const readable = getReadableUserField(user, field, access?.fields?.[field]);
    return readable.state === USER_FIELD_STATE.AVAILABLE
      && String(readable.value).toLowerCase().includes(term);
  });
}
