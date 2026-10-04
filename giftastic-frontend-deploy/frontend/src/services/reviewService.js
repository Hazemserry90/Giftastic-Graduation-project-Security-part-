import api from './api';

const reviewService = {
  // User endpoints
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  getReviewsByEntity: async (entityId, reviewType) => {
    const response = await api.get(`/reviews/entity/${entityId}`, {
      params: { reviewType }
    });
    return response.data;
  },

  getMyReviews: async () => {
    const response = await api.get('/reviews/my-reviews');
    return response.data;
  },

  createVendorFeedback: async (feedbackData) => {
    const response = await api.post('/reviews/vendor-feedback', feedbackData);
    return response.data;
  },

  // Moderator endpoints
  getPendingReviews: async () => {
    const response = await api.get('/reviews/pending');
    return response.data;
  },

  getReviewsByStatus: async (status) => {
    const response = await api.get(`/reviews/status/${status}`);
    return response.data;
  },

  approveReview: async (reviewId, moderatorNotes) => {
    const response = await api.patch(`/reviews/${reviewId}/approve`, {
      moderatorNotes
    });
    return response.data;
  },

  rejectReview: async (reviewId, moderatorNotes) => {
    const response = await api.patch(`/reviews/${reviewId}/reject`, {
      moderatorNotes
    });
    return response.data;
  },

  getPendingVendorFeedback: async () => {
    const response = await api.get('/reviews/vendor-feedback/pending');
    return response.data;
  },

  getVendorFeedbackByStatus: async (status) => {
    const response = await api.get(`/reviews/vendor-feedback/status/${status}`);
    return response.data;
  },

  // User restriction endpoints
  createOrUpdateRestriction: async (userId, restrictionData) => {
    const response = await api.post(`/reviews/restrictions/${userId}`, restrictionData);
    return response.data;
  },

  getRestriction: async (userId) => {
    const response = await api.get(`/reviews/restrictions/${userId}`);
    return response.data;
  },

  removeRestriction: async (userId) => {
    const response = await api.delete(`/reviews/restrictions/${userId}`);
    return response.data;
  }
};

export default reviewService;
