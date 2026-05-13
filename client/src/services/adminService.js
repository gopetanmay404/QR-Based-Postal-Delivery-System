import api from './api';

export const adminService = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (page = 1, limit = 20) => api.get(`/admin/users?page=${page}&limit=${limit}`),
  getDeliveries: (page = 1, limit = 20, status = '') =>
    api.get(`/admin/deliveries?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`),
  updateDelivery: (id, data) => api.patch(`/admin/deliveries/${id}`, data),
  deleteDelivery: (id) => api.delete(`/admin/deliveries/${id}`),
  getPostmen: () => api.get('/admin/postmen'),
};

export const notificationService = {
  getNotifications: (page = 1) => api.get(`/notifications?page=${page}`),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};
