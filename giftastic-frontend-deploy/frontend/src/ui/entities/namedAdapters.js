import { adaptUser, adaptAuthUser } from './user/userAdapters.js';
import { adaptVendor } from './vendor/vendorAdapters.js';
import { adaptProduct } from './product/productAdapters.js';
import { adaptOrder } from './order/orderAdapters.js';
import { adaptGiftFlow } from './giftFlow/giftFlowAdapters.js';
import { adaptCart } from './cart/cartAdapters.js';
import { adaptReview } from './review/reviewAdapters.js';
import { adaptCategory } from './category/categoryAdapters.js';
import { adaptVendorApplication } from './vendorApplication/vendorApplicationAdapters.js';
import { adaptCommission } from './commission/commissionAdapters.js';
import { adaptCommissionPaymentRequest } from './commissionPaymentRequest/commissionPaymentRequestAdapters.js';
import { adaptCommissionRule } from './commissionRule/commissionRuleAdapters.js';
import { adaptReport } from './report/reportAdapters.js';
import { adaptAdminRequest } from './adminRequest/adminRequestAdapters.js';
import { adaptOrderAssistance } from './orderAssistance/orderAssistanceAdapters.js';
import { adaptNotification } from './notification/notificationAdapters.js';
import { adaptVendorFeedback } from './vendorFeedback/vendorFeedbackAdapters.js';
import { adaptDeliveryZone } from './deliveryZone/deliveryZoneAdapters.js';
import { adaptVendorDeliveryPricing } from './vendorDeliveryPricing/vendorDeliveryPricingAdapters.js';
import { adaptReminder } from './reminder/reminderAdapters.js';
import { adaptVendorActivity } from './vendorActivity/vendorActivityAdapters.js';
import { adaptUserReviewRestriction } from './userReviewRestriction/userReviewRestrictionAdapters.js';
import { adaptFavorite } from './favorite/favoriteAdapters.js';
import { validateCanonicalModel } from './shared/modelValidation.js';
import {
  createEntityReference,
  getEntityFieldState,
  setEntityValue,
  unloadEntityField,
} from './shared/entityModel.js';
import { ENTITY_DOMAIN_SCHEMAS } from './shared/domainRegistry.js';
import { NAMED_SOURCE_CONTRACTS } from './namedSourceContracts.js';

const DERIVED_DEPENDENCIES = Object.freeze({
  user: {
    'facets.vendor.isVendor': ['facets.vendor.supplierId', 'facets.vendor.vendorId'],
    'facets.admin.isAdmin': ['facets.admin.permissions'],
    'facets.admin.isSuperAdmin': ['facets.admin.permissions'],
    'facets.admin.isCommunityHelper': ['facets.admin.permissions'],
  },
  giftFlow: { parsedConfiguration: ['configuration'], productIds: ['configuration'] },
  order: { parsedDeliveryCostBreakdown: ['deliveryCostBreakdown'] },
  notification: { parsedMetadata: ['metadata'], relatedEntity: ['metadata'] },
  commission: { overdue: ['dueDate'] },
  vendorActivity: { parsedMetadata: ['metadata'], relatedEntity: ['relatedEntityId', 'activityType'] },
  userReviewRestriction: { isActive: ['expiresAt'] },
});

function hasUsableDependency(model, path) {
  return ['available', 'empty'].includes(getEntityFieldState(model, path));
}

function derivedFieldIsSupported(model, path) {
  const dependencies = DERIVED_DEPENDENCIES[model.entityType]?.[path];
  if (dependencies) return dependencies.some((dependency) => hasUsableDependency(model, dependency));
  return [...model.meta.loadedFields].some((loaded) => path.startsWith(`${loaded}.`));
}

function enforceNamedSourceContract(name, model) {
  const contract = NAMED_SOURCE_CONTRACTS[name];
  if (!contract) throw new TypeError(`Missing named source contract: ${name}`);
  const allowed = new Set(contract.fields);
  const removed = [];
  for (const path of [...model.meta.loadedFields]) {
    if (!allowed.has(path) && ![...allowed].some((parent) => path.startsWith(`${parent}.`))) {
      removed.push(path);
      unloadEntityField(model, path);
    }
  }
  for (const path of [...(model.meta.derivedFields || [])]) {
    const definition = ENTITY_DOMAIN_SCHEMAS[model.entityType]?.fields?.[path];
    if (definition?.provenance !== 'DERIVED' || !derivedFieldIsSupported(model, path)) {
      removed.push(path);
      unloadEntityField(model, path);
    }
  }
  model.meta.unknownFields = [...new Set([...(model.meta.unknownFields || []), ...removed])];
  model.meta.isPartial = !contract.complete || contract.fields.some((path) => (
    !model.meta.loadedFields.has(path)
    && !model.meta.derivedFields.has(path)
    && !model.meta.invalidFields.has(path)
  ));
  return model;
}

const productEntityAdapter = (input, options) => {
  const model = adaptProduct(input, options);
  if (model.meta.loadedFields.has('categories') && Array.isArray(model.categories)) {
    setEntityValue(model, 'categories', model.categories.map((category) => (
      category?.entityType === 'category' && category?.meta?.loadedFields instanceof Set
        ? createEntityReference('category', category.id, category)
        : category
    )));
  }
  return model;
};

const productAnalyticsReferenceAdapter = (input, options) => productEntityAdapter({
  id: input?.id ?? input?.productId,
  name: input?.name ?? input?.productName,
}, options);

const vendorAnalyticsReferenceAdapter = (input, options) => adaptVendor({
  supplierId: input?.supplierId ?? input?.vendorId ?? input?.id,
  storeName: input?.storeName ?? input?.supplierName ?? input?.vendorStoreName,
}, options);

const define = (name, entityType, adapter, { complete = false } = {}) => {
  const fn = (input, options = {}) => (
    input?.entityType === entityType && input?.meta?.loadedFields instanceof Set
      ? input
      : enforceNamedSourceContract(name, validateCanonicalModel(adapter(input, { source: name, complete, ...options })))
  );
  Object.defineProperty(fn, 'name', { value: name });
  fn.entityType = entityType;
  fn.complete = complete;
  return fn;
};

const sources = [
  ['adaptUserDomain', 'user', adaptUser, true], ['adaptUserMe', 'user', adaptUser, true],
  ['adaptUserPublicProfile', 'user', adaptUser], ['adaptUserAdminRow', 'user', adaptUser],
  ['adaptUserAdminManagementRecord', 'user', adaptUser],
  ['adaptUserAnalyticsCustomerReference', 'user', adaptUser], ['adaptUserOrderCustomerSnapshot', 'user', adaptUser],
  ['adaptVendorDomain', 'vendor', adaptVendor, true], ['adaptVendorPublicListRecord', 'vendor', adaptVendor],
  ['adaptVendorMe', 'vendor', adaptVendor, true], ['adaptVendorUnifiedSearchResult', 'vendor', adaptVendor],
  ['adaptVendorAnalyticsReference', 'vendor', vendorAnalyticsReferenceAdapter],
  ['adaptProductDomain', 'product', productEntityAdapter, true], ['adaptProductSearchResult', 'product', productEntityAdapter],
  ['adaptProductUnifiedSearchResult', 'product', productEntityAdapter], ['adaptProductRecommendationReference', 'product', productEntityAdapter],
  ['adaptProductAnalyticsReference', 'product', productAnalyticsReferenceAdapter], ['adaptProductOrderItemSnapshot', 'product', productEntityAdapter],
  ['adaptProductCartItemSnapshot', 'product', productEntityAdapter],
  ['adaptOrderDomain', 'order', adaptOrder, true], ['adaptOrderCustomerListRecord', 'order', adaptOrder],
  ['adaptOrderVendorListRecord', 'order', adaptOrder], ['adaptOrderAdminListRecord', 'order', adaptOrder],
  ['adaptOrderSecurityProjection', 'order', adaptOrder], ['adaptOrderAnalyticsReference', 'order', adaptOrder],
  ['adaptGiftFlowDomain', 'giftFlow', adaptGiftFlow, true], ['adaptGiftFlowResponse', 'giftFlow', adaptGiftFlow],
  ['adaptGiftFlowUnifiedSearchResult', 'giftFlow', adaptGiftFlow], ['adaptGiftFlowFavoriteReference', 'giftFlow', adaptGiftFlow],
  ['adaptCartDomain', 'cart', adaptCart, true], ['adaptCartResponse', 'cart', adaptCart], ['adaptGuestCart', 'cart', adaptCart],
  ['adaptReviewDomain', 'review', adaptReview, true], ['adaptReviewPublicResponse', 'review', adaptReview],
  ['adaptReviewSelfResponse', 'review', adaptReview], ['adaptReviewModerationResponse', 'review', adaptReview],
  ['adaptCategoryDomain', 'category', adaptCategory, true], ['adaptCategoryListRecord', 'category', adaptCategory],
  ['adaptProductEmbeddedCategory', 'category', adaptCategory],
  ['adaptVendorApplicationDomain', 'vendorApplication', adaptVendorApplication, true], ['adaptVendorApplicationResponse', 'vendorApplication', adaptVendorApplication],
  ['adaptCommissionDomain', 'commission', adaptCommission, true], ['adaptCommissionDto', 'commission', adaptCommission],
  ['adaptCommissionPaymentRequestDomain', 'commissionPaymentRequest', adaptCommissionPaymentRequest, true], ['adaptCommissionPaymentRequestDto', 'commissionPaymentRequest', adaptCommissionPaymentRequest],
  ['adaptCommissionRuleDomain', 'commissionRule', adaptCommissionRule, true], ['adaptCommissionRuleDto', 'commissionRule', adaptCommissionRule],
  ['adaptReportDomain', 'report', adaptReport, true],
  ['adaptAdminRequestDomain', 'adminRequest', adaptAdminRequest, true], ['adaptAdminRequestDto', 'adminRequest', adaptAdminRequest],
  ['adaptOrderAssistanceDomain', 'orderAssistance', adaptOrderAssistance, true], ['adaptOrderAssistanceDto', 'orderAssistance', adaptOrderAssistance],
  ['adaptNotificationOwnerRecord', 'notification', adaptNotification],
  ['adaptVendorFeedbackDomain', 'vendorFeedback', adaptVendorFeedback, true], ['adaptVendorFeedbackResponse', 'vendorFeedback', adaptVendorFeedback],
  ['adaptDeliveryZoneDomain', 'deliveryZone', adaptDeliveryZone, true], ['adaptDeliveryZoneResponse', 'deliveryZone', adaptDeliveryZone],
  ['adaptVendorDeliveryPricingDomain', 'vendorDeliveryPricing', adaptVendorDeliveryPricing, true], ['adaptVendorDeliveryPricingResponse', 'vendorDeliveryPricing', adaptVendorDeliveryPricing],
  ['adaptReminderDomain', 'reminder', adaptReminder, true],
  ['adaptVendorActivityDomain', 'vendorActivity', adaptVendorActivity, true], ['adaptVendorActivityResponse', 'vendorActivity', adaptVendorActivity],
  ['adaptUserReviewRestrictionDomain', 'userReviewRestriction', adaptUserReviewRestriction, true], ['adaptUserReviewRestrictionResponse', 'userReviewRestriction', adaptUserReviewRestriction],
  ['adaptFavoriteDomain', 'favorite', adaptFavorite, true], ['adaptFavoriteLegacyRecord', 'favorite', adaptFavorite],
];

export const NAMED_ENTITY_ADAPTERS = Object.freeze(Object.fromEntries(
  sources.map(([name, entityType, adapter, complete]) => [name, define(name, entityType, adapter, { complete })]),
));

export const adaptUserAuthSession = Object.assign(
  (input) => {
    if (input?.entityType === 'user' && input?.meta?.loadedFields instanceof Set) return input;
    const model = adaptAuthUser(input);
    model.meta.source = 'adaptUserAuthSession';
    model.meta.adapter = 'adaptUserAuthSession';
    return enforceNamedSourceContract('adaptUserAuthSession', validateCanonicalModel(model));
  },
  { entityType: 'user', complete: false },
);

export function adaptEntityFromNamedSource(name, input, options) {
  if (name === 'adaptUserAuthSession') return adaptUserAuthSession(input, options);
  const adapter = NAMED_ENTITY_ADAPTERS[name];
  if (!adapter) throw new TypeError(`Unknown entity adapter: ${name}`);
  return adapter(input, options);
}

export function adaptEntityFromNamedSourceWithIdentity(name, input, identityField, identity, options) {
  const payload = input && Object.hasOwn(input, identityField) ? input : { ...(input || {}), [identityField]: identity };
  return adaptEntityFromNamedSource(name, payload, options);
}

export const ENTITY_ADAPTER_NAMES = Object.freeze([
  ...Object.keys(NAMED_ENTITY_ADAPTERS), 'adaptUserAuthSession',
]);
