import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, name: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateProfile: (data: { name?: string; avatarUrl?: string }) => Promise<void>;
  clearError: () => void;
}

const savedToken = localStorage.getItem('systemtwin_token');

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: savedToken,
  // If a token exists, start in loading state so the app waits for verification
  loading: !!savedToken,
  error: null,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        set({ loading: false, error: data.error || 'Login failed' });
        return false;
      }
      const data = await res.json();
      localStorage.setItem('systemtwin_token', data.token);
      set({ user: data.user, token: data.token, isAuthenticated: true, loading: false, error: null });
      return true;
    } catch (err) {
      set({ loading: false, error: 'Cannot connect to server. Make sure the backend is running (npm run dev).' });
      return false;
    }
  },

  register: async (email, name, password) => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, name, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        set({ loading: false, error: data.error || 'Registration failed' });
        return false;
      }
      const data = await res.json();
      localStorage.setItem('systemtwin_token', data.token);
      set({ user: data.user, token: data.token, isAuthenticated: true, loading: false, error: null });
      return true;
    } catch (err) {
      set({ loading: false, error: 'Cannot connect to server. Make sure the backend is running (npm run dev).' });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('systemtwin_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = get().token;
    if (!token) { set({ loading: false }); return; }
    set({ loading: true });
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const user = await res.json();
        set({ user, isAuthenticated: true, loading: false });
      } else if (res.status === 401) {
        // Only logout on actual auth failure, not rate limits or server errors
        localStorage.removeItem('systemtwin_token');
        set({ user: null, token: null, isAuthenticated: false, loading: false });
      } else {
        // Rate limit (429) or server error — keep token, stop loading
        set({ loading: false, isAuthenticated: !!get().token });
      }
    } catch {
      set({ loading: false });
    }
  },

  updateProfile: async (data) => {
    const res = await apiFetch('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const user = await res.json();
      set({ user });
    }
  },

  clearError: () => set({ error: null }),
}));
