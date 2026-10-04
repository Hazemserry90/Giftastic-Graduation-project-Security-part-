import api from './api';

export const cartService = {
  async getCart(customerId) {
    const response = await api.get(`/cart/${customerId}`);
    return response.data;
  },

  async addItem(customerId, productId, quantity, groupId, metadata) {
    const params = { productId, quantity };
    if (groupId) {
      params.groupId = groupId;
    }
    if (metadata) {
      params.metadata = metadata;
    }

    const response = await api.post(`/cart/${customerId}/items`, null, {
      params
    });
    return response.data;
  },

  async addItems(customerId, items) {
    const response = await api.post(`/cart/${customerId}/items/bulk`, items);
    return response.data;
  },

  async updateItemQuantity(customerId, productId, quantity, groupId) {
    const params = { quantity };
    if (groupId) {
      params.groupId = groupId;
    }

    const response = await api.patch(`/cart/${customerId}/items/${productId}`, null, {
      params
    });
    return response.data;
  },

  async removeItem(customerId, productId, groupId) {
    const response = await api.delete(`/cart/${customerId}/items/${productId}`, {
      params: groupId ? { groupId } : undefined
    });
    return response.data;
  },

  async removeGroup(customerId, groupId) {
    const response = await api.delete(`/cart/${customerId}/groups/${groupId}`);
    return response.data;
  },

  async clearCart(customerId) {
    const response = await api.delete(`/cart/${customerId}/clear`);
    return response.data;
  }
};
