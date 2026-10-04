import test from 'node:test'; import assert from 'node:assert/strict'; import { commandDraftToPayload, createCommandDraft } from '../../index.js';
test('notification payload is centralized', () => assert.equal(commandDraftToPayload('notificationComposition', createCommandDraft('notificationComposition', { target: 'ALL_USERS', title: 'Title', message: 'Message' })).ok, true));
