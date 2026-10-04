import test from 'node:test'; import assert from 'node:assert/strict'; import { commandDraftToPayload, createCommandDraft } from '../../index.js';
test('moderation payload requires a rejection reason', () => assert.equal(commandDraftToPayload('moderationDecision', createCommandDraft('moderationDecision', { decision: 'REJECT' })).ok, false));
