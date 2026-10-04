import { buildEntityPermissionSet, hasEntityPermission } from '../shared/entityModel.js';

export const CATEGORY_CONTEXT = Object.freeze({ PUBLIC: 'PUBLIC', ADMIN: 'ADMIN', SYSTEM: 'SYSTEM' });

export function buildCategoryAccess({ viewer, context = CATEGORY_CONTEXT.PUBLIC }) {
  const permissionSet = buildEntityPermissionSet(viewer);
  const admin = [CATEGORY_CONTEXT.ADMIN, CATEGORY_CONTEXT.SYSTEM].includes(context);
  return {
    permissionSet,
    canRead: true,
    canManage: admin && hasEntityPermission(permissionSet, 'MANAGE_CATEGORIES'),
    canViewSystem: admin && permissionSet.has('SUPER_ADMIN'),
  };
}
