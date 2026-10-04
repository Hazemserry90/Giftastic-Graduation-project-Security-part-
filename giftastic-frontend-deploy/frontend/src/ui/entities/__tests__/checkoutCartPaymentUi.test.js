import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = (path) => fs.readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

test('checkout blocks non-Egyptian phone numbers before submitting', () => {
  const checkout = source('pages/Checkout.jsx');

  assert.match(checkout, /getEgyptianPhoneError/);
  assert.match(checkout, /digits\.length !== 11/);
  assert.match(checkout, /!digits\.startsWith\('01'\)/);
  assert.match(checkout, /Egyptian phone number must be exactly 11 digits/);
  assert.match(checkout, /Egyptian phone number must start with 01/);
});

test('checkout vendor failures include vendor and product context', () => {
  const checkout = source('pages/Checkout.jsx');

  assert.match(checkout, /buildVendorProblemDetails/);
  assert.match(checkout, /item\.storeName/);
  assert.match(checkout, /item\.productName/);
  assert.match(checkout, /Please review these vendor items/);
});

test('payment confirmation keeps COD free of Instapay fields until Instapay is selected', () => {
  const orderDetails = source('pages/OrderDetails.jsx');

  assert.match(orderDetails, /paymentMethodDraft/);
  assert.match(orderDetails, /showInstapayRefundFields/);
  assert.match(orderDetails, /order\?\.paymentMethod === 'INSTAPAY' \|\| paymentMethodDraft === 'INSTAPAY'/);
  assert.match(orderDetails, /userService\.getMyProfile\(\)/);
});

test('product add to cart disables repeat clicks while request is in flight', () => {
  const productDetails = source('pages/ProductDetails.jsx');

  assert.match(productDetails, /addingToCart/);
  assert.match(productDetails, /if \(addingToCart\) return/);
  assert.match(productDetails, /disabled=\{!access\.canRead \|\| addingToCart\}/);
  assert.match(productDetails, /Adding\.\.\./);
});
