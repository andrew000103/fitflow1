/**
 * 식단 음식 데이터 레이어.
 *
 * 이 파일은 사용자 소유 음식(`foods`) CRUD와 사용자 음식 검색만 담당한다.
 * 공용 음식 검색은 `src/lib/food-search.ts` + `src/lib/food-api.ts`로 이동했다.
 *
 * 실행 필요 SQL (Supabase SQL Editor):
 *
 * -- foods: 사용자 음식만 저장/조회
 * CREATE TABLE IF NOT EXISTS public.foods (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 *   name_ko TEXT,
 *   name_en TEXT,
 *   product_name TEXT NOT NULL,
 *   brand TEXT,
 *   calories_per_100g NUMERIC NOT NULL,
 *   carbs_per_100g NUMERIC NOT NULL DEFAULT 0,
 *   protein_per_100g NUMERIC NOT NULL DEFAULT 0,
 *   fat_per_100g NUMERIC NOT NULL DEFAULT 0,
 *   sodium_per_100g NUMERIC,
 *   sugar_per_100g NUMERIC,
 *   source TEXT NOT NULL DEFAULT 'user',
 *   visibility TEXT NOT NULL DEFAULT 'private',
 *   notes TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */

import { supabase } from './supabase';
import { FoodItem, FoodSource } from '../types/food';
import {
  compareRankableFoodNames,
  normalizeSearchText,
  scoreFoodRow,
} from './food-search-ranking';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FoodRow {
  id: string;
  name_ko: string | null;
  name_en: string | null;
  product_name: string;
  brand: string | null;
  calories_per_100g: number;
  carbs_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  sodium_per_100g: number | null;
  sugar_per_100g: number | null;
  source: 'openfoodfacts' | 'mfds' | 'usda' | 'user';
  off_id: string | null;
}

export interface SaveUserFoodParams {
  name_ko: string;
  brand?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  sodium_per_100g?: number;
  sugar_per_100g?: number;
  notes?: string;
  userId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SELECT_COLS =
  'id, name_ko, name_en, product_name, brand, calories_per_100g, carbs_per_100g, protein_per_100g, fat_per_100g, sodium_per_100g, sugar_per_100g, source, off_id';

function escapeLike(value: string) {
  return value.replace(/[%_]/g, (char) => `\\${char}`);
}

function makeFuzzyLike(value: string) {
  const compact = value.replace(/\s+/g, '');
  if (!compact) return '';
  return compact
    .split('')
    .map((char) => escapeLike(char))
    .join('%');
}

function getPrimaryDisplayName(row: FoodRow) {
  return row.name_ko ?? row.product_name ?? '';
}

// ─── 사용자 음식 검색 ────────────────────────────────────────────────────────

async function searchUserFoods(query: string, userId: string): Promise<FoodRow[]> {
  const trimmed = query.trim();
  if (!trimmed || !userId.trim()) return [];

  const q = `%${escapeLike(trimmed)}%`;
  const fuzzy = `%${makeFuzzyLike(trimmed)}%`;
  const normalizedQuery = normalizeSearchText(trimmed);

  const orClauses = [
    `name_ko.ilike.${q}`,
    `name_en.ilike.${q}`,
    `product_name.ilike.${q}`,
    `brand.ilike.${q}`,
  ];

  if (normalizedQuery.length >= 2) {
    orClauses.push(
      `name_ko.ilike.${fuzzy}`,
      `name_en.ilike.${fuzzy}`,
      `product_name.ilike.${fuzzy}`,
      `brand.ilike.${fuzzy}`,
    );
  }

  const { data, error } = await supabase
    .from('foods')
    .select(SELECT_COLS)
    .eq('user_id', userId)
    .eq('source', 'user')
    .or(orClauses.join(','))
    .order('updated_at', { ascending: false })
    .limit(120);

  if (error) throw error;

  const rows = ((data as FoodRow[]) ?? [])
    .filter((row) => scoreFoodRow(row, normalizedQuery) > 0)
    .sort((a, b) => {
      const scoreDiff = scoreFoodRow(b, normalizedQuery) - scoreFoodRow(a, normalizedQuery);
      if (scoreDiff !== 0) return scoreDiff;
      return compareRankableFoodNames(a, b, getPrimaryDisplayName);
    });

  return rows.slice(0, 50);
}

// ─── 통합 호환 API ───────────────────────────────────────────────────────────

export async function searchFoods(query: string, userId?: string): Promise<FoodRow[]> {
  if (!userId) return [];
  return searchUserFoods(query, userId);
}

export async function searchUserFoodsOnly(query: string, userId: string): Promise<FoodRow[]> {
  return searchUserFoods(query, userId);
}

// ─── 직접 입력 저장 ───────────────────────────────────────────────────────────

export async function saveUserFood(params: SaveUserFoodParams): Promise<FoodRow> {
  const { data, error } = await supabase
    .from('foods')
    .insert({
      name_ko: params.name_ko,
      name_en: null,
      product_name: params.name_ko,
      brand: params.brand ?? null,
      calories_per_100g: params.calories_per_100g,
      protein_per_100g: params.protein_per_100g,
      carbs_per_100g: params.carbs_per_100g,
      fat_per_100g: params.fat_per_100g,
      sodium_per_100g: params.sodium_per_100g ?? null,
      sugar_per_100g: params.sugar_per_100g ?? null,
      source: 'user',
      visibility: 'private',
      user_id: params.userId,
      off_id: null,
      notes: params.notes ?? null,
    })
    .select(SELECT_COLS)
    .single();

  if (error) throw error;
  return data as FoodRow;
}

// ─── 커스텀 음식 CRUD (FoodRow 기반) ────────────────────────────────────────

export interface UpdateUserFoodParams {
  name_ko?: string;
  brand?: string | null;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  sodium_per_100g?: number | null;
  sugar_per_100g?: number | null;
  notes?: string | null;
}

export async function getFoodById(id: string): Promise<FoodRow | null> {
  const { data } = await supabase
    .from('foods')
    .select(SELECT_COLS)
    .eq('id', id)
    .maybeSingle();
  return (data as FoodRow | null) ?? null;
}

export async function updateUserFood(id: string, params: UpdateUserFoodParams): Promise<FoodRow> {
  const { data, error } = await supabase
    .from('foods')
    .update({ ...params, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as FoodRow;
}

export async function getUserFoods(userId: string): Promise<FoodRow[]> {
  const { data } = await supabase
    .from('foods')
    .select(SELECT_COLS)
    .eq('user_id', userId)
    .eq('source', 'user')
    .order('updated_at', { ascending: false })
    .limit(50);
  return (data as FoodRow[]) ?? [];
}

// ─── FoodRow → FoodItem 변환 헬퍼 ────────────────────────────────────────────

function formatMfdsName(name: string): string {
  if (!name.includes('_')) return name;
  const idx = name.indexOf('_');
  const category = name.slice(0, idx).trim();
  const item = name.slice(idx + 1).trim();
  return item ? `${item} (${category})` : name;
}

export function foodRowToFoodItem(row: FoodRow): FoodItem {
  const source: FoodSource =
    row.source === 'openfoodfacts' ? 'openfoodfacts'
    : row.source === 'mfds' ? 'mfds'
    : row.source === 'usda' ? 'usda'
    : 'custom';
  const rawName = row.name_ko ?? row.product_name;
  return {
    id: row.id,
    name: source === 'mfds' ? formatMfdsName(rawName) : rawName,
    brand: row.brand || undefined,
    source,
    nutrition_basis: { amount: 100, unit: 'g', label: '100g' },
    nutrients: {
      calories: row.calories_per_100g ?? 0,
      protein_g: row.protein_per_100g ?? 0,
      carbs_g: row.carbs_per_100g ?? 0,
      fat_g: row.fat_per_100g ?? 0,
      sodium_mg: row.sodium_per_100g ?? undefined,
      sugar_g: row.sugar_per_100g ?? undefined,
    },
  };
}
