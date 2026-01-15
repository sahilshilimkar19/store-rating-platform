import api from './api';

export const storeService = {
  async getAllStores(params = {}) {
    const response = await api.get('/stores', { params });
    return response.data;
  },

  async getStoreById(id) {
    const response = await api.get(`/stores/${id}`);
    return response.data;
  },

  async getStoreStats(id) {
    const response = await api.get(`/stores/${id}/stats`);
    return response.data;
  },

  async createStore(data) {
    const response = await api.post('/stores', data);
    return response.data;
  },

  async updateStore(id, data) {
    const response = await api.patch(`/stores/${id}`, data);
    return response.data;
  },

  async deleteStore(id) {
    const response = await api.delete(`/stores/${id}`);
    return response.data;
  },
};