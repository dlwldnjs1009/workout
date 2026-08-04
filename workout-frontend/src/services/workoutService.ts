import api from './api';
import type { WorkoutRoutine, WorkoutSession, ExerciseType, WorkoutDashboardData, PreviousExerciseRecords, ExerciseProgress } from '../types';

export const workoutService = {
  getExercises: async (): Promise<ExerciseType[]> => {
    const response = await api.get<ExerciseType[]>('/exercises');
    return response.data;
  },
  
  getRoutines: async (): Promise<WorkoutRoutine[]> => {
    const response = await api.get<WorkoutRoutine[]>('/routines');
    return response.data;
  },
  
  createRoutine: async (routine: Partial<WorkoutRoutine>): Promise<WorkoutRoutine> => {
    const response = await api.post<WorkoutRoutine>('/routines', routine);
    return response.data;
  },
  
  deleteRoutine: async (id: number): Promise<void> => {
    await api.delete(`/routines/${id}`);
  },
  
  getSessions: async (): Promise<WorkoutSession[]> => {
    const response = await api.get<WorkoutSession[]>('/sessions');
    return response.data;
  },

  getSessionsByDateRange: async (startDate: string, endDate: string): Promise<WorkoutSession[]> => {
    const response = await api.get<WorkoutSession[]>('/sessions', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  getWorkoutDashboard: async (tz: string): Promise<WorkoutDashboardData> => {
    const response = await api.get<WorkoutDashboardData>(`/sessions/dashboard?tz=${encodeURIComponent(tz)}`);
    return response.data;
  },

  getPreviousExerciseRecords: async (exerciseId: number): Promise<PreviousExerciseRecords> => {
    const response = await api.get<PreviousExerciseRecords>(`/sessions/previous-records/${exerciseId}`);
    return response.data;
  },

  getExerciseProgress: async (exerciseId: number): Promise<ExerciseProgress> => {
    const response = await api.get<ExerciseProgress>(`/sessions/exercises/${exerciseId}/progress`);
    return response.data;
  },
  
  createSession: async (session: Partial<WorkoutSession>): Promise<WorkoutSession> => {
    const response = await api.post<WorkoutSession>('/sessions', session);
    return response.data;
  },

  getSessionById: async (id: number): Promise<WorkoutSession> => {
    const response = await api.get<WorkoutSession>(`/sessions/${id}`);
    return response.data;
  },

  deleteSession: async (id: number): Promise<void> => {
    await api.delete(`/sessions/${id}`);
  },
};
