import test from 'node:test'; import assert from 'node:assert/strict'; import { commandDraftToPayload, createCommandDraft } from '../../index.js';
test('user profile payload is centralized', () => assert.equal(commandDraftToPayload('userProfile', createCommandDraft('userProfile', { fullName: 'Omar' })).ok, true));
