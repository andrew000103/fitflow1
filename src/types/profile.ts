export type ProfileGender = 'male' | 'female' | 'other';
export type GoalType = 'loss' | 'maintain' | 'gain';

export const PROFILE_GENDER_LABEL: Record<ProfileGender, string> = {
  male: '남성',
  female: '여성',
  other: '기타',
};

export const GOAL_TYPE_LABEL: Record<GoalType, string> = {
  loss: '감량',
  maintain: '유지',
  gain: '증량',
};

export interface UserProfileRecord {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  gender: ProfileGender | null;
  created_at: string;
  updated_at: string;
}

export interface UserGoalRecord {
  id: string;
  user_id: string;
  goal_type: GoalType | null;
  calories_target: number | null;
  carbs_target_g: number | null;
  protein_target_g: number | null;
  fat_target_g: number | null;
  created_at: string;
  updated_at: string;
}

export interface BodyWeightRecord {
  id: string;
  user_id: string;
  measured_at: string;
  weight_kg: number;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileInput {
  nickname?: string;
  avatar_url?: string;
  height_cm?: number;
  weight_kg?: number;
  age?: number;
  gender?: ProfileGender;
}

export interface UserGoalInput {
  goal_type?: GoalType;
  calories_target?: number;
  carbs_target_g?: number;
  protein_target_g?: number;
  fat_target_g?: number;
}

export interface BodyWeightInput {
  weight_kg: number;
  measured_at?: string;
  body_fat_pct?: number;
  muscle_mass_kg?: number;
  notes?: string;
}
