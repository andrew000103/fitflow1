import { supabase } from './supabase';
import {
  BodyWeightInput,
  BodyWeightRecord,
  UserGoalInput,
  UserGoalRecord,
  UserProfileInput,
  UserProfileRecord,
} from '../types/profile';

function toNullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toNullableNumber(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle();
  if (error) {
    if (error.code === 'PGRST205' || error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  return (data as UserProfileRecord | null) ?? null;
}

export async function saveUserProfile(userId: string, input: UserProfileInput) {
  const payload = {
    id: userId,
    nickname: toNullableText(input.nickname),
    avatar_url: toNullableText(input.avatar_url),
    height_cm: toNullableNumber(input.height_cm),
    weight_kg: toNullableNumber(input.weight_kg),
    age: toNullableNumber(input.age),
    gender: input.gender ?? null,
  };

  const { data, error } = await supabase.from('user_profiles').upsert(payload).select('*').single();
  if (error) throw error;

  if (typeof input.weight_kg === 'number' && Number.isFinite(input.weight_kg) && input.weight_kg > 0) {
    await syncLatestBodyWeight(userId, input.weight_kg);
  }

  return data as UserProfileRecord;
}

export async function getLatestUserGoal(userId: string) {
  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST205' || error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  return (data as UserGoalRecord | null) ?? null;
}

export async function saveUserGoal(userId: string, input: UserGoalInput, existingGoalId?: string | null) {
  const payload = {
    id: existingGoalId ?? undefined,
    user_id: userId,
    goal_type: input.goal_type ?? null,
    calories_target: toNullableNumber(input.calories_target),
    carbs_target_g: toNullableNumber(input.carbs_target_g),
    protein_target_g: toNullableNumber(input.protein_target_g),
    fat_target_g: toNullableNumber(input.fat_target_g),
  };

  const { data, error } = await supabase.from('user_goals').upsert(payload).select('*').single();
  if (error) throw error;
  return data as UserGoalRecord;
}

export async function getBodyWeights(userId: string, limit = 12) {
  const { data, error } = await supabase
    .from('body_weights')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === 'PGRST205') {
      return [];
    }
    throw error;
  }

  return (data as BodyWeightRecord[] | null) ?? [];
}

export async function addBodyWeight(userId: string, input: BodyWeightInput) {
  const payload = {
    user_id: userId,
    measured_at: input.measured_at ?? new Date().toISOString(),
    weight_kg: input.weight_kg,
    body_fat_pct: toNullableNumber(input.body_fat_pct),
    muscle_mass_kg: toNullableNumber(input.muscle_mass_kg),
    notes: toNullableText(input.notes),
  };

  const { data, error } = await supabase.from('body_weights').insert(payload).select('*').single();
  if (error) throw error;

  await supabase
    .from('user_profiles')
    .upsert({ id: userId, weight_kg: input.weight_kg })
    .select('id')
    .maybeSingle();

  return data as BodyWeightRecord;
}

async function syncLatestBodyWeight(userId: string, weightKg: number) {
  const { data: latest, error } = await supabase
    .from('body_weights')
    .select('id, measured_at, weight_kg')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  const today = new Date().toISOString().slice(0, 10);
  const latestDay = latest?.measured_at?.slice(0, 10);

  if (latest && latestDay === today && Number(latest.weight_kg) === weightKg) {
    return;
  }

  await supabase.from('body_weights').insert({
    user_id: userId,
    weight_kg: weightKg,
    measured_at: new Date().toISOString(),
  });
}
