import api from './api';

const deliveryService = {
  // Get all active delivery zones
  getAllZones: async () => {
    const response = await api.get('/delivery/zones');
    return response.data;
  },

  // Get delivery cost for a specific vendor and zone
  getDeliveryCost: async (vendorId, zoneId) => {
    const response = await api.get('/delivery/cost', {
      params: { vendorId, zoneId }
    });
    return response.data;
  },

  // Get vendor's delivery pricing
  getVendorPricing: async (vendorId) => {
    const response = await api.get(`/delivery/vendor/${vendorId}/pricing`);
    return response.data;
  },

  // Update vendor's delivery pricing
  updateVendorPricing: async (vendorId, zonePricing) => {
    const response = await api.post(`/delivery/vendor/${vendorId}/pricing`, {
      zonePricing
    });
    return response.data;
  }
};

export default deliveryService;
