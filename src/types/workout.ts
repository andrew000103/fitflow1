export interface Exercise {
  id: string;
  name_ko: string;
  name_en: string | null;
  category: string | null;
  default_rest_seconds: number;
  is_custom: boolean;
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
