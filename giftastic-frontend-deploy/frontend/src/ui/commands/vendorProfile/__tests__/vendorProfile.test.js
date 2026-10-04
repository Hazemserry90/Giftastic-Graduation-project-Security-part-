import { registerCommandContract } from '../../commandContractSuite.js';
registerCommandContract('vendorProfile');

import assert from 'node:assert/strict';
import test from 'node:test';
import { createVendorProfileDraft, mapVendorProfilePayload } from '../index.js';

test('vendor profile normalizes saved social shorthand without blocking banner updates', () => {
  const mapped = mapVendorProfilePayload(createVendorProfileDraft({
    storeName: 'Vendor',
    bannerUrl: 'https://example.test/wide-banner.jpg',
    websiteUrl: 'youtube.com',
    instagramUrl: 'youtube',
    facebookUrl: 'facebook.com/youtube',
  }));

  assert.equal(mapped.ok, true);
  assert.equal(mapped.payload.bannerUrl, 'https://example.test/wide-banner.jpg');
  assert.equal(mapped.payload.websiteUrl, 'https://youtube.com');
  assert.equal(mapped.payload.instagramUrl, 'https://instagram.com/youtube');
  assert.equal(mapped.payload.facebookUrl, 'https://facebook.com/youtube');
});

test('vendor profile still rejects an unsafe banner URL', () => {
  const mapped = mapVendorProfilePayload(createVendorProfileDraft({
    storeName: 'Vendor',
    bannerUrl: 'javascript:alert(1)',
  }));

  assert.equal(mapped.ok, false);
  assert.equal(mapped.errors.bannerUrl, 'Invalid or unsafe URL');
});
