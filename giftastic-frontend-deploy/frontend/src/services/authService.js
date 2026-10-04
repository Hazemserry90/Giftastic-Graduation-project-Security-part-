import api from './api';
import { viewerHasCapability } from '../ui/entities/shared/viewer';
import { adaptAuthenticationProjection } from '../ui/projections';
import {
  clearAuthSession,
  clearStoredUserPayload,
  getStoredToken,
  getStoredUserPayload,
  isJwtExpired,
  persistAuthSession,
  setStoredUserPayload,
} from './authStorage';

function safeParseUser(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    clearStoredUserPayload();
    return null;
  }
}

function assertUsableAuthResponse(data) {
  if (!data?.token || !data?.user) throw new Error('Authentication response is missing the canonical User session payload.');
  if (data.user.isBanned === true || data.user.banned === true) throw new Error('Account suspended. Please contact support.');
}

function canonicalSession(token, user) {
  const projection = adaptAuthenticationProjection({ token, user });
  const isAuthenticated = projection.data.hasToken && Boolean(projection.data.viewer.userId);
  return {
    user: isAuthenticated ? projection.data.user : null,
    viewer: projection.data.viewer,
    token,
    isAuthenticated,
  };
}

function sessionPayload(user, viewer = null) {
  if (user?.entityType !== 'user') {
    if (!viewer || !user) return user;
    return {
      ...user,
      supplierId: viewer.supplierId || user.supplierId || null,
      roles: viewer.roles || user.roles || [],
      permissions: viewer.permissions || user.permissions || [],
      isVendor: viewer.isVendor,
      isAdmin: viewer.isAdmin,
      isSuperAdmin: viewer.isSuperAdmin,
    };
  }
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isBanned: user.isBanned,
    supplierId: viewer?.supplierId || user.facets?.vendor?.supplierId || null,
    roles: viewer?.roles || [],
    permissions: viewer?.permissions || user.facets?.admin?.permissions || [],
    isVendor: viewer?.isVendor ?? Boolean(user.facets?.vendor?.supplierId),
    isAdmin: viewer?.isAdmin ?? Boolean(user.facets?.admin?.isAdmin),
    isSuperAdmin: viewer?.isSuperAdmin ?? Boolean(user.facets?.admin?.isSuperAdmin),
  };
}

export const authService = {
  async login(email, password, { remember = false } = {}) {
    const { data } = await api.post('/auth/login', { email, password });
    assertUsableAuthResponse(data);
    const session = canonicalSession(data.token, data.user);
    persistAuthSession({ token: data.token, user: sessionPayload(session.user, session.viewer), remember });
    return { ...data, ...session };
  },

  async register(userData) {
    const { data } = await api.post('/auth/register', userData);
    assertUsableAuthResponse(data);
    const session = canonicalSession(data.token, data.user);
    persistAuthSession({ token: data.token, user: sessionPayload(session.user, session.viewer), remember: false });
    return { ...data, ...session };
  },

  logout() {
    clearAuthSession();
  },

  getCurrentUser() {
    return safeParseUser(getStoredUserPayload());
  },

  getSession() {
    const token = getStoredToken();
    if (token && isJwtExpired(token)) {
      clearAuthSession();
      return canonicalSession(null, {});
    }
    const storedUser = this.getCurrentUser();
    return canonicalSession(token, token && storedUser ? storedUser : {});
  },

  setCurrentUser(user, viewer = null) {
    if (!user) clearStoredUserPayload();
    else setStoredUserPayload(sessionPayload(user, viewer));
  },

  isAuthenticated() {
    return this.getSession().isAuthenticated;
  },

  hasRole(requirement) {
    return viewerHasCapability(this.getSession().viewer, requirement);
  },
};
