import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_EMAIL_DOMAINS,
  validateEmail,
  validatePassword,
} from './registrationValidation.js';

test('accepts each supported email provider case-insensitively', () => {
  for (const domain of ALLOWED_EMAIL_DOMAINS) {
    assert.equal(validateEmail(`User@${domain.toUpperCase()}`), '');
  }
});

test('rejects malformed and unsupported email providers', () => {
  assert.match(validateEmail('not-an-email'), /valid email/i);
  for (const domain of ['tempmail.com', 'mailinator.com', '10minutemail.com', 'random-domain.xyz']) {
    assert.match(validateEmail(`user@${domain}`), /Gmail/);
  }
});

test('accepts a strong password', () => {
  assert.equal(validatePassword('Test@1234'), '');
});

test('rejects passwords missing any required character class', () => {
  for (const password of ['test1234', 'TEST@1234', 'Testtest@', 'Test1234', 'Test 1234']) {
    assert.notEqual(validatePassword(password), '');
  }
});
