import api from './api';

export const deliveryEstimateService = {
  updateEstimate: async (orderId, estimateData) => {
    const response = await api.post(`/orders/${orderId}/delivery-estimate`, estimateData);
    return response.data;
  },

  notifyDelay: async (orderId, delayData) => {
    const response = await api.post(`/orders/${orderId}/notify-delay`, delayData);
    return response.data;
  }
};

export default deliveryEstimateService;
