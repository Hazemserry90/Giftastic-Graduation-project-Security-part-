import api from './api';

export const productService = {
  async getProducts(params = {}) {
    const response = await api.get('/products', { params });
    return response.data;
  },

  async getProductById(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async getVendorProducts() {
    const response = await api.get('/products/vendor');
    return response.data;
  },

  async createProduct(productData) {
    const response = await api.post('/products', productData);
    return response.data;
  },

  async submitForApproval(productId, supplierId, message = null) {
    await api.post(
      `/products/${productId}/submit`,
      message ? { message } : null,
      { params: { supplierId } },
    );
  },

  async updateProduct(id, productData) {
    const response = await api.patch(`/products/${id}`, productData);
    return response.data;
  },

  async uploadProductImage(productId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async listProductImages(productId) {
    const response = await api.get(`/products/${productId}/images`);
    return response.data;
  },

  async setPrimaryProductImage(productId, imageId) {
    const response = await api.patch(`/products/${productId}/images/${imageId}/primary`);
    return response.data;
  },

  async reorderProductImages(productId, imageIds) {
    const response = await api.patch(`/products/${productId}/images/reorder`, { imageIds });
    return response.data;
  },

  async deleteProductImage(productId, imageId) {
    await api.delete(`/products/${productId}/images/${imageId}`);
  },

  async deleteProduct(id) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  async approveProduct(id) {
    const response = await api.patch(`/products/${id}/approve`);
    return response.data;
  },


  async getCategories() {
    const response = await api.get('/categories');
    return response.data;
  }
};
