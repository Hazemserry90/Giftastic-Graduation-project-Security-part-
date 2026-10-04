import api from './api';

const vendorActivityService = {
  // Get vendor activities with pagination
  getActivities: async (vendorId, page = 0, size = 20, activityType = null) => {
    const params = { page, size };
    if (activityType) {
      params.activityType = activityType;
    }
    const response = await api.get(`/vendors/${vendorId}/activities`, { params });
    return response.data;
  }
};

export default vendorActivityService;
