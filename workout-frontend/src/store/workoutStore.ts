import { create } from 'zustand';
import type { ExerciseType, WorkoutRoutine, WorkoutSession } from '../types';
import { workoutService } from '../services/workoutService';

// 캐시 유효 시간 (5분)
const CACHE_TTL = 5 * 60 * 1000;

interface CacheState {
  lastFetched: number;
  isLoading: boolean;
  isLoaded: boolean;
}

interface WorkoutState {
  exercises: ExerciseType[];
  routines: WorkoutRoutine[];
  sessions: WorkoutSession[];
  currentWorkout: WorkoutSession | null;

  // 캐시 상태
  exercisesCache: CacheState;
  sessionsCache: CacheState;

  // 기존 setter (호환성 유지)
  setExercises: (exercises: ExerciseType[]) => void;
  setRoutines: (routines: WorkoutRoutine[]) => void;
  setSessions: (sessions: WorkoutSession[]) => void;
  setCurrentWorkout: (workout: WorkoutSession | null) => void;

  // 캐싱이 적용된 fetch 메서드
  fetchExercises: () => Promise<ExerciseType[]>;
  fetchSessions: () => Promise<WorkoutSession[]>;

  // 캐시 무효화
  invalidateExercises: () => void;
  invalidateSessions: () => void;
}

const defaultCacheState: CacheState = {
  lastFetched: 0,
  isLoading: false,
  isLoaded: false,
};

export const useWorkoutStore = create<WorkoutState>()((set, get) => ({
  exercises: [],
  routines: [],
  sessions: [],
  currentWorkout: null,

  // 캐시 상태 초기화
  exercisesCache: { ...defaultCacheState },
  sessionsCache: { ...defaultCacheState },

  // 기존 setter (호환성 유지)
  setExercises: (exercises: ExerciseType[]) => set({ exercises }),
  setRoutines: (routines: WorkoutRoutine[]) => set({ routines }),
  setSessions: (sessions: WorkoutSession[]) => set({ sessions }),
  setCurrentWorkout: (workout: WorkoutSession | null) => set({ currentWorkout: workout }),

  // 캐싱이 적용된 운동 목록 fetch
  fetchExercises: async () => {
    const state = get();
    const now = Date.now();

    // 이미 로딩 중인 경우, 현재 데이터 반환
    if (state.exercisesCache.isLoading) {
      return state.exercises;
    }

    // 캐시가 유효한 경우, 캐시된 데이터 반환
    if (state.exercisesCache.isLoaded && (now - state.exercisesCache.lastFetched) < CACHE_TTL) {
      return state.exercises;
    }

    // 새로운 데이터 fetch
    set({ exercisesCache: { ...state.exercisesCache, isLoading: true } });
    try {
      const data = await workoutService.getExercises();
      set({
        exercises: data || [],
        exercisesCache: { lastFetched: Date.now(), isLoading: false, isLoaded: true }
      });
      return data || [];
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      set({ exercisesCache: { ...state.exercisesCache, isLoading: false } });
      return state.exercises;
    }
  },

  // 캐싱이 적용된 세션 목록 fetch
  fetchSessions: async () => {
    const state = get();
    const now = Date.now();

    // 이미 로딩 중인 경우, 현재 데이터 반환
    if (state.sessionsCache.isLoading) {
      return state.sessions;
    }

    // 캐시가 유효한 경우, 캐시된 데이터 반환
    if (state.sessionsCache.isLoaded && (now - state.sessionsCache.lastFetched) < CACHE_TTL) {
      return state.sessions;
    }

    // 새로운 데이터 fetch
    set({ sessionsCache: { ...state.sessionsCache, isLoading: true } });
    try {
      const data = await workoutService.getSessions();
      set({
        sessions: data || [],
        sessionsCache: { lastFetched: Date.now(), isLoading: false, isLoaded: true }
      });
      return data || [];
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      set({ sessionsCache: { ...state.sessionsCache, isLoading: false } });
      return state.sessions;
    }
  },

  // 캐시 무효화 (데이터 변경 후 호출)
  invalidateExercises: () => {
    set({ exercisesCache: { ...defaultCacheState } });
  },

  invalidateSessions: () => {
    set({ sessionsCache: { ...defaultCacheState } });
  },
}));
