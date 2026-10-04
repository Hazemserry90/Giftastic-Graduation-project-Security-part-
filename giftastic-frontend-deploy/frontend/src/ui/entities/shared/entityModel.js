export const ENTITY_FIELD_STATE = Object.freeze({
  AVAILABLE: 'available',
  EMPTY: 'empty',
  UNLOADED: 'unloaded',
  INVALID: 'invalid',
  FORBIDDEN: 'forbidden',
});

export const ENTITY_SCHEMA_VERSION = 1;
export const ENTITY_ENUM_VALUES = Object.freeze({
  product: { status: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'DISABLED'], reviewRequestStatus: ['PENDING', 'APPROVED', 'REJECTED'], pricingMode: ['CUSTOMER_PRICE', 'GUARANTEED_VENDOR_PAYOUT'], 'details.gender': ['MALE', 'FEMALE', 'UNISEX', 'CHILD'] },
  order: { status: ['PENDING_CONFIRMATION', 'IN_PROGRESS', 'OUT_FOR_DELIVERY', 'DONE', 'INVALID', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] },
  review: { status: ['APPROVED', 'PENDING_REVIEW', 'REJECTED'], reviewType: ['PRODUCT', 'VENDOR'] },
  vendorApplication: { status: ['PENDING', 'APPROVED', 'REJECTED'] },
  commission: { status: ['PENDING', 'PAYMENT_SUBMITTED', 'PAID', 'OVERDUE'] },
  commissionPaymentRequest: { status: ['PENDING', 'APPROVED', 'REJECTED'] },
  commissionRule: { type: ['GLOBAL', 'SUPPLIER_SPECIFIC'] },
  report: { status: ['PENDING', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED', 'RESOLVED'], reportType: ['PRODUCT', 'GIFT_FLOW', 'USER', 'VENDOR', 'ADMIN'], outcomeType: ['RESOLVED', 'ACTION_TAKEN'] },
  adminRequest: { status: ['PENDING', 'APPROVED', 'REJECTED', 'INVALIDATED'] },
  orderAssistance: { status: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
  vendorFeedback: { status: ['APPROVED', 'PENDING_REVIEW', 'REJECTED'] },
  notification: { type: ['ORDER_STATUS_UPDATE', 'PROMOTION', 'REMINDER', 'VENDOR_ALERT', 'SYSTEM_ALERT', 'REVIEW_REQUEST', 'DELIVERY_DELAY', 'DELIVERY_ESTIMATE_UPDATE'] },
  vendorActivity: { activityType: ['ORDER_RECEIVED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELLED', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_APPROVED', 'PRODUCT_REJECTED', 'PRODUCT_STOCK_UPDATED', 'PRODUCT_OUT_OF_STOCK', 'REVIEW_RECEIVED', 'FEEDBACK_RECEIVED', 'DELIVERY_PRICING_UPDATED', 'GIFT_FLOW_CREATED', 'GIFT_FLOW_UPDATED'] },
});

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
const IDENTITY_FIELDS = Object.freeze({
  vendor: ['supplierId'],
  vendorDeliveryPricing: ['vendorId', 'zoneId'],
  userReviewRestriction: ['userId'],
});

export function getEntityValue(model, path) {
  return String(path).split('.').reduce((value, key) => value?.[key], model);
}

function ensurePath(model, path) {
  const keys = String(path).split('.');
  const leaf = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') current[key] = {};
    return current[key];
  }, model);
  return { target, leaf };
}

export function createEntityModel(entityType, fields, source = 'unknown', options = {}) {
  const model = {
    entityType,
    schemaVersion: options.schemaVersion || ENTITY_SCHEMA_VERSION,
    identity: { id: null },
    data: {},
    relations: {},
    meta: {
      source,
      adapter: options.adapter || source,
      loadedFields: new Set(),
      derivedFields: new Set(),
      invalidFields: new Set(),
      isPartial: options.complete !== true,
      fetchedAt: options.fetchedAt || null,
      issues: [],
      unknownFields: [],
    },
  };
  fields.forEach((field) => {
    const { target, leaf } = ensurePath(model, field);
    if (!hasOwn(target, leaf)) target[leaf] = null;
  });
  return model;
}

export function setEntityValue(model, path, value) {
  const { target, leaf } = ensurePath(model, path);
  target[leaf] = value;
  model.meta.loadedFields.add(path);
  model.meta.derivedFields?.delete(path);
  model.meta.invalidFields?.delete(path);
  const identityFields = IDENTITY_FIELDS[model.entityType] || ['id'];
  if (identityFields.includes(path)) {
    if (identityFields.length === 1) model.identity.id = value == null ? null : String(value);
    else model.identity[path] = value == null ? null : String(value);
  }
  if (!String(path).startsWith('relations.') && !String(path).startsWith('meta.')) {
    const dataPath = ensurePath(model.data, path);
    dataPath.target[dataPath.leaf] = value;
  }
  return model;
}

export function setDerivedEntityValue(model, path, value) {
  const { target, leaf } = ensurePath(model, path);
  target[leaf] = value;
  model.meta.derivedFields ??= new Set();
  model.meta.derivedFields.add(path);
  model.meta.invalidFields?.delete(path);
  if (!String(path).startsWith('relations.') && !String(path).startsWith('meta.')) {
    const dataPath = ensurePath(model.data, path);
    dataPath.target[dataPath.leaf] = value;
  }
  return model;
}

export function unloadEntityField(model, path) {
  if (!model?.meta) return model;
  const { target, leaf } = ensurePath(model, path);
  target[leaf] = null;
  if (!String(path).startsWith('relations.') && !String(path).startsWith('meta.')) {
    const dataPath = ensurePath(model.data, path);
    dataPath.target[dataPath.leaf] = null;
  }
  model.meta.loadedFields?.delete(path);
  model.meta.derivedFields?.delete(path);
  model.meta.invalidFields?.delete(path);
  const identityFields = IDENTITY_FIELDS[model.entityType] || ['id'];
  if (identityFields.includes(path)) {
    if (identityFields.length === 1) model.identity.id = null;
    else model.identity[path] = null;
  }
  return model;
}

export function hasEntityIdentity(model) {
  if (!model?.entityType) return false;
  const identityFields = IDENTITY_FIELDS[model.entityType] || ['id'];
  return identityFields.every((path) => {
    const value = getEntityValue(model, path);
    return hasLoadedEntityField(model, path) && value !== null && value !== undefined && value !== '';
  });
}

export function addEntityIssue(model, {
  path,
  reason,
  severity = 'error',
  source = model?.meta?.source || 'unknown',
  value,
}) {
  const issue = { source, path, reason, severity };
  if (value !== undefined) issue.valueType = value === null ? 'null' : typeof value;
  model.meta.issues.push(issue);
  return issue;
}

export function markEntityFieldInvalid(model, path, value, reason, options = {}) {
  const { target, leaf } = ensurePath(model, path);
  target[leaf] = null;
  if (!String(path).startsWith('relations.') && !String(path).startsWith('meta.')) {
    const dataPath = ensurePath(model.data, path);
    dataPath.target[dataPath.leaf] = null;
  }
  if (options.derived) {
    model.meta.derivedFields ??= new Set();
    model.meta.derivedFields.add(path);
    model.meta.loadedFields.delete(path);
  } else {
    model.meta.loadedFields.add(path);
    model.meta.derivedFields?.delete(path);
  }
  model.meta.invalidFields.add(path);
  const issueOptions = { ...options };
  delete issueOptions.derived;
  addEntityIssue(model, { path, value, reason, ...issueOptions });
  return model;
}

export const markDerivedFieldInvalid = (model, path, value, reason, options = {}) =>
  markEntityFieldInvalid(model, path, value, reason, { ...options, derived: true });

export function hasLoadedEntityField(model, path) {
  return Boolean(model?.meta?.loadedFields?.has(path));
}

export function getEntityFieldState(model, path, allowed = true) {
  if (!allowed) return ENTITY_FIELD_STATE.FORBIDDEN;
  if (!hasLoadedEntityField(model, path) && !model?.meta?.derivedFields?.has(path)) return ENTITY_FIELD_STATE.UNLOADED;
  if (model?.meta?.invalidFields?.has(path)) return ENTITY_FIELD_STATE.INVALID;
  const value = getEntityValue(model, path);
  const empty = value === null || value === undefined || value === ''
    || (Array.isArray(value) && value.length === 0);
  return empty ? ENTITY_FIELD_STATE.EMPTY : ENTITY_FIELD_STATE.AVAILABLE;
}

export function readEntityField(model, path, allowed = true) {
  const state = getEntityFieldState(model, path, allowed);
  return {
    state,
    value: state === ENTITY_FIELD_STATE.AVAILABLE || state === ENTITY_FIELD_STATE.EMPTY
      ? getEntityValue(model, path)
      : undefined,
  };
}

export function patchEntityModel(model, values = {}) {
  if (!model?.entityType || !(model.meta?.loadedFields instanceof Set)) {
    throw new TypeError('Expected a canonical entity model');
  }
  const clone = (value) => {
    if (value instanceof Set) return new Set(value);
    if (Array.isArray(value)) return value.map(clone);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
    }
    return value;
  };
  const patched = clone(model);
  Object.entries(values).forEach(([path, value]) => setEntityValue(patched, path, value));
  patched.meta.source = `${model.meta.source}+local-mutation-result`;
  patched.meta.adapter = `${model.meta.adapter}+patchEntityModel`;
  return patched;
}

export function mergeEntityModels(base, incoming) {
  if (!base?.entityType) return incoming;
  if (!incoming?.entityType) return base;
  if (base.entityType !== incoming.entityType) {
    throw new TypeError(`Cannot merge ${base.entityType} with ${incoming.entityType}`);
  }
  const identityFields = IDENTITY_FIELDS[base.entityType] || ['id'];
  for (const path of identityFields) {
    const baseIdentity = getEntityValue(base, path);
    const incomingIdentity = getEntityValue(incoming, path);
    if (baseIdentity != null && incomingIdentity != null && String(baseIdentity) !== String(incomingIdentity)) {
      throw new TypeError(`Cannot merge different ${base.entityType} identities at ${path}`);
    }
  }
  const clone = (value) => {
    if (value instanceof Set) return new Set(value);
    if (Array.isArray(value)) return value.map(clone);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
    return value;
  };
  const merged = clone(base);
  for (const path of incoming.meta.loadedFields) setEntityValue(merged, path, getEntityValue(incoming, path));
  for (const path of incoming.meta.derivedFields || []) setDerivedEntityValue(merged, path, getEntityValue(incoming, path));
  merged.meta.source = `${base.meta.source}+${incoming.meta.source}`;
  merged.meta.adapter = `${base.meta.adapter}+${incoming.meta.adapter}`;
  merged.meta.isPartial = base.meta.isPartial && incoming.meta.isPartial;
  merged.meta.fetchedAt = incoming.meta.fetchedAt || base.meta.fetchedAt;
  merged.meta.issues = [...(base.meta.issues || []), ...(incoming.meta.issues || [])];
  merged.meta.unknownFields = [...new Set([...(base.meta.unknownFields || []), ...(incoming.meta.unknownFields || [])])];
  for (const path of incoming.meta.loadedFields) merged.meta.invalidFields.delete(path);
  for (const path of incoming.meta.invalidFields || []) merged.meta.invalidFields.add(path);
  return merged;
}

export function createEntityReference(entityType, id, snapshot) {
  const loaded = Boolean(snapshot);
  return {
    entityType,
    id: id == null ? null : String(id),
    ...(loaded ? { snapshot } : {}),
    loaded,
  };
}

export function safeParseJson(raw) {
  if (raw === null || raw === undefined || raw === '') return { ok: true, value: null };
  if (typeof raw === 'object') return { ok: true, value: raw };
  if (typeof raw !== 'string') return { ok: false, value: null, reason: 'Expected JSON string or object' };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, value: null, reason: 'Malformed JSON' };
  }
}

export function normalizeDecimal(value) {
  if (value === null || value === undefined || value === '') return { ok: true, value: null };
  if (typeof value !== 'string' && typeof value !== 'number') return { ok: false, value: null, reason: 'Expected decimal' };
  const text = String(value).trim();
  if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text)) return { ok: false, value: null, reason: 'Invalid decimal' };
  const negative = text.startsWith('-');
  const unsigned = negative ? text.slice(1) : text;
  const [whole, fraction] = unsigned.split('.');
  const normalizedWhole = whole.replace(/^0+(?=\d)/, '') || '0';
  return { ok: true, value: `${negative ? '-' : ''}${normalizedWhole}${fraction ? `.${fraction}` : ''}` };
}

export function normalizeDate(value, dateOnly = false) {
  if (value === null || value === undefined || value === '') return { ok: true, value: null };
  if (typeof value !== 'string') return { ok: false, value: null, reason: 'Expected ISO date string' };
  const pattern = dateOnly ? /^\d{4}-\d{2}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})?$/;
  if (!pattern.test(value) || Number.isNaN(Date.parse(dateOnly ? `${value}T00:00:00Z` : value))) {
    return { ok: false, value: null, reason: dateOnly ? 'Invalid ISO date' : 'Invalid ISO date-time' };
  }
  return { ok: true, value };
}

export function normalizeUrl(value, { allowRelative = true } = {}) {
  if (value === null || value === undefined || value === '') return { ok: true, value: null };
  if (typeof value !== 'string') return { ok: false, value: null, reason: 'Expected URL string' };
  if (allowRelative && /^\/(?!\/)/.test(value)) return { ok: true, value };
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol)
      ? { ok: true, value }
      : { ok: false, value: null, reason: 'Unsafe URL scheme' };
  } catch {
    return { ok: false, value: null, reason: 'Invalid URL' };
  }
}

export function normalizeEntityScalar(path, value, entityType) {
  if (value === null || value === undefined || value === '') return { ok: true, value: value ?? null };
  const allowedEnum = ENTITY_ENUM_VALUES[entityType]?.[path];
  if (allowedEnum && !allowedEnum.includes(value)) return { ok: false, value: null, reason: `Unknown ${path} enum value` };
  const leaf = String(path).split('.').at(-1);
  if (/^(id|userId|customerId|supplierId|vendorId|productId|flowId|orderId|commissionId|zoneId|deliveryZoneId|reviewedBy|createdBy|resolvedBy|restrictedBy|reportedEntityId|entityId|requestId|senderId|reporterId|relatedEntityId)$/.test(leaf)) {
    return ['string', 'number'].includes(typeof value) ? { ok: true, value: String(value) } : { ok: false, value: null, reason: 'Expected identifier' };
  }
  if (/^(is[A-Z]|has[A-Z]|allows[A-Z]|requires[A-Z]|contains[A-Z]|active|read|processed|commissionPaid|canComment|canReview|handmade|madeToOrder|customizable|primary|overdue|inStock)$/.test(leaf)) {
    return typeof value === 'boolean' ? { ok: true, value } : { ok: false, value: null, reason: 'Expected boolean' };
  }
  if (/^(quantity|stockQuantity|reviewCount|itemCount|minDeliveryDays|maxDeliveryDays|shelfLifeDays|displayOrder|count)$/.test(leaf)) {
    return Number.isSafeInteger(value) ? { ok: true, value } : { ok: false, value: null, reason: 'Expected safe integer' };
  }
  if (/^(price|currentPrice|customerOriginalPrice|estimatedVendorPayout|currentCommissionRate|total|totalAmount|deliveryCost|orderSubtotal|commissionRate|commissionAmount|rate|discountPercentage|averageRating|rating|contentScore|revenue)$/.test(leaf)) return normalizeDecimal(value);
  if (entityType === 'commissionRule' && /^(startDate|endDate)$/.test(leaf)) return normalizeDate(value);
  if (/^(birthday|startDate|endDate|dueDate|estimatedDeliveryDate|actualDeliveryDate)$/.test(leaf)) return normalizeDate(value, true);
  if (/^(createdAt|updatedAt|publishedAt|placedAt|paidAt|commissionPaidAt|submittedAt|reviewedAt|requestedAt|resolvedAt|scheduledAt|occurredAt|restrictedAt|expiresAt|addedAt|canReapplyAt)$/.test(leaf)) return normalizeDate(value);
  if (/^(url|logoUrl|bannerUrl|imageUrl|proofImageUrl|videoUrl|websiteUrl|instagramUrl|facebookUrl)$/.test(leaf)) return normalizeUrl(value);
  if (/^(addresses|items|images|categories|messages|permissions|productIds)$/.test(leaf)) {
    return Array.isArray(value) ? { ok: true, value } : { ok: false, value: null, reason: 'Expected array' };
  }
  return { ok: true, value };
}

export function adaptEntity(input, model, aliases, validators = {}) {
  const consumed = new Set();
  Object.entries(aliases).forEach(([path, names]) => {
    for (const name of names) {
      if (hasOwn(input, name)) {
        consumed.add(name);
        const validator = validators[path];
        const result = validator ? validator(input[name]) : normalizeEntityScalar(path, input[name], model.entityType);
        if (result.ok) setEntityValue(model, path, result.value);
        else markEntityFieldInvalid(model, path, input[name], result.reason || 'Invalid value');
        break;
      }
    }
  });
  model.meta.unknownFields = Object.keys(input || {}).filter((field) => !consumed.has(field));
  return model;
}

export function consumeEntitySourceField(model, field) {
  model.meta.unknownFields = (model.meta.unknownFields || []).filter((value) => value !== field);
}

export function buildEntityPermissionSet(viewer) {
  const set = new Set([
    ...(Array.isArray(viewer?.permissions) ? viewer.permissions : []),
    ...(Array.isArray(viewer?.facets?.admin?.permissions) ? viewer.facets.admin.permissions : []),
  ]);
  if (viewer?.isSuperAdmin || viewer?.facets?.admin?.isSuperAdmin) set.add('SUPER_ADMIN');
  return set;
}

export function hasEntityPermission(permissionSet, permission) {
  return permissionSet.has('SUPER_ADMIN') || permissionSet.has(permission);
}

export function getViewerUserId(viewer) {
  return viewer?.userId || viewer?.id || null;
}

export function getViewerSupplierId(viewer) {
  return viewer?.supplierId || viewer?.facets?.vendor?.supplierId || null;
}
