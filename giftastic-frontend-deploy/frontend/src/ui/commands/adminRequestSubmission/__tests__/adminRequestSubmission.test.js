import test from 'node:test'; import assert from 'node:assert/strict'; import { commandDraftToPayload, createCommandDraft } from '../../index.js';
test('admin request payload is centralized', () => assert.equal(commandDraftToPayload('adminRequestSubmission', createCommandDraft('adminRequestSubmission', { message: 'A'.repeat(50) })).ok, true));
