import { ADMIN_PERMISSION_SET } from './permissions.js';

const normalizeRole = (role) =>
  typeof role === 'string' ? role.replace(/^ROLE_/, '') : role;

export function createViewer(input = {}, adminProfile = null) {
  const hasAuthoritativeAdminProfile = adminProfile !== null;
  const authorities = [
    ...(Array.isArray(input.roles) ? input.roles : []),
    input.role,
  ].filter(Boolean).map(normalizeRole);
  const roles = [...new Set(authorities.filter((authority) => !ADMIN_PERMISSION_SET.has(authority)))];
  const permissions = [...new Set([
    ...(!hasAuthoritativeAdminProfile ? authorities.filter((authority) => ADMIN_PERMISSION_SET.has(authority)) : []),
    ...(!hasAuthoritativeAdminProfile && Array.isArray(input.permissions) ? input.permissions.map(normalizeRole) : []),
    ...(Array.isArray(adminProfile?.permissions) ? adminProfile.permissions.map(normalizeRole) : []),
    ...(!hasAuthoritativeAdminProfile && Array.isArray(input.facets?.admin?.permissions) ? input.facets.admin.permissions.map(normalizeRole) : []),
  ].filter((permission) => ADMIN_PERMISSION_SET.has(permission)))];
  const isSuperAdmin = Boolean(
    adminProfile?.isSuperAdmin
    || (!hasAuthoritativeAdminProfile && input.isSuperAdmin)
    || permissions.includes('SUPER_ADMIN')
  );
  if (isSuperAdmin && !permissions.includes('SUPER_ADMIN')) permissions.push('SUPER_ADMIN');
  const supplierId = input.supplierId
    || input.vendor?.supplierId
    || input.vendorProfile?.supplierId
    || input.facets?.vendor?.supplierId
    || null;
  const isAdmin = Boolean(isSuperAdmin || permissions.length || roles.includes('ADMIN'));
  return {
    userId: input.userId || input.id || null,
    supplierId,
    roles,
    permissions,
    isAuthenticated: Boolean(input.id || input.userId),
    isVendor: Boolean(supplierId || roles.includes('VENDOR')),
    isAdmin,
    isSuperAdmin,
    facets: {
      vendor: supplierId ? { supplierId } : null,
      admin: isAdmin ? { permissions, isSuperAdmin } : null,
    },
  };
}

export function viewerHasCapability(viewer, requirement) {
  if (!requirement) return true;
  const requirements = Array.isArray(requirement) ? requirement : [requirement];
  if (viewer?.isSuperAdmin) return true;
  return requirements.some((value) => {
    const capability = normalizeRole(value);
    if (capability === 'VENDOR') return Boolean(viewer?.isVendor);
    if (capability === 'ADMIN') return Boolean(viewer?.isAdmin);
    if (capability === 'AUTHENTICATED' || capability === 'CUSTOMER') {
      return Boolean(viewer?.isAuthenticated);
    }
    if (ADMIN_PERMISSION_SET.has(capability)) {
      return viewer?.permissions?.includes(capability);
    }
    return viewer?.roles?.includes(capability);
  });
}
