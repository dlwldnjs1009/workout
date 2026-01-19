import api from './api';
import type { DietSession, DietDashboardData } from '../types';

export const dietService = {
  getDietSessions: async (): Promise<DietSession[]> => {
    const response = await api.get<DietSession[]>('/diet-sessions');
    return response.data;
  },

  /**
   * 특정 날짜의 식단 조회 (단건 조회로 최적화)
   * 미존재 시 204 No Content 반환 (성공 응답이므로 try 블록에서 처리)
   */
  getDietSessionByDate: async (date: string): Promise<DietSession | null> => {
    const response = await api.get<DietSession>(`/diet-sessions/by-date?date=${date}`);
    // 204 No Content는 성공 응답이므로 catch가 아닌 여기서 처리
    if (response.status === 204 || !response.data) {
      return null;
    }
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
