import { hasLoadedProductField } from './productModel.js';
import { hasProductPermission } from './productAccess.js';
import { hasEntityIdentity } from '../shared/entityModel.js';

export function buildProductActions({ product, access, handlers = {} }) {
  if (!hasEntityIdentity(product) || !hasLoadedProductField(product, 'status')) return [];
  const actions = [];
  if (access.isOwner && typeof handlers.manageDiscount === 'function') {
    actions.push({ key: 'manageDiscount', label: 'Manage discount', onSelect: handlers.manageDiscount });
  }
  if (access.isOwner && product.status === 'DISABLED' && typeof handlers.requestReview === 'function') {
    actions.push({ key: 'requestReview', label: 'Request review', onSelect: handlers.requestReview });
  }
  const add = (key, label, permission, statuses, tone = 'primary') => {
    if (statuses.includes(product.status)
      && hasProductPermission(access.permissionSet, permission)
      && typeof handlers[key] === 'function') {
      actions.push({ key, label, tone, onSelect: handlers[key] });
    }
  };
  add('approve', 'Approve', 'ACTIVATE_PRODUCTS', ['DRAFT', 'PENDING_APPROVAL']);
  add('reject', 'Reject', 'REJECT_PRODUCTS', ['PENDING_APPROVAL'], 'danger');
  add('activate', 'Activate', 'ACTIVATE_PRODUCTS', ['DISABLED']);
  add('deactivate', 'Deactivate', 'DEACTIVATE_PRODUCTS', ['APPROVED'], 'danger');
  if (hasProductPermission(access.permissionSet, 'DELETE_PRODUCTS')
    && typeof handlers.delete === 'function') {
    actions.push({ key: 'delete', label: 'Delete', tone: 'danger', onSelect: handlers.delete });
  }
  return actions;
}
