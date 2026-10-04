export const AUTH_TOKEN_KEY = 'token';
export const AUTH_USER_KEY = 'user';
export const AUTH_PERSISTENCE_KEY = 'giftastic_auth_persistence';

const STORAGE_LOCAL = 'local';
const STORAGE_SESSION = 'session';

const storageFor = (kind) => (kind === STORAGE_LOCAL ? localStorage : sessionStorage);

export function getAuthStorageKind() {
  if (localStorage.getItem(AUTH_TOKEN_KEY)) return STORAGE_LOCAL;
  if (sessionStorage.getItem(AUTH_TOKEN_KEY)) return STORAGE_SESSION;
  return localStorage.getItem(AUTH_PERSISTENCE_KEY) === STORAGE_LOCAL ? STORAGE_LOCAL : STORAGE_SESSION;
}

export function getStoredToken() {
  return storageFor(getAuthStorageKind()).getItem(AUTH_TOKEN_KEY);
}

export function getStoredUserPayload() {
  return storageFor(getAuthStorageKind()).getItem(AUTH_USER_KEY);
}

export function persistAuthSession({ token, user, remember = false }) {
  clearAuthSession();
  const kind = remember ? STORAGE_LOCAL : STORAGE_SESSION;
  const target = storageFor(kind);
  if (user) target.setItem(AUTH_USER_KEY, JSON.stringify(user));
  if (token) target.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_PERSISTENCE_KEY, kind);
}

export function setStoredUserPayload(user) {
  const kind = getAuthStorageKind();
  const target = storageFor(kind);
  if (!user) target.removeItem(AUTH_USER_KEY);
  else target.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredUserPayload() {
  localStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
}

export function clearStoredToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_PERSISTENCE_KEY);
}

export function clearAuthSession() {
  clearStoredToken();
  localStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
}

function decodeJwtPayload(token) {
  const payload = String(token || '').split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isJwtExpired(token, skewSeconds = 30) {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}
