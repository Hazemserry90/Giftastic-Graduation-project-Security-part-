import api from './api';

export const vendorService = {
  async getAllVendors() {
    const response = await api.get('/vendors');
    return response.data;
  },

  async getVendorProducts(supplierId) {
    const response = await api.get(`/products/supplier/${supplierId}`);
    return response.data;
  },

  async getVendorFlows(supplierId) {
    const response = await api.get(`/flows/vendor/${supplierId}`);
    return response.data;
  },

  async updateVendorProfile(profileData) {
    const response = await api.patch('/vendors/me', profileData);
    return response.data;
  },
  
  async getMyVendorProfile() {
    const response = await api.get('/vendors/me');
    return response.data;
  },

  async getMyProfileImages() {
    const response = await api.get('/vendors/me/images');
    return response.data;
  },

  async uploadProfileImage(type, file) {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);
    const response = await api.post('/vendors/me/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async reorderProfileImages(imageIds) {
    const response = await api.patch('/vendors/me/images/reorder', { imageIds });
    return response.data;
  },

  async deleteProfileImage(imageId) {
    await api.delete(`/vendors/me/images/${imageId}`);
  }
};
