import api from './api';

export const recommendationService = {
  getMostFrequentlyBought: async (limit = 10) => {
    const response = await api.get(`/recommendations/most-frequently-bought?limit=${limit}`);
    return response.data;
  },

  getWhatOthersAreBuying: async (limit = 10) => {
    const response = await api.get(`/recommendations/what-others-are-buying?limit=${limit}`);
    return response.data;
  },

  getTrending: async (limit = 10) => {
    const response = await api.get(`/recommendations/trending?limit=${limit}`);
    return response.data;
  },

  getSimilarProducts: async (productId, limit = 10) => {
    const response = await api.get(`/recommendations/similar/${productId}?limit=${limit}`);
    return response.data;
  },

  getPersonalizedRecommendations: async (limit = 10) => {
    const response = await api.get(`/recommendations/for-me?limit=${limit}`);
    return response.data;
  }
};
