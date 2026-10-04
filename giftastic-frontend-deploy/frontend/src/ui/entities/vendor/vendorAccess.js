import { hasLoadedVendorField } from './vendorModel.js';

export const VENDOR_CONTEXT = Object.freeze({
  PUBLIC: 'PUBLIC',
  SEARCH: 'SEARCH',
  SUMMARY: 'SUMMARY',
  OWNER_MANAGEMENT: 'OWNER_MANAGEMENT',
  ADMIN_READ: 'ADMIN_READ',
  ADMIN_MANAGEMENT: 'ADMIN_MANAGEMENT',
  ADMIN_FINANCIAL: 'ADMIN_FINANCIAL',
  SYSTEM: 'SYSTEM',
  EDIT: 'EDIT',
});

function buildPermissionSet(viewer) {
  const values = new Set([
    ...(Array.isArray(viewer?.permissions) ? viewer.permissions : []),
    ...(Array.isArray(viewer?.facets?.admin?.permissions) ? viewer.facets.admin.permissions : []),
  ]);
  if (viewer?.isSuperAdmin || viewer?.facets?.admin?.isSuperAdmin) values.add('SUPER_ADMIN');
  return values;
}

export function hasVendorPermission(permissionSet, permission) {
  return permissionSet.has('SUPER_ADMIN') || permissionSet.has(permission);
}

export function getViewerSupplierId(viewer) {
  return viewer?.supplierId || viewer?.facets?.vendor?.supplierId || null;
}

export function buildVendorAccess({
  vendor,
  viewer,
  context = VENDOR_CONTEXT.SUMMARY,
}) {
  const permissionSet = buildPermissionSet(viewer);
  const isOwner = Boolean(vendor?.supplierId && getViewerSupplierId(viewer) === vendor.supplierId);
  const isSuperAdmin = permissionSet.has('SUPER_ADMIN');
  const ownerContext = [VENDOR_CONTEXT.OWNER_MANAGEMENT, VENDOR_CONTEXT.EDIT].includes(context);
  const adminContext = [
    VENDOR_CONTEXT.ADMIN_READ,
    VENDOR_CONTEXT.ADMIN_MANAGEMENT,
    VENDOR_CONTEXT.ADMIN_FINANCIAL,
    VENDOR_CONTEXT.SYSTEM,
  ].includes(context);
  const canManageStatus = hasVendorPermission(permissionSet, 'ACTIVATE_VENDORS')
    || hasVendorPermission(permissionSet, 'DEACTIVATE_VENDORS');
  const hasVendorAdminPermission = [
    'MAKE_VENDORS', 'ACTIVATE_VENDORS', 'DEACTIVATE_VENDORS',
  ].some((permission) => hasVendorPermission(permissionSet, permission));
  const canReadInAdminContext =
    ([VENDOR_CONTEXT.ADMIN_READ, VENDOR_CONTEXT.ADMIN_MANAGEMENT].includes(context)
      && hasVendorAdminPermission)
    || (context === VENDOR_CONTEXT.ADMIN_FINANCIAL
      && hasVendorPermission(permissionSet, 'VIEW_FINANCIAL_ANALYTICS'))
    || (context === VENDOR_CONTEXT.SYSTEM && isSuperAdmin);
  const publicContext = [VENDOR_CONTEXT.PUBLIC, VENDOR_CONTEXT.SEARCH, VENDOR_CONTEXT.SUMMARY].includes(context);
  const verificationLoaded = hasLoadedVendorField(vendor, 'isVerified');
  const canRead = (ownerContext && isOwner) || canReadInAdminContext
    || (publicContext && (vendor.isVerified === true || !verificationLoaded));

  const fields = {
    userId: adminContext && isSuperAdmin,
    supplierId: (ownerContext && isOwner) || (adminContext && isSuperAdmin),
    storeName: true,
    description: true,
    logoUrl: true,
    bannerUrl: true,
    contactEmail: true,
    contactPhone: true,
    address: true,
    websiteUrl: true,
    instagramUrl: true,
    facebookUrl: true,
    workingHours: true,
    isVerified: (ownerContext && isOwner) || (adminContext && (canManageStatus || isSuperAdmin)),
    products: true,
    giftFlows: true,
  };

  const sections = {
    identity: true,
    contact: ['contactEmail', 'contactPhone', 'address', 'websiteUrl', 'workingHours']
      .some((field) => hasLoadedVendorField(vendor, field)),
    social: ['instagramUrl', 'facebookUrl'].some((field) => hasLoadedVendorField(vendor, field)),
    products: hasLoadedVendorField(vendor, 'relations.products'),
    giftFlows: hasLoadedVendorField(vendor, 'relations.giftFlows'),
    status: fields.isVerified && hasLoadedVendorField(vendor, 'isVerified'),
    system: adminContext && isSuperAdmin,
  };

  return {
    context,
    permissionSet,
    isOwner,
    isSuperAdmin,
    canRead,
    fields,
    sections,
  };
}
