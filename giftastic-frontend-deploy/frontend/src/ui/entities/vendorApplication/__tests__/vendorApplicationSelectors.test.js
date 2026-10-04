import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesVendorApplicationSearch } from '../vendorApplicationSelectors.js';

const application = {
  storeName: 'Cairo Gifts',
  contactEmail: 'hello@example.com',
  contactPhone: '01000000000',
  address: 'Alexandria',
};

test('vendor application search covers the pending application fields shown to admins', () => {
  assert.equal(matchesVendorApplicationSearch(application, 'cairo'), true);
  assert.equal(matchesVendorApplicationSearch(application, 'EXAMPLE'), true);
  assert.equal(matchesVendorApplicationSearch(application, 'alex'), true);
  assert.equal(matchesVendorApplicationSearch(application, 'missing'), false);
  assert.equal(matchesVendorApplicationSearch(application, ''), true);
});
