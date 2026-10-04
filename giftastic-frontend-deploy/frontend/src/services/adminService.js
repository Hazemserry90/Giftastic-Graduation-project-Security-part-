import api from './api';

export const adminService = {
  // ── Current admin profile (permissions) ─────────────────────────────────
  async getMyAdminProfile() {
    const response = await api.get('/admin-management/me');
    return response.data;
  },

  // ── Categories ───────────────────────────────────────────────────────────
  async getCategories() {
    const response = await api.get('/categories');
    return response.data;
  },
  async createCategory(payload) {
    const response = await api.post('/categories', payload);
    return response.data;
  },
  async updateCategory(id, payload) {
    const response = await api.patch(`/categories/${id}`, payload);
    return response.data;
  },
  async deleteCategory(id) {
    await api.delete(`/categories/${id}`);
  },

  // ── Users ────────────────────────────────────────────────────────────────
  async getAllUsers() {
    const response = await api.get('/admin/dashboard/users');
    return response.data;
  },
  async banUser(id) {
    await api.post(`/users/${id}/ban`);
  },
  async unbanUser(id) {
    await api.post(`/users/${id}/unban`);
  },
  async deleteUser(id) {
    await api.delete(`/users/${id}`);
  },
  async getAdminRequests() {
    const response = await api.get('/admin/dashboard/admin-requests');
    return response.data;
  },

  // ── Admin promotion / demotion ────────────────────────────────────────────
  async promoteToAdmin(userId) {
    await api.post(`/admin-management/promote/${userId}`);
  },
  async demoteAdmin(userId) {
    await api.delete(`/admin-management/demote/${userId}`);
  },
  async grantPermission(userId, permission) {
    await api.patch(`/admin-management/permissions/${userId}/grant`, null, {
      params: { permission },
    });
  },
  async revokePermission(userId, permission) {
    await api.patch(`/admin-management/permissions/${userId}/revoke`, null, {
      params: { permission },
    });
  },

  // ── Vendors ──────────────────────────────────────────────────────────────
  async getAllVendors() {
    const response = await api.get('/vendors/admin/all');
    return response.data;
  },
  async getPendingVendors() {
    const response = await api.get('/admin/dashboard/pending-vendors');
    return response.data;
  },
  async activateVendor(userId) {
    await api.patch(`/vendors/${userId}/activate`);
  },
  async deactivateVendor(userId) {
    await api.patch(`/vendors/${userId}/deactivate`);
  },

  // ── Products ──────────────────────────────────────────────────────────────
  async getAllProducts(page = 0, size = 20, status = null) {
    const response = await api.get('/admin/dashboard/products', {
      params: { page, size, ...(status ? { status } : {}) },
    });
    return response.data;
  },
  async getPendingProducts() {
    const response = await api.get('/admin/dashboard/pending-products');
    return response.data;
  },
  async getDraftProducts() {
    const response = await api.get('/admin/dashboard/draft-products');
    return response.data;
  },
  async approveProduct(id) {
    await api.patch(`/products/${id}/approve`);
  },
  async rejectProduct(id, reason = null) {
    await api.patch(`/products/${id}/reject`, reason ? { reason } : null);
  },
  async deactivateProduct(id) {
    await api.patch(`/products/${id}/deactivate`);
  },
  async activateProduct(id) {
    await api.patch(`/products/${id}/activate`);
  },
  async deleteProduct(id) {
    await api.delete(`/products/${id}`);
  },

  // ── Dashboard stats ───────────────────────────────────────────────────────
  async getStats() {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  // ── Platform analytics ───────────────────────────────────────────────────
  async getPlatformAnalytics() {
    const response = await api.get('/admin/dashboard/analytics/platform');
    return response.data;
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  async getAllOrders() {
    const response = await api.get('/orders', { params: { sort: 'placedAt,desc', size: 100 } });
    return response.data;
  },
  async updateOrderStatus(orderId, status) {
    await api.patch(`/orders/${orderId}/status`, null, { params: { status } });
  },
  async markOrderPaid(orderId) {
    await api.patch(`/orders/${orderId}/pay`);
  },
  async confirmOrderPayment(orderId) {
    await api.patch(`/orders/${orderId}/confirm-payment`);
  },
  async rejectOrderPayment(orderId, reason) {
    await api.patch(`/orders/${orderId}/reject-payment`, { reason });
  },

  // ── Gift Flows ────────────────────────────────────────────────────────────
  async getAllGiftFlows() {
    const response = await api.get('/flows');
    return response.data;
  },
  async deleteGiftFlow(flowId, supplierId) {
    await api.delete(`/flows/${flowId}`, { params: { supplierId } });
  },

  // ── Admins & Notifications ────────────────────────────────────────────────
  async getAllAdmins() {
    const response = await api.get('/admin/dashboard/admins');
    return response.data;
  },
  async sendNotification(data) {
    await api.post('/admin/dashboard/notifications/send', data);
  },

  // ── Reports ────────────────────────────────────────────────────────────────
  async getAllReports() {
    const response = await api.get('/reports');
    return response.data;
  },
  async getReportsByStatus(status) {
    const response = await api.get(`/reports/status/${status}`);
    return response.data;
  }
};
