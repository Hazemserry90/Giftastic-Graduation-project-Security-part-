import test from 'node:test'; import assert from 'node:assert/strict'; import { mapGiftFlowCartItems } from '../../index.js';
test('Gift Flow cart metadata is centralized', () => assert.equal(mapGiftFlowCartItems({ flowId: 'f1', selectedItems: [{ productId: 'p1', count: 1 }], selectedAt: '2026-07-01T12:00:00', groupId: 'g1' }).ok, true));
