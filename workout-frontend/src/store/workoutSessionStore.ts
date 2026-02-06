import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkoutSessionState {
  timerSeconds: number;
  timerStartedAt: number | null;
  isRunning: boolean;
  
  restTimerSeconds: number;
  restTimerDuration: number;
  isRestTimerRunning: boolean;
  restTimerStartedAt: number | null;
  restTimerFinished: boolean;

  wipSession: any | null;
  activeRoutineId: number | null;

  setTimerSeconds: (seconds: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  
  startRestTimer: () => void;
  stopRestTimer: () => void;
  setRestTimerDuration: (seconds: number) => void;
  updateRestTimer: () => void;
  dismissRestTimerAlert: () => void;

  saveWipSession: (session: any) => void;
  clearWipSession: () => void;
  startRoutine: (id: number) => void;
  endRoutine: () => void;
}

export const useWorkoutSessionStore = create<WorkoutSessionState>()(
  persist(
    (set, get) => ({
      timerSeconds: 0,
      timerStartedAt: null,
      isRunning: false,
      
      restTimerSeconds: 0,
      restTimerDuration: 90,
      isRestTimerRunning: false,
      restTimerStartedAt: null,
      restTimerFinished: false,

      wipSession: null,
      activeRoutineId: null,

      setTimerSeconds: (seconds) => set({ timerSeconds: seconds }),
      
      startTimer: () => set((state) => ({ 
        isRunning: true, 
        timerStartedAt: Date.now() - (state.timerSeconds * 1000) 
      })),
      
      pauseTimer: () => set((state) => {
        if (!state.timerStartedAt) return { isRunning: false };
        const elapsed = Math.floor((Date.now() - state.timerStartedAt) / 1000);
        return { 
          isRunning: false, 
          timerSeconds: elapsed,
          timerStartedAt: null 
        };
      }),
      
      resetTimer: () => set({ 
        timerSeconds: 0, 
        isRunning: false, 
        timerStartedAt: null 
      }),

      startRestTimer: () => set((state) => ({
        isRestTimerRunning: true,
        restTimerSeconds: state.restTimerDuration,
        restTimerStartedAt: Date.now()
      })),

      stopRestTimer: () => set({
        isRestTimerRunning: false,
        restTimerSeconds: 0,
        restTimerStartedAt: null
      }),

      setRestTimerDuration: (seconds) => set({ restTimerDuration: seconds }),

      dismissRestTimerAlert: () => set({ restTimerFinished: false }),

      updateRestTimer: () => {
        const state = get();
        if (state.isRestTimerRunning && state.restTimerStartedAt) {
          const elapsed = Math.floor((Date.now() - state.restTimerStartedAt) / 1000);
          const remaining = Math.max(0, state.restTimerDuration - elapsed);
          
          if (remaining === 0) {
            set({ isRestTimerRunning: false, restTimerSeconds: 0, restTimerStartedAt: null, restTimerFinished: true });
          } else {
            set({ restTimerSeconds: remaining });
          }
        }
      },
      
      saveWipSession: (session) => set((state) => ({ 
        wipSession: { ...state.wipSession, ...session } 
      })),
      
      clearWipSession: () => set({ 
        wipSession: null, 
        timerSeconds: 0, 
        isRunning: false, 
        timerStartedAt: null,
        activeRoutineId: null,
        restTimerSeconds: 0,
        isRestTimerRunning: false,
        restTimerStartedAt: null,
        restTimerFinished: false
      }),
      
      startRoutine: (id) => set({ activeRoutineId: id }),
      endRoutine: () => set({ activeRoutineId: null }),
    }),
    {
      name: 'workout-session-storage',
    }
  )
);
