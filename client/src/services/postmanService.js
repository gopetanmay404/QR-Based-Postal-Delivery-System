import api from './api';

export const postmanService = {
  getAssigned: () => api.get('/postman/assigned'),
  scanQR: (qrData) => api.post('/postman/scan', { qrData }),
  startDelivery: (id) => api.post(`/postman/start-delivery/${id}`),
  updateLocation: (data) => api.post('/postman/update-location', data),
};
