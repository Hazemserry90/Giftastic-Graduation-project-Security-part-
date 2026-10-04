import api from './api';

const commissionService = {
  getCurrentRate: async (supplierId) => {
    const response = await api.get('/commission-pricing/current-rate', { params: { supplierId } });
    return response.data;
  },
  // Vendor endpoints
  getVendorPendingCommissions: async () => {
    const response = await api.get('/vendor/commissions/pending');
    return response.data;
  },

  getVendorCommissionHistory: async () => {
    const response = await api.get('/vendor/commissions/history');
    return response.data;
  },

  submitPayment: async (commissionId, data) => {
    const response = await api.post(`/vendor/commissions/${commissionId}/submit-payment`, data);
    return response.data;
  },

  urgePlatformPayment: async (commissionId) => {
    await api.post(`/vendor/commissions/${commissionId}/urge-payment`);
  },

  approvePlatformPayment: async (requestId) => {
    await api.post(`/vendor/payment-requests/${requestId}/approve`);
  },

  rejectPlatformPayment: async (requestId, reason) => {
    await api.post(`/vendor/payment-requests/${requestId}/reject`, { reason });
  },

  addVendorPaymentRequestMessage: async (requestId, message) => {
    const response = await api.post(`/vendor/payment-requests/${requestId}/messages`, { message });
    return response.data;
  },

  getVendorPaymentRequests: async () => {
    const response = await api.get('/vendor/payment-requests');
    return response.data;
  },

  requestOrderAssistance: async (orderId, message) => {
    const response = await api.post(`/vendor/orders/${orderId}/request-assistance`, { message });
    return response.data;
  },

  getVendorAssistanceRequests: async () => {
    const response = await api.get('/vendor/assistance-requests');
    return response.data;
  },

  addVendorAssistanceMessage: async (requestId, message) => {
    const response = await api.post(`/vendor/assistance-requests/${requestId}/message`, { message });
    return response.data;
  },

  confirmVendorAssistanceResolution: async (requestId, resolved, message) => {
    const response = await api.post(`/vendor/assistance-requests/${requestId}/resolution`, { resolved, message });
    return response.data;
  },

  // Admin endpoints
  getUnpaidCommissions: async () => {
    const response = await api.get('/admin/commissions/unpaid');
    return response.data;
  },

  getInstapayPayouts: async () => {
    const response = await api.get('/admin/commissions/instapay-payouts');
    return response.data;
  },

  getVendorPayoutRequests: async () => {
    const response = await api.get('/admin/commissions/vendor-payout-requests');
    return response.data;
  },

  urgePayment: async (commissionId) => {
    await api.post(`/admin/commissions/${commissionId}/urge-payment`);
  },

  submitVendorPayout: async (commissionId, data) => {
    const response = await api.post(`/admin/commissions/${commissionId}/submit-payment`, data);
    return response.data;
  },

  getPendingPaymentRequests: async () => {
    const response = await api.get('/admin/commissions/payment-requests/pending');
    return response.data;
  },

  approvePaymentRequest: async (requestId) => {
    await api.post(`/admin/commissions/payment-requests/${requestId}/approve`);
  },

  rejectPaymentRequest: async (requestId, reason) => {
    await api.post(`/admin/commissions/payment-requests/${requestId}/reject`, { reason });
  },

  addAdminPaymentRequestMessage: async (requestId, message) => {
    const response = await api.post(`/admin/commissions/payment-requests/${requestId}/messages`, { message });
    return response.data;
  },

  createCommissionRule: async (ruleData) => {
    const response = await api.post('/admin/commissions/rules', ruleData);
    return response.data;
  },

  getCommissionRules: async () => {
    const response = await api.get('/admin/commissions/rules');
    return response.data;
  },

  deactivateRule: async (ruleId) => {
    await api.post(`/admin/commissions/rules/${ruleId}/deactivate`);
  },

  updateOrderStatus: async (orderId, status) => {
    await api.patch(`/admin/orders/${orderId}/status`, { status });
  },

  invalidateVendorPortion: async (orderId, supplierId, data) => {
    await api.post(`/admin/orders/${orderId}/vendors/${supplierId}/invalidate`, data);
  },

  getAssistanceRequests: async (status) => {
    const params = status ? { status } : {};
    const response = await api.get('/admin/orders/assistance-requests', { params });
    return response.data;
  },

  resolveAssistanceRequest: async (requestId, resolution) => {
    await api.post(`/admin/orders/assistance-requests/${requestId}/resolve`, { resolution });
  },

  addAssistanceMessage: async (requestId, message) => {
    const response = await api.post(`/admin/orders/assistance-requests/${requestId}/message`, { message });
    return response.data;
  },

  closeAssistanceRequest: async (requestId) => {
    await api.post(`/admin/orders/assistance-requests/${requestId}/close`);
  },

  getFinancialAnalytics: async () => {
    const response = await api.get('/admin/analytics/financial');
    return response.data;
  },
};

export default commissionService;
