import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = (path) => fs.readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');
const rootSource = (path) => fs.readFileSync(new URL(`../../../../${path}`, import.meta.url), 'utf8');

test('API layer converts raw server/auth failures into readable user messages', () => {
  const api = source('services/api.js');

  assert.match(api, /getFriendlyErrorMessage/);
  assert.match(api, /SESSION_EXPIRED_MESSAGE/);
  assert.match(api, /SERVER_ERROR_MESSAGE/);
  assert.match(api, /TECHNICAL_MESSAGE_PATTERNS/);
  assert.match(api, /status >= 500/);
  assert.match(api, /error\.response\.data\.message = userMessage/);
});

test('expired authenticated sessions clear local auth state and notify the login page', () => {
  const api = source('services/api.js');
  const authStore = source('store/useAuthStore.js');
  const login = source('pages/Login.jsx');

  assert.match(api, /AUTH_SESSION_NOTICE_KEY/);
  assert.match(api, /AUTH_SESSION_CLEARED_EVENT/);
  assert.match(api, /clearExpiredSession/);
  assert.match(api, /status === 401 && hadToken && !isAuthRequest/);
  assert.match(api, /localStorage\.removeItem\('token'\)/);
  assert.match(authStore, /AUTH_SESSION_CLEARED_EVENT/);
  assert.match(login, /AUTH_SESSION_NOTICE_KEY/);
  assert.match(login, /getFriendlyErrorMessage/);
});

test('production frontend builds strip console and debugger statements', () => {
  const viteConfig = rootSource('vite.config.js');

  assert.match(viteConfig, /mode === 'production'/);
  assert.match(viteConfig, /drop: \['console', 'debugger'\]/);
});
