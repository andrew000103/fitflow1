import { FoodItem, MealEntry, MealType, NutritionUnit } from '../types/food';
import { supabase } from './supabase';

// ─── meal_type 매핑 ───────────────────────────────────────────────────────────

const MEAL_TYPE_KO: Record<MealType, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
};

const MEAL_TYPE_EN: Record<string, MealType> = {
  '아침': 'breakfast',
  '점심': 'lunch',
  '저녁': 'dinner',
  '간식': 'snack',
};

// ─── 날짜 범위 헬퍼 ────────────────────────────────────────────────────────────

function dateRange(date: string): { start: string; end: string } {
  return {
    start: new Date(`${date}T00:00:00`).toISOString(),
    end: new Date(`${date}T23:59:59.999`).toISOString(),
  };
}

// ─── getMealLogId ─────────────────────────────────────────────────────────────
// 해당 날짜 + meal_type 의 meal_log id를 반환. 없으면 INSERT.

async function getMealLogId(
  userId: string,
  mealType: MealType,
  date: string,
): Promise<string> {
  const { start, end } = dateRange(date);
  const mealTypeKo = MEAL_TYPE_KO[mealType];

  const { data: existing } = await supabase
    .from('meal_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('meal_type', mealTypeKo)
    .gte('logged_at', start)
    .lte('logged_at', end)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from('meal_logs')
    .insert({ user_id: userId, meal_type: mealTypeKo })
    .select('id')
    .single();

  if (error || !created?.id) throw new Error(`meal_log 생성 실패: ${error?.message}`);
  return created.id;
}

// ─── syncAddEntry ─────────────────────────────────────────────────────────────

export async function syncAddEntry(
  userId: string,
  entry: MealEntry,
  date: string,
): Promise<void> {
  const mealLogId = await getMealLogId(userId, entry.meal_type, date);

  await supabase.from('meal_items').upsert(
    {
      meal_log_id: mealLogId,
      food_id: null,
      food_json: entry.food,
      food_name: entry.food.name,
      food_source: entry.food.source,
      entry_local_id: entry.id,
      amount: entry.amount,
      amount_unit: entry.amount_unit,
      calories: entry.calories,
      protein_g: entry.protein_g,
      carbs_g: entry.carbs_g,
      fat_g: entry.fat_g,
    },
    { onConflict: 'entry_local_id' },
  );
}

// ─── syncRemoveEntry ──────────────────────────────────────────────────────────

export async function syncRemoveEntry(localId: string): Promise<void> {
  await supabase.from('meal_items').delete().eq('entry_local_id', localId);
}

// ─── syncUpdateEntry ──────────────────────────────────────────────────────────

export async function syncUpdateEntry(
  localId: string,
  amount: number,
  nutrients: { calories: number; protein_g: number; carbs_g: number; fat_g: number },
): Promise<void> {
  await supabase
    .from('meal_items')
    .update({
      amount,
      calories: nutrients.calories,
      protein_g: nutrients.protein_g,
      carbs_g: nutrients.carbs_g,
      fat_g: nutrients.fat_g,
    })
    .eq('entry_local_id', localId);
}

// ─── loadTodayEntries ─────────────────────────────────────────────────────────

export async function loadTodayEntries(
  userId: string,
  date: string,
): Promise<MealEntry[]> {
  const { start, end } = dateRange(date);

  const { data, error } = await supabase
    .from('meal_logs')
    .select(
      `id, meal_type, logged_at,
       meal_items (
         entry_local_id, food_json, amount, amount_unit,
         calories, protein_g, carbs_g, fat_g
       )`,
    )
    .eq('user_id', userId)
    .gte('logged_at', start)
    .lte('logged_at', end);

  if (error || !data) return [];

  const entries: MealEntry[] = [];

  for (const log of data) {
    const mealType: MealType = MEAL_TYPE_EN[log.meal_type] ?? 'snack';
    const items = (log.meal_items ?? []) as Array<{
      entry_local_id: string | null;
      food_json: unknown;
      amount: number;
      amount_unit: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    }>;

    for (const mi of items) {
      if (!mi.entry_local_id || !mi.food_json) continue;

      entries.push({
        id: mi.entry_local_id,
        food: mi.food_json as FoodItem,
        amount: mi.amount,
        amount_unit: mi.amount_unit as NutritionUnit,
        meal_type: mealType,
        logged_at: log.logged_at,
        calories: mi.calories,
        protein_g: mi.protein_g,
        carbs_g: mi.carbs_g,
        fat_g: mi.fat_g,
      });
    }
  }

  return entries;
}
