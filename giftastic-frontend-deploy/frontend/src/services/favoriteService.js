import api from './api';
import { getStoredToken, isJwtExpired } from './authStorage';

const GUEST_FAVORITES_KEY = 'giftastic_guest_favorites';

const hasToken = () => {
  const token = getStoredToken();
  return Boolean(token && !isJwtExpired(token));
};

function readGuestFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_FAVORITES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(GUEST_FAVORITES_KEY);
    return [];
  }
}

function writeGuestFavorites(favorites) {
  localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(favorites));
}

function createGuestFavorite(type, id) {
  const targetId = String(id);
  return {
    id: `guest-${type}-${targetId}`,
    userId: 'guest',
    productId: type === 'product' ? targetId : null,
    flowId: type === 'flow' ? targetId : null,
    addedAt: new Date().toISOString(),
  };
}

function upsertGuestFavorite(type, id) {
  const targetId = String(id);
  const field = type === 'product' ? 'productId' : 'flowId';
  const favorites = readGuestFavorites();
  const existing = favorites.find((favorite) => String(favorite[field] || '') === targetId);
  if (existing) return existing;
  const favorite = createGuestFavorite(type, targetId);
  writeGuestFavorites([favorite, ...favorites]);
  return favorite;
}

function removeGuestFavorite(type, id) {
  const targetId = String(id);
  const field = type === 'product' ? 'productId' : 'flowId';
  const favorites = readGuestFavorites().filter((favorite) => String(favorite[field] || '') !== targetId);
  writeGuestFavorites(favorites);
  return { success: true };
}

export const favoriteService = {
  getFavorites: async () => {
    if (!hasToken()) return readGuestFavorites();
    const response = await api.get('/favorites');
    return response.data;
  },
  addProductFavorite: async (productId) => {
    if (!hasToken()) return upsertGuestFavorite('product', productId);
    const response = await api.post(`/favorites/product/${productId}`);
    return response.data;
  },
  removeProductFavorite: async (productId) => {
    if (!hasToken()) return removeGuestFavorite('product', productId);
    const response = await api.delete(`/favorites/product/${productId}`);
    return response.data;
  },
  addFlowFavorite: async (flowId) => {
    if (!hasToken()) return upsertGuestFavorite('flow', flowId);
    const response = await api.post(`/favorites/flow/${flowId}`);
    return response.data;
  },
  removeFlowFavorite: async (flowId) => {
    if (!hasToken()) return removeGuestFavorite('flow', flowId);
    const response = await api.delete(`/favorites/flow/${flowId}`);
    return response.data;
  },
  syncGuestFavorites: async () => {
    if (!hasToken()) return;
    const favorites = readGuestFavorites();
    if (!favorites.length) return;
    const remaining = [];
    for (const favorite of favorites) {
      try {
        if (favorite.productId) await api.post(`/favorites/product/${favorite.productId}`);
        else if (favorite.flowId) await api.post(`/favorites/flow/${favorite.flowId}`);
      } catch {
        remaining.push(favorite);
      }
    }
    writeGuestFavorites(remaining);
  }
};
