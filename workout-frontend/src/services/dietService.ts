import api from './api';
import type { DietSession, DietDashboardData } from '../types';

export const dietService = {
  getDietSessions: async (): Promise<DietSession[]> => {
    const response = await api.get<DietSession[]>('/diet-sessions');
    return response.data;
  },

  getTodayDietSummary: async (tz: string): Promise<DietDashboardData> => {
    const response = await api.get<DietDashboardData>(`/diet-sessions/today?tz=${encodeURIComponent(tz)}`);
    return response.data;
  },
  
  getDietSessionById: async (id: number): Promise<DietSession> => {
    const response = await api.get<DietSession>(`/diet-sessions/${id}`);
    return response.data;
  },

  createDietSession: async (session: Partial<DietSession>): Promise<DietSession> => {
    const response = await api.post<DietSession>('/diet-sessions', session);
    return response.data;
  },

  deleteDietSession: async (id: number): Promise<void> => {
    await api.delete(`/diet-sessions/${id}`);
  }
};
