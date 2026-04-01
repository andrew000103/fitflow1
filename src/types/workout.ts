export interface Exercise {
  id: string;
  name_ko: string;
  name_en: string | null;
  category: string | null;
  default_rest_seconds: number;
  is_custom: boolean;
  visual_guide_url?: string;
  description_en?: string;
  description_ko?: string;
  overview_en?: string;
  overview_ko?: string;
  why_en?: string;
  why_ko?: string;
  how_en?: string;
  how_ko?: string;
}

export interface LocalSet {
  localId: string;
  dbId: string | null;
  set_number: number;
  weight_kg: number;
  reps: number;
  is_done: boolean;
  is_pr: boolean;
  isWarmup?: boolean;
  is_amrap?: boolean;
  tmPct?: number;
  targetReps?: number;
  isProgressionSet?: boolean;
}

export interface SessionExercise {
  exercise: Exercise;
  sets: LocalSet[];
  prevSets: Array<{ weight_kg: number; reps: number }> | null;
  note?: string;
  custom_rest_seconds?: number;
}

export interface NsunsAmrapResult {
  exerciseName: string;
  exerciseKey: string;
  currentTm: number;
  amrapReps: number;
  suggestedIncrease: number;
  newTm: number;
}

export interface SessionSummary {
  totalVolumeKg: number;
  setCount: number;
  durationSeconds: number;
  exercises: Array<{ name: string; sets: number; volume_kg: number }>;
  nsunsAmrapResults?: NsunsAmrapResult[];
  userProgramId?: string;
}

// Home dashboard summary (used in home-screen)
export interface WorkoutSummary {
  completed: boolean;
  total_volume_kg: number;
  set_count: number;
}

export interface ExerciseHistorySet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  volumeKg: number;
}

export interface ExerciseHistorySession {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  sets: ExerciseHistorySet[];
  totalVolumeKg: number;
  topWeightKg: number;
  estimatedOneRmKg: number;
  totalReps: number;
}

export interface ExerciseTrendSummary {
  sessionCount: number;
  frequency30d: number;
  avgTopWeightKg: number;
  avgVolumeKg: number;
  avgEstimatedOneRmKg: number;
  topWeightDeltaKg: number | null;
  volumeDeltaKg: number | null;
  estimatedOneRmDeltaKg: number | null;
}
