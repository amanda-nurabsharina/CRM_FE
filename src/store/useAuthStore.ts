import { create } from "zustand";
import { User, LoginPayload } from "../types/auth";
import { storage } from "../utils/storage";
import { authApi } from "../api/authApi";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (payload: LoginPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: storage.getUser(),
  token: storage.getAccessToken(),
  isAuthenticated: !!storage.getAccessToken(),
  isLoading: false,
  error: null,

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(payload);
      const { user, tokens } = response;

      storage.setAccessToken(tokens.access_token);
      storage.setRefreshToken(tokens.refresh_token);
      storage.setUser(user);

      set({
        user,
        token: tokens.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err: any) {
      let message = "Invalid email or password";
      if (err?.response) {
        try {
          const body = await err.response.json();
          message = body?.message || message;
        } catch (_) {}
      }
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: async () => {
    const refreshToken = storage.getRefreshToken() || undefined;
    try {
      await authApi.logout(refreshToken);
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      storage.clearAuth();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  checkAuth: async () => {
    const token = storage.getAccessToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      const res = await authApi.me();
      if (res.data) {
        storage.setUser(res.data);
        set({ user: res.data, isAuthenticated: true });
      }
    } catch (_) {
      storage.clearAuth();
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
