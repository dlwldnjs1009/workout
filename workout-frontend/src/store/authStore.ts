import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** 체험용 임시 계정으로 로그인한 상태 */
  isGuest: boolean;
  setAuth: (user: User, token: string, isGuest?: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isGuest: false,
      setAuth: (user: User, token: string, isGuest = false) =>
        set({ user, token, isAuthenticated: true, isGuest }),
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, isGuest: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
