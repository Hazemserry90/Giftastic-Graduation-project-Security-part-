import { buildUserActions } from '../user/userActions.js';
import { buildVendorActions } from '../vendor/vendorActions.js';
import { buildProductActions } from '../product/productActions.js';
import { buildOrderActions } from '../order/orderActions.js';
import { buildGiftFlowActions } from '../giftFlow/giftFlowActions.js';
import { buildCartActions } from '../cart/cartActions.js';
import { buildReviewActions } from '../review/reviewActions.js';
import { buildCategoryActions } from '../category/categoryActions.js';
import { buildVendorApplicationActions } from '../vendorApplication/vendorApplicationActions.js';
import { buildCommissionActions } from '../commission/commissionActions.js';
import { buildCommissionPaymentRequestActions } from '../commissionPaymentRequest/commissionPaymentRequestActions.js';
import { buildCommissionRuleActions } from '../commissionRule/commissionRuleActions.js';
import { buildReportActions } from '../report/reportActions.js';
import { buildAdminRequestActions } from '../adminRequest/adminRequestActions.js';
import { buildOrderAssistanceActions } from '../orderAssistance/orderAssistanceActions.js';
import { buildNotificationActions } from '../notification/notificationActions.js';
import { buildVendorFeedbackActions } from '../vendorFeedback/vendorFeedbackActions.js';
import { buildDeliveryZoneActions } from '../deliveryZone/deliveryZoneActions.js';
import { buildVendorDeliveryPricingActions } from '../vendorDeliveryPricing/vendorDeliveryPricingActions.js';
import { buildReminderActions } from '../reminder/reminderActions.js';
import { buildVendorActivityActions } from '../vendorActivity/vendorActivityActions.js';
import { buildUserReviewRestrictionActions } from '../userReviewRestriction/userReviewRestrictionActions.js';
import { buildFavoriteActions } from '../favorite/favoriteActions.js';

const entries = {
  user: [buildUserActions, 'user'], vendor: [buildVendorActions, 'vendor'], product: [buildProductActions, 'product'],
  order: [buildOrderActions, 'order'], giftFlow: [buildGiftFlowActions, 'flow'], cart: [buildCartActions, 'cart'],
  review: [buildReviewActions, 'review'], category: [buildCategoryActions, 'category'],
  vendorApplication: [buildVendorApplicationActions, 'application'], commission: [buildCommissionActions, 'commission'],
  commissionPaymentRequest: [buildCommissionPaymentRequestActions, 'request'], commissionRule: [buildCommissionRuleActions, 'rule'],
  report: [buildReportActions, 'report'], adminRequest: [buildAdminRequestActions, 'request'],
  orderAssistance: [buildOrderAssistanceActions, 'request'], notification: [buildNotificationActions, 'notification'],
  vendorFeedback: [buildVendorFeedbackActions, 'feedback'], deliveryZone: [buildDeliveryZoneActions, 'zone'],
  vendorDeliveryPricing: [buildVendorDeliveryPricingActions, 'pricing'], reminder: [buildReminderActions, 'reminder'],
  vendorActivity: [buildVendorActivityActions, 'activity'], userReviewRestriction: [buildUserReviewRestrictionActions, 'restriction'],
  favorite: [buildFavoriteActions, 'favorite'],
};

export const ENTITY_ACTION_BUILDERS = Object.freeze(entries);

export function normalizeEntityAction(action) {
  if (!action || typeof action.onSelect !== 'function') return null;
  const fallbackLabel = String(action.key || 'action')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (character) => character.toUpperCase());
  return {
    key: action.key,
    label: action.label || fallbackLabel,
    intent: action.intent || action.tone || 'primary',
    confirmation: action.confirmation ?? null,
    disabledReason: action.disabledReason ?? null,
    onSelect: action.onSelect,
  };
}

export function buildEntityActions({ entity, access, handlers = {}, supportedActions }) {
  const entry = ENTITY_ACTION_BUILDERS[entity?.entityType];
  if (!entry) return [];
  const [builder, argumentName] = entry;
  return builder({ [argumentName]: entity, access, handlers, supportedActions })
    .map(normalizeEntityAction).filter(Boolean);
}
