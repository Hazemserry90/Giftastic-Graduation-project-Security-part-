import api from './api';

export const adminRequestService = {
  // User actions
  async submitRequest(payload) {
    const response = await api.post('/admin-requests', payload);
    return response.data;
  },

  async getMyRequests() {
    const response = await api.get('/admin-requests/my-requests');
    return response.data;
  },

  // Admin actions
  async getPendingRequests() {
    const response = await api.get('/admin-requests/pending');
    return response.data;
  },

  async getAllRequests() {
    const usersResponse = await api.get('/admin/dashboard/users');
    const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
    const requestLists = await Promise.all(users.map(async (user) => {
      const response = await api.get(`/admin-requests/user/${user.id}`);
      return Array.isArray(response.data) ? response.data : [];
    }));
    return [...new Map(requestLists.flat().map((request) => [request.id, request])).values()];
  },

  async getUserRequests(userId) {
    const response = await api.get(`/admin-requests/user/${userId}`);
    return response.data;
  },

  async approveRequest(requestId) {
    await api.patch(`/admin-requests/${requestId}/approve`);
  },

  async rejectRequest(requestId, notes) {
    await api.patch(`/admin-requests/${requestId}/reject`, null, {
      params: { notes },
    });
  },

  async invalidateRequest(requestId, notes) {
    await api.patch(`/admin-requests/${requestId}/invalidate`, null, {
      params: { notes },
    });
  },

  async resetCooldown(requestId) {
    await api.patch(`/admin-requests/${requestId}/reset-cooldown`);
  },
};
