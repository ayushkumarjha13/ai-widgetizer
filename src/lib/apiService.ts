import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // Widgets
  getWidgets: () => api.get('/widgets').then(res => res.data),
  getWidget: (id: string) => api.get(`/widgets?id=${id}`).then(res => res.data),
  createWidget: (data: any) => api.post('/widgets', data).then(res => res.data),
  updateWidget: (id: string, data: any) => api.put(`/widgets?id=${id}`, data).then(res => res.data),
  deleteWidget: (id: string) => api.delete(`/widgets?id=${id}`).then(res => res.data),

  // Analytics
  getAnalyticsSummary: () => api.get('/analytics/summary').then(res => res.data),
  getConversations: (widgetId?: string) => api.get(`/analytics/conversations${widgetId ? `?widget_id=${widgetId}` : ''}`).then(res => res.data),
  getMessages: (sessionId: string) => api.get(`/analytics/messages?session_id=${sessionId}`).then(res => res.data),

  // Admin
  getSaaSStats: () => api.get('/admin/stats').then(res => res.data),
};
