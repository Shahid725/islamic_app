import { create } from 'zustand';
import { authApi } from '../api/services';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true until initial auth check done

  initialize: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await authApi.getMe();
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await authApi.login({ email, password });
    const { accessToken, refreshToken, user } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, isAuthenticated: true });
    return user;
  },

  register: async (name, email, password) => {
    const { data } = await authApi.register({ name, email, password });
    const { accessToken, refreshToken, user } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, isAuthenticated: true });
    return user;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (updates) => {
    set((state) => ({ user: { ...state.user, ...updates } }));
  },

  isPremium: () => {
    const { user } = get();
    if (!user) return false;
    const { plan, status, expiresAt } = user.subscription || {};
    if (plan === 'free' || status === 'none') return false;
    if (plan === 'lifetime' && status === 'active') return true;
    if (status === 'active' && expiresAt && new Date() < new Date(expiresAt)) return true;
    return false;
  },
}));

export default useAuthStore;
