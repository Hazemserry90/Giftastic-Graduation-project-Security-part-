import api from './api';

export const orderService = {
  async placeOrder(orderData) {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  
  async placeGuestOrder(guestData) {
    const response = await api.post('/orders/guest-checkout', guestData);
    return response.data;
  },

  async getOrderById(id) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  async trackGuestOrder(id, email, phone) {
    const response = await api.get(`/orders/guest-track/${id}`, {
      params: { email, phone }
    });
    return response.data;
  },

  async getCustomerOrders(customerId) {
    const response = await api.get(`/orders/customer/${customerId}`);
    return Array.isArray(response.data) ? response.data : (response.data?.content || []);
  },

  async getVendorOrders() {
    const response = await api.get('/orders/vendor');
    return response.data;
  },

  async getAllOrders() {
    const response = await api.get('/orders');
    return Array.isArray(response.data) ? response.data : (response.data?.content || []);
  },

  async updateOrderStatus(id, status) {
    const response = await api.patch(`/orders/${id}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  async changePaymentMethod(id, customerId, paymentMethod, instapayPhoneNumber = null, instapayRefundPhoneNumber = null, instapayRefundName = null) {
    await api.patch(`/orders/${id}/payment-method`, {
      customerId,
      paymentMethod,
      instapayPhoneNumber,
      instapayRefundPhoneNumber,
      instapayRefundName,
    });
  },

  async submitInstapayTransactions(id, customerId, transactionIds) {
    await api.post(`/orders/${id}/instapay-transactions`, { customerId, transactionIds });
  },

  async submitGuestInstapayTransactions(id, email, phone, transactionIds) {
    await api.post(`/orders/guest-track/${id}/instapay-transactions`, { email, phone, transactionIds });
  },

  async cancelOrder(id, customerId) {
    await api.post(`/orders/${id}/cancel`, null, { params: { customerId } });
  },

  async updateVendorStatus(id, status) {
    await api.patch(`/orders/${id}/vendor-status`, { status });
  }
};
