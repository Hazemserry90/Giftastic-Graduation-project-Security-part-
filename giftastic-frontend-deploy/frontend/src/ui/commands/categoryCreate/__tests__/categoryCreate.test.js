import test from 'node:test'; import assert from 'node:assert/strict'; import { commandDraftToPayload, createCommandDraft } from '../../index.js';
test('category payload is centralized', () => assert.deepEqual(commandDraftToPayload('categoryCreate', createCommandDraft('categoryCreate', { categoryName: ' Gifts ' })).payload, { categoryName: 'Gifts' }));
