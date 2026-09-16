import api from './api';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types';

export const authService = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },
  
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  /** 회원가입 없이 둘러볼 수 있는 임시 계정을 발급받는다. */
  guestLogin: async (): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/guest');
    return response.data;
  },

  logout: () => {
  },
};
