import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = (path) => fs.readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

test('checkout pre-fills only saved Instapay refund details from the authenticated profile', () => {
  const checkout = source('pages/Checkout.jsx');

  assert.match(checkout, /userService\.getMyProfile\(\)/);
  assert.match(checkout, /instapayRefundPhoneNumber: read\('instapayRefundPhoneNumber'\) \|\| ''/);
  assert.match(checkout, /instapayRefundName: read\('instapayRefundName'\) \|\| ''/);
  assert.doesNotMatch(checkout, /transactionIds.*read\(|read\('transactionIds'\)/);
});

test('authenticated user profile contract preserves saved Instapay refund details', () => {
  const backendContract = source('ui/entities/shared/backendContract.js');
  const domainRegistry = source('ui/entities/shared/domainRegistry.js');
  const profile = source('pages/UserProfile.jsx');

  assert.match(backendContract, /instapayRefundPhoneNumber/);
  assert.match(backendContract, /instapayRefundName/);
  assert.match(domainRegistry, /instapayRefundPhoneNumber/);
  assert.match(domainRegistry, /instapayRefundName/);
  assert.match(profile, /read\('instapayRefundPhoneNumber'\) \|\| ''/);
  assert.match(profile, /read\('instapayRefundName'\) \|\| ''/);
  assert.match(profile, /userService\.updateMyInstapayRefundDetails/);
});

test('each new order-details view starts with empty Instapay transaction IDs', () => {
  const orderDetails = source('pages/OrderDetails.jsx');

  assert.match(orderDetails, /useState\(\['', '', '', ''\]\)/);
});
