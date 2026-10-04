import api from './api';

export const vendorApplicationService = {
  submitApplication: async (applicationData) => {
    const response = await api.post('/vendor-applications', applicationData);
    return response.data;
  },

  getMyApplications: async () => {
    const response = await api.get('/vendor-applications/my-applications');
    return response.data;
  },

  getPendingApplications: async () => {
    const response = await api.get('/vendor-applications/pending');
    return response.data;
  },

  getApplication: async (applicationId) => {
    const response = await api.get(`/vendor-applications/${applicationId}`);
    return response.data;
  },

  reviewApplication: async (applicationId, approved, rejectionReason = null) => {
    const response = await api.patch(`/vendor-applications/${applicationId}/review`, {
      approved,
      rejectionReason
    });
    return response.data;
  }
};
