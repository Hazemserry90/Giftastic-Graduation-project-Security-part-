import test from 'node:test'; import assert from 'node:assert/strict'; import { commandDraftToPayload, createCommandDraft } from '../../index.js';
test('user address payload is centralized', () => assert.equal(commandDraftToPayload('userAddresses', createCommandDraft('userAddresses', { addresses: [{ street: 'One', city: 'Alexandria' }] })).ok, true));
