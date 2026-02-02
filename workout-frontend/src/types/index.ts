export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface ExerciseType {
  id: number;
  name: string;
  category: 'CHEST' | 'BACK' | 'LEGS' | 'ABS' | 'ARMS' | 'SHOULDERS' | 'CARDIO' | 'FLEXIBILITY' | 'BALANCE';
  muscleGroup: string;
  description?: string;
}

export interface WorkoutRoutine {
  id: number;
  name: string;
  description: string;
  duration: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  exerciseIds: number[];
  createdAt: string;
}

export interface ExerciseRecord {
  id?: number;
  exerciseId: number;
  exerciseName?: string;
  setNumber: number;
  reps: number;
  weight?: number;
  duration?: number;
  rpe?: number;
  completed?: boolean;
  // Pose analysis data
  poseFormScore?: number;
  poseRepCount?: number;
}

export interface WorkoutSession {
  id?: number;
  date: string;
  duration: number;
  notes?: string;
  routineId?: number;
  exercisesPerformed: ExerciseRecord[];
}

export interface CreateSessionRequest {
  date: string;
  duration: number;
  notes?: string;
  routineId?: number;
  exercisesPerformed: ExerciseRecord[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
}

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface FoodEntry {
  id?: number;
  mealType: MealType;
  foodName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface DietSession {
  id?: number;
  date: string;
  notes?: string;
  foodEntries: FoodEntry[];
  userId?: number;
}

export interface VolumeDataPoint {
  date: string;
  volume: number;
}

export interface WorkoutDashboardData {
  totalVolume: number;
  totalWorkouts: number;
  monthlyWorkouts: number;
  recentSessions: WorkoutSession[];
  volumeChartData: VolumeDataPoint[];
  heatmapStartDate: string;
  heatmapLevels: number[];
}

export interface DietDashboardData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  hasData: boolean;
}

export interface UserProfile {
  id: number;
  age?: number;
  weight?: number;
  skeletalMuscleMass?: number;
  bodyFatMass?: number;
  basalMetabolicRate?: number;
  updatedAt?: string;
}

// ===== Pose Detection Types =====

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;  // 가시성 (가림 정도, 0-1)
  presence?: number;   // 존재 확률 (있다/없다, 0-1)
}

export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

export type SquatPhase = 'STANDING' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';
export type CameraStatus = 'IDLE' | 'REQUESTING' | 'ACTIVE' | 'DENIED' | 'ERROR';
export type CameraMode = 'FRONT' | 'SIDE';
export type LandmarkConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

// ===== Back Exercise Types =====

export type ExerciseCategory = 'SQUAT' | 'BACK';

export type BackExerciseType =
  | 'LAT_PULLDOWN'      // 랫풀다운 (측면)
  | 'SEATED_ROW'        // 시티드 케이블 로우 / 머신 로우 (측면)
  | 'STRAIGHT_ARM'      // 스트레이트암 풀다운 (측면)
  | 'REAR_DELT';        // 리어 델트 머신/케이블 (정면)

export type PullingPhase =
  | 'EXTENDED'    // 시작 위치 (팔 뻗은 상태)
  | 'PULLING'     // 당기는 중
  | 'CONTRACTED'  // 최대 수축 위치
  | 'RETURNING';  // 복귀 중

// 운동별 권장 카메라 모드
export const EXERCISE_CAMERA_MODE: Record<BackExerciseType, CameraMode> = {
  LAT_PULLDOWN: 'SIDE',
  SEATED_ROW: 'SIDE',
  STRAIGHT_ARM: 'SIDE',
  REAR_DELT: 'FRONT',
};

// 운동 이름 (한글)
export const BACK_EXERCISE_NAMES: Record<BackExerciseType, string> = {
  LAT_PULLDOWN: '랫풀다운',
  SEATED_ROW: '시티드 로우',
  STRAIGHT_ARM: '스트레이트암 풀다운',
  REAR_DELT: '리어 델트',
};

export interface SquatCalibration {
  standingAngle: number;
  bottomAngle: number;
  isCalibrated: boolean;
}

export interface SquatAnalysis {
  phase: SquatPhase;
  kneeAngle: number;
  depth: 'SHALLOW' | 'PARALLEL' | 'DEEP';
  repCount: number;
  formScore: number;
  feedback: string[];
  confidence: LandmarkConfidence;
  calibration?: SquatCalibration;
}

export interface PoseSessionState {
  cameraStatus: CameraStatus;
  cameraMode: CameraMode;
  isDetecting: boolean;
  currentLandmarks: PoseLandmark[] | null;
  fps: number;
  repCount: number;
  lastFeedback: string[];
  sessionFormScores: number[];
  calibration: SquatCalibration;
}

// ===== Back Exercise Analysis Types =====

export interface BackCalibration {
  // 랫풀다운/로우: 시작점(extended)과 수축점(contracted)의 기준값
  extendedPosition: number;     // 팔 뻗은 위치 (y좌표 또는 각도)
  contractedPosition: number;   // 최대 수축 위치
  torsoBaseAngle: number;       // 상체 기준 각도 (반동 감지용)
  isCalibrated: boolean;
}

export interface BackAnalysis {
  phase: PullingPhase;
  repCount: number;
  formScore: number;
  feedback: string[];
  confidence: LandmarkConfidence;
  calibration: BackCalibration;
  // 측정값들
  currentRom: number;           // 현재 ROM (0-100%)
  torsoSwing: number;           // 상체 흔들림 정도 (도)
  tempo: number;                // 현재 rep 템포 (초)
  asymmetry?: number;           // 좌우 비대칭 (정면 모드, %)
}

// 피드백 규칙 ID
export type BackFeedbackRule =
  | 'EXCESSIVE_MOMENTUM'    // 반동 과다
  | 'TOO_FAST'              // 템포 너무 빠름
  | 'ROM_INSUFFICIENT'      // ROM 부족
  | 'SHOULDER_SHRUG'        // 어깨 으쓱
  | 'ELBOW_BEND'            // 팔꿈치 굽힘 과다 (스트레이트암)
  | 'ASYMMETRY'             // 좌우 비대칭
  | 'WRIST_ISSUE'           // 손목 꺾임
  | 'LOW_VISIBILITY'        // 가림/이탈
  | 'GOOD_FORM';            // 좋은 폼

export interface FeedbackMessage {
  rule: BackFeedbackRule;
  message: string;
  severity: 'info' | 'warning' | 'error';
}
