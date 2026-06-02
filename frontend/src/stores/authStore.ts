import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, LoginResponse } from '@/types';
import { api, setTokens, clearTokens } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post<LoginResponse>('/auth/login', credentials);
          setTokens(res.accessToken || res.token, res.refreshToken);
          set({
            user: res.user,
            token: res.accessToken || res.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: unknown) {
          const message =
            err && typeof err === 'object' && 'message' in err
              ? (err as { message: string }).message
              : 'Error al iniciar sesión';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      logout: () => {
        clearTokens();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        window.location.href = '/login';
      },

      refreshToken: async () => {
        try {
          const res = await api.post<LoginResponse>('/auth/refresh', {
            refreshToken: localStorage.getItem('refresh_token'),
          });
          setTokens(res.accessToken || res.token, res.refreshToken);
          set({
            user: res.user,
            token: res.accessToken || res.token,
            isAuthenticated: true,
          });
        } catch {
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'acredita-pro-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
