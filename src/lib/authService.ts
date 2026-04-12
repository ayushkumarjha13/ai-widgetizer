import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const authService = {
  login: async (email: string) => {
    const res = await api.post('/auth', { email });
    if (res.data.token) {
      localStorage.setItem('auth_token', res.data.token);
    }
    return res.data;
  },
  
  checkStatus: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    try {
      // We can have a dedicated /api/me endpoint or just decode the token
      // For now, let's assume we have a sync endpoint or a simple check
      const res = await api.get('/users/sync', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (e) {
      localStorage.removeItem('auth_token');
      return null;
    }
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
  }
};
