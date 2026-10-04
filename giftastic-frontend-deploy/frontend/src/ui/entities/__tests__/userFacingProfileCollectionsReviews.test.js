import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = (path) => fs.readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

test('profile keeps birthday out of the user-facing form', () => {
  const profile = source('pages/UserProfile.jsx');

  assert.doesNotMatch(profile, />Birthday</);
  assert.match(profile, /Instapay Refund Phone/);
  assert.match(profile, /Instapay Refund Name/);
});

test('collections support multiple selected categories and min/max prices', () => {
  const catalog = source('pages/ProductCatalog.jsx');

  assert.match(catalog, /categoryIds/);
  assert.match(catalog, /handleCategoryToggle/);
  assert.match(catalog, /selectedCategoryIds\.has\(String\(category\.id\)\)/);
  assert.match(catalog, /value=\{filters\.minPrice\}/);
  assert.match(catalog, /Number\(product\.currentPrice \?\? product\.price\) >= minPrice/);
  assert.match(catalog, /Number\(product\.currentPrice \?\? product\.price\) <= maxPrice/);
});

test('customer review UI shows ratings without moderation status or internal details', () => {
  const views = source('ui/entities/review/views/ReviewSemanticViews.jsx');
  const access = source('ui/entities/review/reviewAccess.js');

  assert.match(views, /<ReviewStars rating=\{entity\.rating\}/);
  assert.match(views, /\{rating\} \/ 5/);
  assert.match(views, /CustomerReviewDetails/);
  assert.match(views, /!access\?\.fields\?\.moderation && !access\?\.canModerate/);
  assert.doesNotMatch(views, /subtitlePath="status"/);
  assert.match(access, /status: canViewModeration \|\| canModerate/);
});

test('customer order views do not expose order assistance', () => {
  const access = source('ui/entities/order/orderAccess.js');

  assert.match(access, /assistance: context !== ORDER_CONTEXT\.CUSTOMER/);
});
