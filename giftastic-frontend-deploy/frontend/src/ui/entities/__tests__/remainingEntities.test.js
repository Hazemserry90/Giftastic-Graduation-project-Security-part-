import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptReport } from '../report/reportAdapters.js';
import { buildReportAccess, REPORT_CONTEXT } from '../report/reportAccess.js';
import { buildReportActions } from '../report/reportActions.js';
import { adaptOrderAssistance } from '../orderAssistance/orderAssistanceAdapters.js';
import { buildOrderAssistanceAccess, ORDER_ASSISTANCE_CONTEXT } from '../orderAssistance/orderAssistanceAccess.js';
import { buildOrderAssistanceActions } from '../orderAssistance/orderAssistanceActions.js';
import { getOrderAssistanceMessages } from '../orderAssistance/orderAssistanceSelectors.js';
import { adaptVendorFeedback } from '../vendorFeedback/vendorFeedbackAdapters.js';
import { buildVendorFeedbackAccess, VENDOR_FEEDBACK_CONTEXT } from '../vendorFeedback/vendorFeedbackAccess.js';
import { adaptDeliveryZone } from '../deliveryZone/deliveryZoneAdapters.js';
import { buildDeliveryZoneAccess, DELIVERY_ZONE_CONTEXT } from '../deliveryZone/deliveryZoneAccess.js';
import { adaptVendorDeliveryPricing } from '../vendorDeliveryPricing/vendorDeliveryPricingAdapters.js';
import { buildVendorDeliveryPricingAccess } from '../vendorDeliveryPricing/vendorDeliveryPricingAccess.js';
import { hasDeliveryPrice } from '../vendorDeliveryPricing/vendorDeliveryPricingSelectors.js';
import { adaptReminder } from '../reminder/reminderAdapters.js';
import { buildReminderAccess } from '../reminder/reminderAccess.js';
import { isActiveReminder } from '../reminder/reminderSelectors.js';
import { adaptVendorActivity } from '../vendorActivity/vendorActivityAdapters.js';
import { buildVendorActivityAccess } from '../vendorActivity/vendorActivityAccess.js';
import { adaptUserReviewRestriction } from '../userReviewRestriction/userReviewRestrictionAdapters.js';
import {
  buildUserReviewRestrictionAccess,
  USER_REVIEW_RESTRICTION_CONTEXT,
} from '../userReviewRestriction/userReviewRestrictionAccess.js';
import { getRestrictedCapabilities } from '../userReviewRestriction/userReviewRestrictionSelectors.js';
import { adaptFavorite } from '../favorite/favoriteAdapters.js';
import { buildFavoriteAccess } from '../favorite/favoriteAccess.js';
import { buildFavoriteActions } from '../favorite/favoriteActions.js';
import { getFavoriteTarget, isValidFavorite } from '../favorite/favoriteSelectors.js';

test('Report owner can read their report but only MANAGE_REPORTS can act', () => {
  const report = adaptReport({ id: 'r1', reporterId: 'u1', status: 'PENDING' });
  assert.equal(adaptReport(report), report);
  const owner = buildReportAccess({ report, viewer: { id: 'u1' }, context: REPORT_CONTEXT.OWNER });
  const manager = buildReportAccess({
    report,
    viewer: { permissions: ['MANAGE_REPORTS'] },
    context: REPORT_CONTEXT.MODERATION,
  });
  assert.equal(owner.canRead, true);
  assert.equal(owner.canManage, false);
  assert.deepEqual(buildReportActions({
    report, access: manager, handlers: { underReview() {}, resolve() {} },
  }).map((action) => action.key), ['underReview', 'resolve']);
});

test('Order Assistance is restricted to its exact Vendor or reviewing admin', () => {
  const request = adaptOrderAssistance({
    id: 'a1', supplierId: 'v1', status: 'PENDING',
    messages: [{ id: 'm1', senderRole: 'VENDOR', message: 'Help' }],
  });
  assert.equal(adaptOrderAssistance(request), request);
  assert.equal(request.messages[0].message, 'Help');
  assert.equal(getOrderAssistanceMessages(request).length, 1);
  assert.equal(buildOrderAssistanceAccess({
    request, viewer: { supplierId: 'other' }, context: ORDER_ASSISTANCE_CONTEXT.VENDOR,
  }).canRead, false);
  assert.equal(buildOrderAssistanceAccess({
    request,
    viewer: { permissions: ['REVIEW_ORDER_ASSISTANCE'] },
    context: ORDER_ASSISTANCE_CONTEXT.ADMIN,
  }).canResolve, true);
  const closed = adaptOrderAssistance({
    id: 'closed', supplierId: 'v1', status: 'CLOSED',
  });
  const closedAccess = buildOrderAssistanceAccess({
    request: closed,
    viewer: { supplierId: 'v1' },
    context: ORDER_ASSISTANCE_CONTEXT.VENDOR,
  });
  assert.equal(closedAccess.canReply, false);
  assert.deepEqual(buildOrderAssistanceActions({
    request: closed,
    access: closedAccess,
    handlers: { reply() {} },
  }), []);

  const resolved = adaptOrderAssistance({ id: 'resolved', supplierId: 'v1', status: 'RESOLVED' });
  const adminAccess = buildOrderAssistanceAccess({
    request: resolved,
    viewer: { permissions: ['REVIEW_ORDER_ASSISTANCE'] },
    context: ORDER_ASSISTANCE_CONTEXT.ADMIN,
  });
  assert.deepEqual(buildOrderAssistanceActions({
    request: resolved,
    access: adminAccess,
    handlers: { close() {}, resolve() {} },
  }), []);
});

test('Vendor Feedback remains private moderation data', () => {
  const feedback = adaptVendorFeedback({ id: 'f1', userId: 'u1', status: 'PENDING_REVIEW' });
  const viewer = buildVendorFeedbackAccess({
    feedback,
    viewer: { permissions: ['VIEW_REVIEWS'] },
    context: VENDOR_FEEDBACK_CONTEXT.MODERATION,
  });
  const moderator = buildVendorFeedbackAccess({
    feedback,
    viewer: { permissions: ['VIEW_VENDOR_FEEDBACK'] },
    context: VENDOR_FEEDBACK_CONTEXT.MODERATION,
  });
  assert.equal(viewer.canRead, false);
  assert.equal(moderator.canRead, true);
});

test('Inactive Delivery Zones are excluded from checkout but available to management', () => {
  const zone = adaptDeliveryZone({ id: 'z1', zoneName: 'Zone', isActive: false });
  assert.equal(adaptDeliveryZone(zone), zone);
  assert.equal(buildDeliveryZoneAccess({ zone, context: DELIVERY_ZONE_CONTEXT.CHECKOUT }).canRead, false);
  assert.equal(buildDeliveryZoneAccess({ zone, context: DELIVERY_ZONE_CONTEXT.MANAGEMENT }).canRead, false);
  assert.equal(buildDeliveryZoneAccess({ zone, viewer: { isSuperAdmin: true }, context: DELIVERY_ZONE_CONTEXT.MANAGEMENT }).canRead, true);
});

test('Vendor Delivery Pricing is owner-managed', () => {
  const pricing = adaptVendorDeliveryPricing({ vendorId: 'v1', zoneId: 'z1', deliveryCost: 25 });
  assert.equal(adaptVendorDeliveryPricing(pricing), pricing);
  assert.equal(hasDeliveryPrice({ z1: 0 }, 'z1'), true);
  assert.equal(buildVendorDeliveryPricingAccess({ pricing, viewer: { supplierId: 'v1' } }).canManage, true);
  assert.equal(buildVendorDeliveryPricingAccess({ pricing, viewer: { supplierId: 'v2' } }).canRead, false);
});

test('Reminder and Vendor Activity are exact-owner records', () => {
  const reminder = adaptReminder({ id: 'rem1', customerId: 'u1', processed: false });
  const activity = adaptVendorActivity({ id: 'act1', vendorId: 'v1', metadata: '{"productId":"p1"}' });
  assert.equal(adaptReminder(reminder), reminder);
  assert.equal(adaptVendorActivity(activity), activity);
  assert.equal(isActiveReminder(reminder), true);
  assert.equal(buildReminderAccess({ reminder, viewer: { id: 'u1' } }).canRead, true);
  assert.equal(buildVendorActivityAccess({ activity, viewer: { supplierId: 'v1' } }).canRead, true);
  assert.equal(activity.parsedMetadata.productId, 'p1');
});

test('Review restriction separates self visibility from moderator mutation', () => {
  const restriction = adaptUserReviewRestriction({ userId: 'u1', canReview: false, expiresAt: null });
  assert.equal(adaptUserReviewRestriction(restriction), restriction);
  const self = buildUserReviewRestrictionAccess({
    restriction, viewer: { id: 'u1' }, context: USER_REVIEW_RESTRICTION_CONTEXT.SELF,
  });
  const moderator = buildUserReviewRestrictionAccess({
    restriction,
    viewer: { permissions: ['MUTE_USERS'] },
    context: USER_REVIEW_RESTRICTION_CONTEXT.MODERATION,
  });
  assert.equal(self.canRead, true);
  assert.equal(self.canManage, false);
  assert.equal(moderator.canManage, true);
  assert.deepEqual(getRestrictedCapabilities(restriction), [
    'You are currently restricted from submitting reviews',
  ]);
});

test('Favorite has exactly one target and is User-owned', () => {
  const favorite = adaptFavorite({ id: 'fav1', userId: 'u1', productId: 'p1', flowId: null });
  assert.equal(adaptFavorite(favorite), favorite);
  assert.equal(isValidFavorite(favorite), true);
  assert.deepEqual(getFavoriteTarget(favorite), { type: 'product', id: 'p1' });
  assert.equal(buildFavoriteAccess({ favorite, viewer: { id: 'u1' } }).canManage, true);
  assert.deepEqual(buildFavoriteActions({
    favorite,
    access: buildFavoriteAccess({ favorite, viewer: { id: 'u1' } }),
    handlers: { remove() {} },
  }).map((action) => action.key), ['remove']);
  assert.equal(isValidFavorite(adaptFavorite({ userId: 'u1', productId: 'p1', flowId: 'f1' })), false);
  const invalid = adaptFavorite({ userId: 'u1', productId: 'p1', flowId: 'f1' });
  assert.equal(invalid.meta.invalidFields.has('productId'), true);
  assert.equal(invalid.meta.invalidFields.has('flowId'), true);
});
