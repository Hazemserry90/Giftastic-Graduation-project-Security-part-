import api from './api';

export const discountService = {
  setDiscount: async (productId, discountData) => {
    const response = await api.post(`/products/${productId}/discount`, discountData);
    return response.data;
  },

  removeDiscount: async (productId) => {
    const response = await api.delete(`/products/${productId}/discount`);
    return response.data;
  }
};

export default discountService;
