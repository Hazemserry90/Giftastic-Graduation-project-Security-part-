import {
  ENTITY_ENUM_VALUES, normalizeDate, normalizeDecimal, normalizeUrl, safeParseJson,
} from '../entities/shared/entityModel.js';
import { compareDecimals } from '../entities/shared/decimal.js';
import { PRODUCT_DETAIL_FIELDS } from '../entities/product/productModel.js';
import {
  getInstapayRefundDetailsError,
  normalizeInstapayRefundDetails,
} from '../../utils/contactValidation.js';

const command = (fields, required = [], endpoint = '') => Object.freeze({ fields: Object.freeze(fields), required: Object.freeze(required), endpoint });
const productDetailPayloadFields = PRODUCT_DETAIL_FIELDS.filter((field) => !['allowsEmbroidery', 'allowsPhotoUpload'].includes(field));

export const COMMAND_SCHEMAS = Object.freeze({
  productCreateEdit: command(['supplierId', 'name', 'price', 'pricingMode', 'stockQuantity', 'categoryIds', 'description', 'details', 'images'], ['supplierId', 'name', 'price', 'categoryIds', 'description'], 'ProductCreateRequest'),
  vendorProfile: command(['storeName', 'description', 'logoUrl', 'bannerUrl', 'contactEmail', 'contactPhone', 'address', 'websiteUrl', 'instagramUrl', 'facebookUrl', 'workingHours'], ['storeName'], 'VendorUpdateRequest'),
  vendorApplication: command(['storeName', 'description', 'logoUrl', 'bannerUrl', 'contactEmail', 'contactPhone', 'address', 'websiteUrl', 'instagramUrl', 'facebookUrl', 'workingHours'], [], 'VendorApplicationRequest'),
  giftFlowEditor: command(['name', 'description', 'imageUrl', 'configuration'], ['name', 'configuration'], 'CreateGiftFlowRequest/UpdateGiftFlowRequest'),
  checkout: command(['customerId', 'customerName', 'customerEmail', 'guestInfo', 'items', 'shippingAddress', 'paymentMethod', 'instapayPhoneNumber', 'instapayRefundPhoneNumber', 'instapayRefundName', 'deliveryZoneId'], ['items', 'paymentMethod', 'deliveryZoneId'], 'PlaceOrderRequest/GuestCheckoutRequest'),
  commissionProof: command(['message', 'proofImageUrl'], ['message'], 'SubmitPaymentRequest'),
  commissionRule: command(['type', 'supplierId', 'rate', 'startDate', 'endDate'], ['type', 'rate', 'startDate'], 'CreateRuleRequest'),
  reportSubmission: command(['reportType', 'reportedEntityId', 'reason', 'description'], ['reportType', 'reportedEntityId', 'reason'], 'CreateReportRequest'),
  reviewSubmission: command(['reviewType', 'entityId', 'rating', 'comment', 'isAnonymous', 'orderId'], ['reviewType', 'entityId', 'rating'], 'CreateReviewRequest'),
  feedbackSubmission: command(['vendorId', 'orderId', 'feedback'], ['vendorId', 'orderId', 'feedback'], 'CreateVendorFeedbackRequest'),
  reminder: command(['description', 'scheduledAt'], ['description', 'scheduledAt'], 'ReminderRequest'),
  reviewRestriction: command(['canComment', 'canReview', 'reason', 'expiresAt'], ['canComment', 'canReview', 'reason'], 'UpdateRestrictionRequest'),
  productDiscount: command(['discountPercentage', 'startDate', 'endDate'], ['discountPercentage'], 'SetDiscountRequest'),
  deliveryEstimate: command(['estimatedDeliveryDate', 'notes'], ['estimatedDeliveryDate'], 'UpdateDeliveryEstimateRequest'),
  deliveryDelay: command(['reason', 'newEstimatedDate'], ['reason', 'newEstimatedDate'], 'NotifyDelayRequest'),
  userProfile: command(['fullName', 'phoneNumber', 'birthday', 'instapayRefundPhoneNumber', 'instapayRefundName'], ['fullName'], 'UpdateUserProfileRequest'),
  userAddresses: command(['addresses'], ['addresses'], 'UpdateUserAddressesRequest'),
  adminRequestSubmission: command(['message'], ['message'], 'CreateAdminRequest'),
  categoryCreate: command(['categoryName'], ['categoryName'], 'CreateCategoryRequest'),
  notificationComposition: command(['target', 'targetId', 'title', 'message'], ['target', 'title', 'message'], 'SendNotificationRequest'),
  moderationDecision: command(['decision', 'notes', 'reason'], ['decision'], 'ModerationDecision'),
  giftFlowCartSelection: command(['flowId', 'flowName', 'selectedItems', 'notes', 'selections', 'selectedAt', 'groupId'], ['flowId', 'selectedItems', 'selectedAt', 'groupId'], 'CartItemMetadata'),
  assistanceMessage: command(['mode', 'message', 'resolved'], ['mode'], 'OrderAssistanceMessageRequest'),
});

const empty = (value) => value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
const validateUrlField = (draft, field, errors) => {
  if (!empty(draft[field]) && !normalizeUrl(draft[field]).ok) errors[field] = 'Invalid or unsafe URL';
};

const normalizeVendorLink = (value, { instagram = false } = {}) => {
  if (value === null || value === undefined) return value;
  const text = String(value).trim();
  if (!text) return '';
  if (/^https?:\/\//i.test(text) || /^\//.test(text)) return text;
  if (instagram && /^@?[a-z0-9._]+$/i.test(text)) {
    return `https://instagram.com/${text.replace(/^@/, '')}`;
  }
  return `https://${text.replace(/^\/+/, '')}`;
};

const normalizeVendorProfileLinks = (draft) => ({
  ...draft,
  websiteUrl: normalizeVendorLink(draft.websiteUrl),
  instagramUrl: normalizeVendorLink(draft.instagramUrl, { instagram: true }),
  facebookUrl: normalizeVendorLink(draft.facebookUrl),
});

export function createCommandDraft(name, initial = {}) {
  const definition = COMMAND_SCHEMAS[name];
  if (!definition) throw new TypeError(`Unknown command: ${name}`);
  return Object.fromEntries(definition.fields.map((field) => [field, Object.hasOwn(initial, field) ? initial[field] : '']));
}

export function validateCommandDraft(name, draft = {}) {
  const definition = COMMAND_SCHEMAS[name];
  if (!definition) throw new TypeError(`Unknown command: ${name}`);
  const errors = {};
  for (const field of definition.required) if (empty(draft[field])) errors[field] = 'Required';
  if (name === 'productCreateEdit') {
    const price = normalizeDecimal(draft.price);
    if (!empty(draft.price) && (!price.ok || price.value.startsWith('-') || price.value === '0')) errors.price = 'Must be a positive decimal';
    if (!empty(draft.pricingMode) && !['CUSTOMER_PRICE', 'GUARANTEED_VENDOR_PAYOUT'].includes(draft.pricingMode)) errors.pricingMode = 'Choose a pricing option';
    if (!empty(draft.stockQuantity) && !Number.isSafeInteger(draft.stockQuantity)) errors.stockQuantity = 'Must be a whole number';
    if (!empty(draft.images) && !Array.isArray(draft.images)) errors.images = 'Must be an image list';
    else if (Array.isArray(draft.images)) {
      draft.images.forEach((image, index) => {
        if (!image || typeof image !== 'object' || !normalizeUrl(image.url).ok) errors[`images.${index}.url`] = 'Invalid or unsafe URL';
        if (image?.primary !== undefined && typeof image.primary !== 'boolean') errors[`images.${index}.primary`] = 'Must be true or false';
        if (image?.displayOrder !== undefined && !Number.isSafeInteger(image.displayOrder)) errors[`images.${index}.displayOrder`] = 'Must be a whole number';
      });
    }
    if (!empty(draft.details) && (typeof draft.details !== 'object' || Array.isArray(draft.details))) errors.details = 'Must be Product Details';
    else if (draft.details?.gender && !ENTITY_ENUM_VALUES.product['details.gender'].includes(draft.details.gender)) errors['details.gender'] = 'Unknown target gender';
  }
  if (name === 'giftFlowEditor' && !empty(draft.configuration) && !safeParseJson(draft.configuration).ok) errors.configuration = 'Invalid configuration JSON';
  if (name === 'checkout') {
    if (empty(draft.customerId) && empty(draft.guestInfo)) errors.customerId = 'Customer or guest information is required';
    if (!empty(draft.customerId) && !empty(draft.guestInfo)) errors.guestInfo = 'Choose registered or guest checkout';
    if (!Array.isArray(draft.items) || draft.items.length === 0) errors.items = 'At least one item is required';
    else draft.items.forEach((item, index) => {
      if (!item?.productId || !['string', 'number'].includes(typeof item.productId)) errors[`items.${index}.productId`] = 'Product is required';
      if (!Number.isSafeInteger(item?.quantity) || item.quantity <= 0) errors[`items.${index}.quantity`] = 'Quantity must be a positive whole number';
    });
    if (draft.paymentMethod === 'INSTAPAY') {
      const refundError = getInstapayRefundDetailsError(draft.instapayRefundPhoneNumber, draft.instapayRefundName);
      if (refundError.includes('phone')) errors.instapayRefundPhoneNumber = refundError;
      else if (refundError) errors.instapayRefundName = refundError;
    }
  }
  if (name === 'vendorProfile' && !empty(draft.contactPhone) && !/^[0-9]+$/.test(String(draft.contactPhone))) {
    errors.contactPhone = 'Use numbers only';
  }
  if (name === 'commissionRule') {
    if (!ENTITY_ENUM_VALUES.commissionRule.type.includes(draft.type)) errors.type = 'Unknown rule type';
    if (draft.type === 'SUPPLIER_SPECIFIC' && empty(draft.supplierId)) errors.supplierId = 'Supplier is required';
    if (!empty(draft.rate) && !normalizeDecimal(draft.rate).ok) errors.rate = 'Invalid decimal';
    if (!empty(draft.startDate) && !normalizeDate(draft.startDate).ok) errors.startDate = 'Invalid ISO date-time';
    if (!empty(draft.endDate) && !normalizeDate(draft.endDate).ok) errors.endDate = 'Invalid ISO date-time';
  }
  if (name === 'reportSubmission' && !ENTITY_ENUM_VALUES.report.reportType.includes(draft.reportType)) errors.reportType = 'Unknown report type';
  if (name === 'reviewSubmission') {
    if (!ENTITY_ENUM_VALUES.review.reviewType.includes(draft.reviewType)) errors.reviewType = 'Unknown review type';
    const rating = normalizeDecimal(draft.rating);
    if (!rating.ok || compareDecimals(rating.value, '1') < 0 || compareDecimals(rating.value, '5') > 0) errors.rating = 'Rating must be between 1 and 5';
    if (typeof draft.isAnonymous !== 'boolean') errors.isAnonymous = 'Must be true or false';
  }
  if (name === 'reminder' && !empty(draft.scheduledAt) && !normalizeDate(draft.scheduledAt).ok) {
    errors.scheduledAt = 'Invalid ISO date-time';
  }
  if (name === 'reviewRestriction') {
    if (typeof draft.canComment !== 'boolean') errors.canComment = 'Must be true or false';
    if (typeof draft.canReview !== 'boolean') errors.canReview = 'Must be true or false';
    if (!empty(draft.expiresAt) && !normalizeDate(draft.expiresAt).ok) errors.expiresAt = 'Invalid ISO date-time';
  }
  if (name === 'productDiscount') {
    const percentage = normalizeDecimal(draft.discountPercentage);
    if (!percentage.ok || compareDecimals(percentage.value, '0') < 0 || compareDecimals(percentage.value, '100') > 0) {
      errors.discountPercentage = 'Discount must be between 0 and 100';
    }
    if (!empty(draft.startDate) && !normalizeDate(draft.startDate).ok) errors.startDate = 'Invalid ISO date-time';
    if (!empty(draft.endDate) && !normalizeDate(draft.endDate).ok) errors.endDate = 'Invalid ISO date-time';
  }
  if (name === 'deliveryEstimate' && !empty(draft.estimatedDeliveryDate) && !normalizeDate(draft.estimatedDeliveryDate).ok) {
    errors.estimatedDeliveryDate = 'Invalid ISO date-time';
  }
  if (name === 'deliveryDelay' && !empty(draft.newEstimatedDate) && !normalizeDate(draft.newEstimatedDate).ok) {
    errors.newEstimatedDate = 'Invalid ISO date-time';
  }
  if (name === 'userProfile') {
    if (!empty(draft.phoneNumber) && !/^\+?[0-9\s-]{8,}$/.test(draft.phoneNumber)) errors.phoneNumber = 'Invalid phone number';
    if (!empty(draft.birthday) && !/^\d{4}-\d{2}-\d{2}$/.test(draft.birthday)) errors.birthday = 'Invalid date';
    if (!empty(draft.instapayRefundPhoneNumber) || !empty(draft.instapayRefundName)) {
      const refundError = getInstapayRefundDetailsError(draft.instapayRefundPhoneNumber, draft.instapayRefundName);
      if (refundError.includes('phone')) errors.instapayRefundPhoneNumber = refundError;
      else if (refundError) errors.instapayRefundName = refundError;
    }
  }
  if (name === 'userAddresses') {
    if (!Array.isArray(draft.addresses)) errors.addresses = 'Expected address list';
    else draft.addresses.forEach((address, index) => {
      if (!address?.street?.trim()) errors[`addresses.${index}.street`] = 'Street is required';
      if (!address?.city?.trim()) errors[`addresses.${index}.city`] = 'City is required';
    });
  }
  if (name === 'adminRequestSubmission') {
    const length = String(draft.message || '').trim().length;
    if (length < 50 || length > 1000) errors.message = 'Message must be between 50 and 1000 characters';
  }
  if (name === 'categoryCreate' && !String(draft.categoryName || '').trim()) errors.categoryName = 'Category name is required';
  if (name === 'notificationComposition') {
    const targets = ['ALL_USERS', 'ALL_ADMINS', 'SPECIFIC_USER', 'SPECIFIC_ADMIN'];
    if (!targets.includes(draft.target)) errors.target = 'Unknown notification target';
    if (draft.target?.startsWith('SPECIFIC_') && empty(draft.targetId)) errors.targetId = 'Target user is required';
  }
  if (name === 'moderationDecision') {
    if (!['APPROVE', 'REJECT', 'INVALIDATE'].includes(draft.decision)) errors.decision = 'Unknown moderation decision';
    if (draft.decision === 'REJECT' && empty(draft.reason) && empty(draft.notes)) errors.reason = 'A rejection reason is required';
  }
  if (name === 'giftFlowCartSelection') {
    if (!Array.isArray(draft.selectedItems) || draft.selectedItems.length === 0) errors.selectedItems = 'At least one selected product is required';
    if (!empty(draft.selectedAt) && !normalizeDate(draft.selectedAt).ok) errors.selectedAt = 'Invalid selection timestamp';
  }
  if (name === 'assistanceMessage') {
    if (!['REQUEST', 'REPLY', 'RESOLUTION'].includes(draft.mode)) errors.mode = 'Unknown assistance message mode';
    if (['REQUEST', 'REPLY'].includes(draft.mode) && empty(String(draft.message || '').trim())) errors.message = 'Message is required';
    if (draft.mode === 'RESOLUTION' && typeof draft.resolved !== 'boolean') errors.resolved = 'Resolution state is required';
  }
  ['logoUrl', 'bannerUrl', 'websiteUrl', 'instagramUrl', 'facebookUrl', 'imageUrl', 'proofImageUrl'].forEach((field) => {
    if (definition.fields.includes(field)) validateUrlField(draft, field, errors);
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

const cleanObject = (value) => Object.fromEntries(Object.entries(value || {}).filter(([, child]) => child !== undefined));

export function commandDraftToPayload(name, draft) {
  const definition = COMMAND_SCHEMAS[name];
  const normalizedDraft = name === 'vendorProfile' ? normalizeVendorProfileLinks(draft) : draft;
  const validation = validateCommandDraft(name, normalizedDraft);
  if (!validation.valid) return { ok: false, errors: validation.errors };
  const payload = Object.fromEntries(definition.fields.filter((field) => Object.hasOwn(normalizedDraft, field)).map((field) => [field, normalizedDraft[field]]));
  if (name === 'productCreateEdit') {
    payload.price = normalizeDecimal(payload.price).value;
    payload.details = Object.fromEntries(productDetailPayloadFields.filter((field) => Object.hasOwn(payload.details || {}, field)).map((field) => [field, payload.details[field]]));
    payload.images = (payload.images || []).map((image) => cleanObject({ url: image.url, primary: image.primary, displayOrder: image.displayOrder }));
  }
  if (name === 'commissionRule') payload.rate = normalizeDecimal(payload.rate).value;
  if (name === 'reviewSubmission') payload.rating = normalizeDecimal(payload.rating).value;
  if (name === 'productDiscount') payload.discountPercentage = normalizeDecimal(payload.discountPercentage).value;
  if (name === 'checkout') {
    if (payload.customerId) delete payload.guestInfo;
    else {
      delete payload.customerId; delete payload.customerName; delete payload.customerEmail; delete payload.shippingAddress;
    }
    if (payload.paymentMethod === 'INSTAPAY') {
      const refundDetails = normalizeInstapayRefundDetails(payload.instapayRefundPhoneNumber, payload.instapayRefundName);
      payload.instapayRefundPhoneNumber = refundDetails.phoneNumber;
      payload.instapayRefundName = refundDetails.name;
    }
  }
  if (name === 'userProfile' && (payload.instapayRefundPhoneNumber || payload.instapayRefundName)) {
    const refundDetails = normalizeInstapayRefundDetails(payload.instapayRefundPhoneNumber, payload.instapayRefundName);
    payload.instapayRefundPhoneNumber = refundDetails.phoneNumber;
    payload.instapayRefundName = refundDetails.name;
  }
  if (['vendorProfile', 'userProfile', 'adminRequestSubmission', 'categoryCreate', 'notificationComposition', 'moderationDecision', 'assistanceMessage'].includes(name)) {
    Object.keys(payload).forEach((field) => {
      if (typeof payload[field] === 'string') payload[field] = payload[field].trim();
    });
  }
  if (name === 'notificationComposition' && !payload.target?.startsWith('SPECIFIC_')) payload.targetId = null;
  return { ok: true, payload };
}

export function mapCartToOrderDraft(cart, values = {}) {
  return createCommandDraft('checkout', {
    ...values,
    customerId: values.customerId ?? cart?.customerId ?? '',
    items: (cart?.items || []).map((item) => cleanObject({
      productId: item.productId, productName: item.productName, imageUrl: item.imageUrl,
      quantity: item.quantity, price: item.price, supplierId: item.supplierId,
      groupId: item.groupId, metadata: item.metadata,
    })),
  });
}

export function mapGiftFlowCartItems(initial) {
  const draft = createCommandDraft('giftFlowCartSelection', initial);
  const mapped = commandDraftToPayload('giftFlowCartSelection', draft);
  if (!mapped.ok) return mapped;
  const { flowId, flowName, selectedItems, notes, selections, selectedAt, groupId } = mapped.payload;
  return {
    ok: true,
    payload: selectedItems.map((item, index) => ({
      productId: item.productId,
      quantity: item.count,
      groupId,
      metadata: JSON.stringify({
        flowId,
        flowName,
        flowStepId: item.stepId,
        flowStepTitle: item.stepTitle,
        selectedAt,
        ...(index === 0 ? { notes, selections } : {}),
      }),
    })),
  };
}

export function serializeCartMetadata(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') return safeParseJson(value).ok ? value : null;
  try { return JSON.stringify(value); } catch { return null; }
}
