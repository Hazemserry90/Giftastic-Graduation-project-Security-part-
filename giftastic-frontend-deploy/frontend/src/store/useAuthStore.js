import { create } from 'zustand';
import { authService } from '../services/authService';
import { favoriteService } from '../services/favoriteService';
import { useCartStore } from './useCartStore';
import { createViewer } from '../ui/entities/shared/viewer';
import { AUTH_SESSION_CLEARED_EVENT } from '../services/api';

const initialSession = authService.getSession();

const sessionState = (session) => ({
  user: session.user,
  viewer: session.viewer,
  isAuthenticated: session.isAuthenticated,
});

export const useAuthStore = create((set) => ({
  ...sessionState(initialSession),

  syncSession: () => {
    const session = authService.getSession();
    set(sessionState(session));
    if (session.isAuthenticated && session.viewer.userId) {
      useCartStore.getState().fetchCart(session.viewer.userId).catch(() => {});
    } else {
      useCartStore.getState().fetchCart().catch(() => {});
    }
    return session;
  },

  login: async (email, password, options = {}) => {
    const data = await authService.login(email, password, options);
    const state = { user: data.user, viewer: data.viewer, isAuthenticated: true };
    set(state);
    await favoriteService.syncGuestFavorites().catch(() => {});
    if (data.viewer.userId) useCartStore.getState().fetchCart(data.viewer.userId).catch(() => {});
    return data;
  },

  register: async (userData) => {
    const data = await authService.register(userData);
    const state = { user: data.user, viewer: data.viewer, isAuthenticated: true };
    set(state);
    await favoriteService.syncGuestFavorites().catch(() => {});
    if (data.viewer.userId) useCartStore.getState().fetchCart(data.viewer.userId).catch(() => {});
    return data;
  },

  logout: () => {
    authService.logout();
    set(sessionState(authService.getSession()));
    useCartStore.setState({ cart: null, loading: false, error: null });
  },

  updateUser: (user) => {
    authService.setCurrentUser(user, useAuthStore.getState().viewer);
    set(sessionState(authService.getSession()));
  },

  hydrateAdminFacet: (adminProfile) => {
    const current = useAuthStore.getState();
    const viewer = createViewer(current.user || {}, adminProfile);
    authService.setCurrentUser(current.user, viewer);
    const session = authService.getSession();
    set(sessionState(session));
    return session.viewer;
  },
}));

const syncSessionFromStorage = () => {
  const session = authService.getSession();
  useAuthStore.setState(sessionState(session));
  if (!session.isAuthenticated) useCartStore.setState({ cart: null, loading: false, error: null });
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'token' || event.key === 'user' || event.key === null) {
      syncSessionFromStorage();
    }
  });
  window.addEventListener(AUTH_SESSION_CLEARED_EVENT, syncSessionFromStorage);
}
