import { hasLoadedProductField } from './productModel.js';

export const PRODUCT_CONTEXT = Object.freeze({
  PUBLIC: 'PUBLIC',
  SEARCH: 'SEARCH',
  SUMMARY: 'SUMMARY',
  OWNER_MANAGEMENT: 'OWNER_MANAGEMENT',
  ADMIN_MODERATION: 'ADMIN_MODERATION',
  ADMIN_FINANCIAL: 'ADMIN_FINANCIAL',
  SYSTEM: 'SYSTEM',
  EDIT: 'EDIT',
  ORDER_REFERENCE: 'ORDER_REFERENCE',
  FLOW_REFERENCE: 'FLOW_REFERENCE',
});

function permissionSet(viewer) {
  const set = new Set([
    ...(Array.isArray(viewer?.permissions) ? viewer.permissions : []),
    ...(Array.isArray(viewer?.facets?.admin?.permissions) ? viewer.facets.admin.permissions : []),
  ]);
  if (viewer?.isSuperAdmin || viewer?.facets?.admin?.isSuperAdmin) set.add('SUPER_ADMIN');
  return set;
}

export function hasProductPermission(set, permission) {
  return set.has('SUPER_ADMIN') || set.has(permission);
}

export function getProductViewerSupplierId(viewer) {
  return viewer?.supplierId
    || viewer?.vendor?.supplierId
    || viewer?.vendorProfile?.supplierId
    || viewer?.facets?.vendor?.supplierId
    || null;
}

export function buildProductAccess({
  product,
  viewer,
  context = PRODUCT_CONTEXT.SUMMARY,
}) {
  const permissionsSet = permissionSet(viewer);
  const isOwner = Boolean(product?.supplierId
    && getProductViewerSupplierId(viewer) === product.supplierId);
  const isSuperAdmin = permissionsSet.has('SUPER_ADMIN');
  const ownerContext = [PRODUCT_CONTEXT.OWNER_MANAGEMENT, PRODUCT_CONTEXT.EDIT].includes(context);
  const adminContext = [
    PRODUCT_CONTEXT.ADMIN_MODERATION,
    PRODUCT_CONTEXT.ADMIN_FINANCIAL,
    PRODUCT_CONTEXT.SYSTEM,
  ].includes(context);
  const hasModerationPermission = [
    'ACTIVATE_PRODUCTS', 'REJECT_PRODUCTS', 'DEACTIVATE_PRODUCTS', 'DELETE_PRODUCTS',
  ].some((permission) => hasProductPermission(permissionsSet, permission));
  const canViewInternal = (ownerContext && isOwner) || (adminContext && hasModerationPermission);
  const canReadInAdminContext =
    (context === PRODUCT_CONTEXT.ADMIN_MODERATION && hasModerationPermission)
    || (context === PRODUCT_CONTEXT.ADMIN_FINANCIAL
      && hasProductPermission(permissionsSet, 'VIEW_FINANCIAL_DATA'))
    || (context === PRODUCT_CONTEXT.SYSTEM && isSuperAdmin);
  const publicContext = [
    PRODUCT_CONTEXT.PUBLIC, PRODUCT_CONTEXT.SEARCH, PRODUCT_CONTEXT.SUMMARY,
    PRODUCT_CONTEXT.ORDER_REFERENCE, PRODUCT_CONTEXT.FLOW_REFERENCE,
  ].includes(context);
  const statusLoaded = hasLoadedProductField(product, 'status');
  const canRead = (ownerContext && isOwner) || canReadInAdminContext
    || (publicContext && (product.status === 'APPROVED' || !statusLoaded));

  const fields = {
    id: isSuperAdmin || canViewInternal,
    supplierId: isSuperAdmin || canViewInternal,
    public: true,
    availability: canViewInternal,
    status: canViewInternal,
    stockQuantity: canViewInternal,
    vendorDetails: canViewInternal,
    seo: canViewInternal,
  };
  const loadedDetails = (prefixes) => prefixes.some((field) => hasLoadedProductField(product, `details.${field}`));

  return {
    context,
    permissionSet: permissionsSet,
    isOwner,
    isSuperAdmin,
    canRead,
    fields,
    sections: {
      hero: true,
      categories: hasLoadedProductField(product, 'categories'),
      giftOptions: loadedDetails([
        'allowsEngraving', 'allowsEmbroidery', 'allowsCustomMessage',
        'allowsPhotoUpload', 'allowsColorChoice', 'allowsSizeChoice',
        'allowsGiftWrap', 'includesGiftBox', 'includesRibbon', 'allowsGiftReceipt',
      ]),
      delivery: loadedDetails([
        'requiresDeliveryDate', 'allowsScheduledDelivery', 'minDeliveryDays',
        'maxDeliveryDays', 'isPerishable', 'shelfLifeDays',
      ]),
      recipient: loadedDetails([
        'requiresRecipientInfo', 'requiresRecipientName', 'requiresRecipientEmail',
        'requiresRecipientPhone', 'requiresRecipientAddress', 'allowsAnonymousGift',
      ]),
      composition: loadedDetails([
        'isContainer', 'containsLetter', 'containsCard', 'containsFlowers',
        'containsChocolates', 'containsFood', 'itemCount',
      ]),
      inventory: canViewInternal && hasLoadedProductField(product, 'stockQuantity'),
      vendorInfo: canViewInternal && loadedDetails([
        'vendorSku', 'vendorNotes', 'fulfillmentTime', 'handmade',
        'madeToOrder', 'customizable',
      ]),
      seo: fields.seo && loadedDetails(['slug', 'metaTitle', 'metaDescription', 'tags']),
      system: isSuperAdmin && adminContext,
    },
  };
}
