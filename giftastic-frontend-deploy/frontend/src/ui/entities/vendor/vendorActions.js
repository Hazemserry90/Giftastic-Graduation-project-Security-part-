import { hasLoadedVendorField } from './vendorModel.js';
import { hasVendorPermission } from './vendorAccess.js';
import { hasEntityIdentity } from '../shared/entityModel.js';

const ACTIONS = {
  activate: { permission: 'ACTIVATE_VENDORS', label: 'Activate Vendor', icon: 'verified', tone: 'success' },
  deactivate: { permission: 'DEACTIVATE_VENDORS', label: 'Deactivate Vendor', icon: 'store_off', tone: 'danger' },
};

export function buildVendorActions({ vendor, access, supportedActions, handlers = {}, onAction }) {
  if (!hasEntityIdentity(vendor) || !hasLoadedVendorField(vendor, 'isVerified')) return [];
  const supported = new Set(supportedActions || Object.keys(ACTIONS));
  const keys = vendor.isVerified ? ['deactivate'] : ['activate'];
  return keys.flatMap((key) => {
    const action = ACTIONS[key];
    const handler = handlers[key] || (typeof onAction === 'function' ? () => onAction(key) : null);
    return supported.has(key) && hasVendorPermission(access.permissionSet, action.permission) && handler
      ? [{ key, ...action, onSelect: handler }]
      : [];
  });
}
