import api from './api';

export const analyticsService = {
  getVendorAnalytics: async (supplierId, startDate = null, endDate = null) => {
    let url = `/vendors/${supplierId}/analytics`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', `${startDate}T00:00:00`);
    if (endDate) params.append('endDate', `${endDate}T23:59:59`);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  }
};
