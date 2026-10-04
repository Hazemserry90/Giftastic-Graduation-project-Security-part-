import test from 'node:test'; import assert from 'node:assert/strict'; import { commandDraftToPayload, createCommandDraft } from '../../index.js';
test('assistance message payload is centralized', () => assert.equal(commandDraftToPayload('assistanceMessage', createCommandDraft('assistanceMessage', { mode: 'REPLY', message: 'We can help.' })).ok, true));
