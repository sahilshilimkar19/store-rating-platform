import api from './api';

export const ratingService = {
  async submitRating(storeId, rating, userId) {
    const response = await api.post('/ratings', { storeId, rating, userId });
    return response.data;
  },

  async updateRating(ratingId, rating, userId) {
    const response = await api.patch(`/ratings/${ratingId}`, { rating, userId });
    return response.data;
  },

  async getUserRatingForStore(userId, storeId) {
    const response = await api.get(`/ratings/user/${userId}/store/${storeId}`);
    return response.data;
  },

  async getUserRatings(userId) {
    const response = await api.get(`/ratings/user/${userId}`);
    return response.data;
  },

  async getStoreRatings(storeId) {
    const response = await api.get(`/ratings/store/${storeId}`);
    return response.data;
  },

  async deleteRating(ratingId, userId) {
    const response = await api.delete(`/ratings/${ratingId}`, { data: { userId } });
    return response.data;
  },
};