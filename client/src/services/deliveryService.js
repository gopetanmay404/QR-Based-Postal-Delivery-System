import api from './api';

export const deliveryService = {
  generate: (data) => api.post('/deliveries/generate', data),
  getMyDeliveries: (page = 1, limit = 10) =>
    api.get(`/deliveries/my-deliveries?page=${page}&limit=${limit}`),
  getStatus: (id) => api.get(`/deliveries/${id}/status`),
  getQR: (id) => api.get(`/deliveries/${id}/qr`),
  confirmDelivery: (id, qrData) => api.post(`/deliveries/${id}/confirm`, { qrData }),
};
