import { create } from 'zustand';
import type {
  PoseLandmark,
  CameraStatus,
  CameraMode,
  SquatCalibration,
  SquatPhase,
} from '../types';

/**
 * PoseStore: 포즈 감지 세션의 상태만 관리
 * 
 * 원칙: 상태 저장만 담당, 분석 로직은 hooks에서 처리
 * persist 미사용: 세션 데이터는 휘발성 (새로고침 시 초기화)
 */
interface PoseState {
  // 카메라 상태
  cameraStatus: CameraStatus;
  cameraMode: CameraMode;

  // 감지 상태
  isDetecting: boolean;
  currentLandmarks: PoseLandmark[] | null;
  fps: number;

  // 현재 분석 상태
  currentPhase: SquatPhase;
  currentKneeAngle: number;

  // 세션 결과
  repCount: number;
  lastFeedback: string[];
  sessionFormScores: number[];

  // 캘리브레이션
  calibration: SquatCalibration;
}

interface PoseActions {
  // 카메라 상태 관리
  setCameraStatus: (status: CameraStatus) => void;
  setCameraMode: (mode: CameraMode) => void;

  // 감지 상태 관리
  setIsDetecting: (detecting: boolean) => void;
  updateLandmarks: (landmarks: PoseLandmark[] | null) => void;
  setFps: (fps: number) => void;

  // 분석 상태 업데이트
  updateAnalysisState: (phase: SquatPhase, kneeAngle: number) => void;

  // 세션 결과 관리
  incrementRep: (formScore: number) => void;
  setFeedback: (feedback: string[]) => void;

  // 캘리브레이션 관리
  setCalibration: (standing: number, bottom: number) => void;
  resetCalibration: () => void;

  // 세션 초기화
  resetSession: () => void;
}

const initialCalibration: SquatCalibration = {
  standingAngle: 170,
  bottomAngle: 90,
  isCalibrated: false,
};

const initialState: PoseState = {
  cameraStatus: 'IDLE',
  cameraMode: 'FRONT',
  isDetecting: false,
  currentLandmarks: null,
  fps: 0,
  currentPhase: 'STANDING',
  currentKneeAngle: 180,
  repCount: 0,
  lastFeedback: [],
  sessionFormScores: [],
  calibration: initialCalibration,
};

export const usePoseStore = create<PoseState & PoseActions>()((set) => ({
  ...initialState,

  setCameraStatus: (status) => set({ cameraStatus: status }),

  setCameraMode: (mode) => set({ cameraMode: mode }),

  setIsDetecting: (detecting) => set({ isDetecting: detecting }),

  updateLandmarks: (landmarks) => set({ currentLandmarks: landmarks }),

  setFps: (fps) => set({ fps }),

  updateAnalysisState: (phase, kneeAngle) =>
    set({ currentPhase: phase, currentKneeAngle: kneeAngle }),

  incrementRep: (formScore) =>
    set((state) => ({
      repCount: state.repCount + 1,
      sessionFormScores: [...state.sessionFormScores, formScore],
    })),

  setFeedback: (feedback) => set({ lastFeedback: feedback }),

  setCalibration: (standing, bottom) =>
    set({
      calibration: {
        standingAngle: standing,
        bottomAngle: bottom,
        isCalibrated: true,
      },
    }),

  resetCalibration: () =>
    set({
      calibration: initialCalibration,
    }),

  resetSession: () =>
    set({
      ...initialState,
      // 카메라 모드는 유지
      cameraMode: initialState.cameraMode,
    }),
}));

// 선택자 (Selector) - 자주 사용되는 계산된 값
export const selectAverageFormScore = (state: PoseState): number => {
  if (state.sessionFormScores.length === 0) return 0;
  const sum = state.sessionFormScores.reduce((a, b) => a + b, 0);
  return Math.round(sum / state.sessionFormScores.length);
};

export const selectIsSessionActive = (state: PoseState): boolean => {
  return state.cameraStatus === 'ACTIVE' && state.isDetecting;
};
