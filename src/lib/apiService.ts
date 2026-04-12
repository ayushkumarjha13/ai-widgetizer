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

export interface AnalyticsSummary {
  totalOpens: number;
  totalMessages: number;
  uniqueSessions: number;
  byHour: Record<number, number>;
  byCountry: Record<string, number>;
  byDay: Record<string, number>;
  bySentiment: { happy: number; neutral: number; angry: number };
}

export interface WidgetEvent {
  id: string;
  type: 'message' | 'open';
  content?: string;
  role?: 'user' | 'assistant';
  session_id: string;
  widget_id: string;
  created_at: string;
  metadata?: any;
}

export const apiService = {
  // Widgets
  getWidgets: (_uid?: string) => api.get('/widgets').then(res => res.data),
  getWidget: (id: string) => api.get(`/widgets?id=${id}`).then(res => res.data),
  createWidget: (data: any) => api.post('/widgets', data).then(res => res.data),
  updateWidget: (id: string, data: any) => api.put(`/widgets?id=${id}`, data).then(res => res.data),
  deleteWidget: (id: string) => api.delete(`/widgets?id=${id}`).then(res => res.data),

  // Analytics
  getAnalytics: (uid: string, start?: Date, end?: Date) => {
    let url = `/analytics/messages?uid=${uid}`;
    if (start) url += `&start=${start.toISOString()}`;
    if (end) url += `&end=${end.toISOString()}`;
    return api.get(url).then(res => res.data);
  },
  
  getConversations: (widgetId: string, start?: Date, end?: Date) => {
    let url = `/analytics/conversations?widget_id=${widgetId}`;
    if (start) url += `&start=${start.toISOString()}`;
    if (end) url += `&end=${end.toISOString()}`;
    return api.get(url).then(res => res.data);
  },

  getSessionMessages: (sessionId: string) => api.get(`/analytics/messages?session_id=${sessionId}`).then(res => res.data),

  // Admin
  getAdminStats: () => api.get('/admin/stats').then(res => res.data),
};
