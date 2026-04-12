import { create } from 'zustand';
import { authService } from '../lib/authService';

export interface ApiUser {
  user_id: string;
  email: string;
  name?: string;
  display_name?: string;
}

interface AuthState {
  user: ApiUser | null;
  loading: boolean;
  setUser: (user: ApiUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: () => {
    authService.logout();
    set({ user: null });
  },
}));
