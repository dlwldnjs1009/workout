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
