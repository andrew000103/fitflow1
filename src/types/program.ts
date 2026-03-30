export interface Program {
  id: string;
  user_id: string;
  creator_name: string | null;
  name: string;
  description: string | null;
  is_public: boolean;
  duration_weeks: number;
  days_per_week: number;
  created_at: string;
}

export interface ProgramDay {
  id: string;
  program_id: string;
  day_number: number;
  name: string | null;
}

export interface ProgramExerciseRow {
  id: string;
  program_day_id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number;
  target_reps: number;
  target_weight_kg: number;
  exercises: {
    id: string;
    name_ko: string;
    name_en: string | null;
    category: string | null;
    default_rest_seconds: number;
    is_custom: boolean;
  } | null;
}

export interface ProgramDayWithExercises extends ProgramDay {
  program_exercises: ProgramExerciseRow[];
}

export interface UserProgram {
  id: string;
  user_id: string;
  program_id: string;
  started_at: string;
  current_day: number;
  completed_sessions: number;
  is_active: boolean;
}

export interface ActiveUserProgram extends UserProgram {
  program: Program;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  birth_year: number | null;
  gender: '남성' | '여성' | '기타' | null;
}

export interface ProgramReview {
  id: string;
  program_id: string;
  user_id: string;
  weeks_completed: number;
  strength_gain: number; // 1–5
  muscle_gain: number;   // 1–5
  overall_rating: number; // 1–5
  review_text: string | null;
  reviewer_age: number | null;
  reviewer_gender: string | null;
  reviewer_display_name: string | null;
  created_at: string;
}

// Draft types for create form
export interface DraftExercise {
  tempId: string;
  name_ko: string;
  name_en: string | null;
  category: string | null;
  default_rest_seconds: number;
  is_custom: boolean;
  exercise_db_id: string | null;
  target_sets: number;
  target_reps: number;
  target_weight_kg: number;
}

export interface DraftDay {
  day_number: number;
  name: string;
  exercises: DraftExercise[];
}
