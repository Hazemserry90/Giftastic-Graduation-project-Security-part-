import { buildUserAccess } from '../user/userAccess.js';
import { buildVendorAccess } from '../vendor/vendorAccess.js';
import { buildProductAccess } from '../product/productAccess.js';
import { buildOrderAccess } from '../order/orderAccess.js';
import { buildGiftFlowAccess } from '../giftFlow/giftFlowAccess.js';
import { buildCartAccess } from '../cart/cartAccess.js';
import { buildReviewAccess } from '../review/reviewAccess.js';
import { buildCategoryAccess } from '../category/categoryAccess.js';
import { buildVendorApplicationAccess } from '../vendorApplication/vendorApplicationAccess.js';
import { buildCommissionAccess } from '../commission/commissionAccess.js';
import { buildCommissionPaymentRequestAccess } from '../commissionPaymentRequest/commissionPaymentRequestAccess.js';
import { buildCommissionRuleAccess } from '../commissionRule/commissionRuleAccess.js';
import { buildReportAccess } from '../report/reportAccess.js';
import { buildAdminRequestAccess } from '../adminRequest/adminRequestAccess.js';
import { buildOrderAssistanceAccess } from '../orderAssistance/orderAssistanceAccess.js';
import { buildNotificationAccess } from '../notification/notificationAccess.js';
import { buildVendorFeedbackAccess } from '../vendorFeedback/vendorFeedbackAccess.js';
import { buildDeliveryZoneAccess } from '../deliveryZone/deliveryZoneAccess.js';
import { buildVendorDeliveryPricingAccess } from '../vendorDeliveryPricing/vendorDeliveryPricingAccess.js';
import { buildReminderAccess } from '../reminder/reminderAccess.js';
import { buildVendorActivityAccess } from '../vendorActivity/vendorActivityAccess.js';
import { buildUserReviewRestrictionAccess } from '../userReviewRestriction/userReviewRestrictionAccess.js';
import { buildFavoriteAccess } from '../favorite/favoriteAccess.js';

export const VIEW_CONTEXT = Object.freeze({
  PUBLIC: 'PUBLIC', SEARCH: 'SEARCH', SUMMARY: 'SUMMARY', SELF: 'SELF', OWNER_MANAGEMENT: 'OWNER_MANAGEMENT',
  ORDER_CUSTOMER: 'ORDER_CUSTOMER', ORDER_VENDOR: 'ORDER_VENDOR', CHECKOUT: 'CHECKOUT', ADMIN_READ: 'ADMIN_READ',
  ADMIN_MODERATION: 'ADMIN_MODERATION', ADMIN_FINANCIAL: 'ADMIN_FINANCIAL', SYSTEM: 'SYSTEM', EDIT: 'EDIT',
});

const entries = {
  user: [buildUserAccess, 'user'], vendor: [buildVendorAccess, 'vendor'], product: [buildProductAccess, 'product'],
  order: [buildOrderAccess, 'order'], giftFlow: [buildGiftFlowAccess, 'flow'], cart: [buildCartAccess, 'cart'],
  review: [buildReviewAccess, 'review'], category: [buildCategoryAccess, 'category'],
  vendorApplication: [buildVendorApplicationAccess, 'application'], commission: [buildCommissionAccess, 'commission'],
  commissionPaymentRequest: [buildCommissionPaymentRequestAccess, 'request'], commissionRule: [buildCommissionRuleAccess, 'rule'],
  report: [buildReportAccess, 'report'], adminRequest: [buildAdminRequestAccess, 'request'],
  orderAssistance: [buildOrderAssistanceAccess, 'request'], notification: [buildNotificationAccess, 'notification'],
  vendorFeedback: [buildVendorFeedbackAccess, 'feedback'], deliveryZone: [buildDeliveryZoneAccess, 'zone'],
  vendorDeliveryPricing: [buildVendorDeliveryPricingAccess, 'pricing'], reminder: [buildReminderAccess, 'reminder'],
  vendorActivity: [buildVendorActivityAccess, 'activity'], userReviewRestriction: [buildUserReviewRestrictionAccess, 'restriction'],
  favorite: [buildFavoriteAccess, 'favorite'],
};

const CONTEXT_MAP = Object.freeze({
  user: { OWNER_MANAGEMENT: 'SELF', ADMIN_MODERATION: 'ADMIN_MANAGEMENT', ADMIN_FINANCIAL: 'ADMIN_FINANCIAL' },
  vendor: { ADMIN_MODERATION: 'ADMIN_MANAGEMENT' },
  order: { ORDER_CUSTOMER: 'CUSTOMER', ORDER_VENDOR: 'VENDOR', ADMIN_READ: 'ADMIN', ADMIN_MODERATION: 'ADMIN', ADMIN_FINANCIAL: 'FINANCIAL' },
  giftFlow: { OWNER_MANAGEMENT: 'OWNER', ADMIN_READ: 'ADMIN', ADMIN_MODERATION: 'ADMIN' },
  cart: { SELF: 'OWNER', CHECKOUT: 'OWNER' },
  review: { ADMIN_READ: 'MODERATION', ADMIN_MODERATION: 'MODERATION' },
  category: { ADMIN_READ: 'ADMIN', ADMIN_MODERATION: 'ADMIN' },
  vendorApplication: { ADMIN_READ: 'ADMIN', ADMIN_MODERATION: 'ADMIN' },
  commission: { OWNER_MANAGEMENT: 'OWNER', ADMIN_READ: 'ADMIN', ADMIN_FINANCIAL: 'ADMIN' },
  commissionPaymentRequest: { OWNER_MANAGEMENT: 'OWNER', ADMIN_READ: 'ADMIN', ADMIN_FINANCIAL: 'ADMIN' },
  report: { ADMIN_READ: 'MODERATION', ADMIN_MODERATION: 'MODERATION' },
  adminRequest: { ADMIN_READ: 'ADMIN', ADMIN_MODERATION: 'ADMIN' },
  orderAssistance: { OWNER_MANAGEMENT: 'VENDOR', ADMIN_READ: 'ADMIN', ADMIN_MODERATION: 'ADMIN' },
  vendorFeedback: { ADMIN_READ: 'MODERATION', ADMIN_MODERATION: 'MODERATION' },
  deliveryZone: { PUBLIC: 'CHECKOUT', CHECKOUT: 'CHECKOUT', SYSTEM: 'MANAGEMENT' },
  userReviewRestriction: { ADMIN_READ: 'MODERATION', ADMIN_MODERATION: 'MODERATION' },
});

const PUBLIC_ENTITY_TYPES = new Set(['user', 'vendor', 'product', 'giftFlow', 'review', 'category', 'deliveryZone']);
const VENDOR_OWNED_ENTITY_TYPES = new Set([
  'vendor', 'product', 'giftFlow', 'commission', 'commissionPaymentRequest',
  'orderAssistance', 'vendorDeliveryPricing', 'vendorActivity',
]);

export const ENTITY_ACCESS_BUILDERS = Object.freeze(entries);

export function buildEntityAccess({ entity, viewer, context, relationship }) {
  const entry = ENTITY_ACCESS_BUILDERS[entity?.entityType];
  if (!entry) return { canRead: false, ownership: {}, participation: {}, fields: {}, sections: {}, actionPrerequisites: {}, permissionSet: new Set() };
  const [builder, argumentName] = entry;
  const normalizedContext = CONTEXT_MAP[entity.entityType]?.[context] || context;
  const access = builder({ [argumentName]: entity, viewer, context: normalizedContext, relationship });
  const publicReduction = ['PUBLIC', 'SEARCH', 'SUMMARY'].includes(context) && !PUBLIC_ENTITY_TYPES.has(entity.entityType);
  return {
    canRead: publicReduction ? false : Boolean(access.canRead),
    ...access,
    ...(publicReduction ? { canRead: false, fields: {}, sections: {} } : {}),
    ownership: {
      isOwner: Boolean(access.isOwner || access.isSelf || access.isCustomer || access.isReporter || access.isSubmitter || access.isVendorOwner),
      isSelf: Boolean(access.isSelf),
      isCustomer: Boolean(access.isCustomer),
      isVendorOwner: Boolean(
        access.isVendorOwner
        || (VENDOR_OWNED_ENTITY_TYPES.has(entity.entityType) && access.isOwner)
      ),
    },
    participation: {
      isParticipatingVendor: Boolean(access.isParticipatingVendor || access.relationship?.isParticipatingVendor),
    },
    fields: access.fields || {},
    sections: access.sections || {},
    actionPrerequisites: access.actionPrerequisites || {},
    permissionSet: access.permissionSet || new Set(),
  };
}
