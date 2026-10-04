import api from './api';

export const userService = {
  async getMyProfile() {
    const response = await api.get('/users/me');
    return response.data;
  },

  async updateMyProfile(profileData) {
    const response = await api.patch('/users/me', profileData);
    return response.data;
  },

  async updateMyInstapayRefundDetails(payload) {
    const response = await api.patch('/users/me/instapay-refund', payload);
    return response.data;
  },

  async getMyAddresses() {
    const response = await api.get('/users/me/addresses');
    return response.data;
  },

  async updateMyAddresses(payload) {
    const response = await api.put('/users/me/addresses', payload);
    return response.data;
  },

  async getPublicProfile(userId) {
    const response = await api.get(`/users/profile/${userId}`);
    return response.data;
  }
};
