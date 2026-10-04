import api from './api';

export const reportService = {
  // User endpoints
  createReport: async (reportData) => {
    const response = await api.post('/reports', reportData);
    return response.data;
  },

  getMyReports: async (page = 0, size = 20) => {
    const response = await api.get('/reports/my-reports', {
      params: { page, size }
    });
    return response.data;
  },

  // Admin endpoints
  getAllReports: async (page = 0, size = 20) => {
    const response = await api.get('/reports', {
      params: { page, size }
    });
    return response.data;
  },

  getReportsByStatus: async (status, page = 0, size = 20) => {
    const response = await api.get(`/reports/status/${status}`, {
      params: { page, size }
    });
    return response.data;
  },

  getReportsByType: async (type, page = 0, size = 20) => {
    const response = await api.get(`/reports/type/${type}`, {
      params: { page, size }
    });
    return response.data;
  },

  getReportsByEntity: async (entityId, page = 0, size = 20) => {
    const response = await api.get(`/reports/entity/${entityId}`, {
      params: { page, size }
    });
    return response.data;
  },

  getReport: async (reportId) => {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  },

  markUnderReview: async (reportId) => {
    const response = await api.patch(`/reports/${reportId}/under-review`);
    return response.data;
  },

  markActionTaken: async (reportId, notes, action) => {
    const response = await api.patch(`/reports/${reportId}/action-taken`, null, {
      params: { notes, action }
    });
    return response.data;
  },

  dismissReport: async (reportId, notes) => {
    const response = await api.patch(`/reports/${reportId}/dismiss`, null, {
      params: { notes }
    });
    return response.data;
  },

  resolveReport: async (reportId, notes) => {
    const response = await api.patch(`/reports/${reportId}/resolve`, null, {
      params: { notes }
    });
    return response.data;
  }
};
