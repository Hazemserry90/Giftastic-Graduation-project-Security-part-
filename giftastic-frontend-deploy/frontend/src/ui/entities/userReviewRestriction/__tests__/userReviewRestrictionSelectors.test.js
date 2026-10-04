import test from 'node:test';
import assert from 'node:assert/strict';
import { isRestrictionReasonDirty } from '../userReviewRestrictionSelectors.js';

test('restriction dirty state changes only when the reason changes', () => {
  assert.equal(isRestrictionReasonDirty('Repeated spam', 'Repeated spam'), false);
  assert.equal(isRestrictionReasonDirty('Updated reason', 'Original reason'), true);
  assert.equal(isRestrictionReasonDirty('', null), false);
});
