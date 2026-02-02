import { create } from 'zustand';
import type {
  PoseLandmark,
  CameraStatus,
  CameraMode,
  SquatCalibration,
  SquatPhase,
  ExerciseCategory,
  BackExerciseType,
  PullingPhase,
  BackCalibration,
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

  // 운동 선택
  exerciseCategory: ExerciseCategory;
  backExerciseType: BackExerciseType;

  // 감지 상태
  isDetecting: boolean;
  currentLandmarks: PoseLandmark[] | null;
  fps: number;

  // 현재 분석 상태 (스쿼트)
  currentPhase: SquatPhase;
  currentKneeAngle: number;

  // 현재 분석 상태 (등 운동)
  pullingPhase: PullingPhase;

  // 세션 결과
  repCount: number;
  lastFeedback: string[];
  sessionFormScores: number[];

  // 캘리브레이션 (스쿼트)
  calibration: SquatCalibration;

  // 캘리브레이션 (등 운동)
  backCalibration: BackCalibration;
}

interface PoseActions {
  // 카메라 상태 관리
  setCameraStatus: (status: CameraStatus) => void;
  setCameraMode: (mode: CameraMode) => void;

  // 운동 선택
  setExerciseCategory: (category: ExerciseCategory) => void;
  setBackExerciseType: (type: BackExerciseType) => void;

  // 감지 상태 관리
  setIsDetecting: (detecting: boolean) => void;
  updateLandmarks: (landmarks: PoseLandmark[] | null) => void;
  setFps: (fps: number) => void;

  // 분석 상태 업데이트 (스쿼트)
  updateAnalysisState: (phase: SquatPhase, kneeAngle: number) => void;

  // 분석 상태 업데이트 (등 운동)
  updatePullingPhase: (phase: PullingPhase) => void;

  // 세션 결과 관리
  incrementRep: (formScore: number) => void;
  setFeedback: (feedback: string[]) => void;

  // 캘리브레이션 관리 (스쿼트)
  setCalibration: (standing: number, bottom: number) => void;
  resetCalibration: () => void;

  // 캘리브레이션 관리 (등 운동)
  setBackCalibration: (extended: number, contracted: number, torsoBase: number) => void;
  resetBackCalibration: () => void;

  // 세션 초기화
  resetSession: () => void;
}

const initialCalibration: SquatCalibration = {
  standingAngle: 170,
  bottomAngle: 90,
  isCalibrated: false,
};

const initialBackCalibration: BackCalibration = {
  extendedPosition: 0,
  contractedPosition: 0,
  torsoBaseAngle: 0,
  isCalibrated: false,
};

const initialState: PoseState = {
  cameraStatus: 'IDLE',
  cameraMode: 'FRONT',
  exerciseCategory: 'SQUAT',
  backExerciseType: 'SEATED_ROW',
  isDetecting: false,
  currentLandmarks: null,
  fps: 0,
  currentPhase: 'STANDING',
  currentKneeAngle: 180,
  pullingPhase: 'EXTENDED',
  repCount: 0,
  lastFeedback: [],
  sessionFormScores: [],
  calibration: initialCalibration,
  backCalibration: initialBackCalibration,
};

export const usePoseStore = create<PoseState & PoseActions>()((set) => ({
  ...initialState,

  setCameraStatus: (status) => set({ cameraStatus: status }),

  setCameraMode: (mode) => set({ cameraMode: mode }),

  setExerciseCategory: (category) => set({ exerciseCategory: category }),

  setBackExerciseType: (type) => set({ backExerciseType: type }),

  setIsDetecting: (detecting) => set({ isDetecting: detecting }),

  updateLandmarks: (landmarks) => set({ currentLandmarks: landmarks }),

  setFps: (fps) => set({ fps }),

  updateAnalysisState: (phase, kneeAngle) =>
    set({ currentPhase: phase, currentKneeAngle: kneeAngle }),

  updatePullingPhase: (phase) => set({ pullingPhase: phase }),

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

  setBackCalibration: (extended, contracted, torsoBase) =>
    set({
      backCalibration: {
        extendedPosition: extended,
        contractedPosition: contracted,
        torsoBaseAngle: torsoBase,
        isCalibrated: true,
      },
    }),

  resetBackCalibration: () =>
    set({
      backCalibration: initialBackCalibration,
    }),

  resetSession: () =>
    set((state) => ({
      ...initialState,
      // 카메라 모드와 운동 선택은 유지
      cameraMode: state.cameraMode,
      exerciseCategory: state.exerciseCategory,
      backExerciseType: state.backExerciseType,
    })),
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
