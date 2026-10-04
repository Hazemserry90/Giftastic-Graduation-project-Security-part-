import { buildEntityPermissionSet, hasEntityPermission } from '../shared/entityModel.js';

export function buildCommissionRuleAccess({ viewer }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  return {
    permissionSet,
    canRead: hasEntityPermission(permissionSet, 'MANAGE_COMMISSIONS'),
    canManage: hasEntityPermission(permissionSet, 'MANAGE_COMMISSIONS'),
    canViewSystem: permissionSet.has('SUPER_ADMIN'),
  };
}
