import api from './api';
import type { UserProfile } from '../types';

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/users/profile');
    return response.data;
  },
  
  updateProfile: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await api.put<UserProfile>('/users/profile', profile);
    return response.data;
  }
};
