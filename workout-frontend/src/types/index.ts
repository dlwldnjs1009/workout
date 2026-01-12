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
