import api from './api';

export const giftFlowService = {
  async getFlowById(id) {
    const response = await api.get(`/flows/${id}`);
    return response.data;
  },

  async getAllFlows() {
    const response = await api.get('/flows');
    return response.data;
  },

  async getFlowLimits() {
    const response = await api.get('/flows/limits');
    return response.data;
  },

  async getFlowsByVendor(supplierId) {
    const response = await api.get(`/flows/vendor/${supplierId}`);
    return response.data;
  },

  async createFlow(supplierId, flowData) {
    const response = await api.post('/flows', flowData, {
      params: { supplierId }
    });
    return response.data;
  },

  async updateFlow(id, supplierId, flowData) {
    const response = await api.patch(`/flows/${id}`, flowData, {
      params: { supplierId }
    });
    return response.data;
  },

  async uploadFlowImage(flowId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/flows/${flowId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteFlowImage(flowId) {
    await api.delete(`/flows/${flowId}/image`);
  },

  async deleteFlow(id, supplierId) {
    const response = await api.delete(`/flows/${id}`, {
      params: { supplierId }
    });
    return response.data;
  }
};
