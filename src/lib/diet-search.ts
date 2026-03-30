/**
 * 식단 음식 검색 — Supabase-first, OFFs fallback
 *
 * 실행 필요 SQL (Supabase SQL Editor):
 *
 * -- 1. foods 테이블
 * CREATE TABLE IF NOT EXISTS public.foods (
 *   id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 *   name_ko          TEXT,
 *   name_en          TEXT,
 *   product_name     TEXT NOT NULL,
 *   brand            TEXT,
 *   calories_per_100g NUMERIC NOT NULL,
 *   carbs_per_100g   NUMERIC NOT NULL DEFAULT 0,
 *   protein_per_100g NUMERIC NOT NULL DEFAULT 0,
 *   fat_per_100g     NUMERIC NOT NULL DEFAULT 0,
 *   sodium_per_100g  NUMERIC,
 *   sugar_per_100g   NUMERIC,
 *   source           TEXT NOT NULL DEFAULT 'user',
 *   visibility       TEXT NOT NULL DEFAULT 'public',
 *   off_id           TEXT,
 *   notes            TEXT,
 *   created_at       TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at       TIMESTAMPTZ DEFAULT NOW()
 * );
 * CREATE UNIQUE INDEX IF NOT EXISTS foods_off_id_idx
 *   ON public.foods (off_id) WHERE off_id IS NOT NULL;
 * ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Read public foods" ON public.foods
 *   FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);
 * CREATE POLICY "Insert foods" ON public.foods
 *   FOR INSERT WITH CHECK (
 *     auth.role() = 'authenticated' AND (
 *       user_id = auth.uid() OR
 *       (user_id IS NULL AND source = 'openfoodfacts')
 *     )
 *   );
 * CREATE POLICY "Update own foods" ON public.foods
 *   FOR UPDATE USING (auth.uid() = user_id);
 *
 * -- 2. meal_items 테이블
 * CREATE TABLE IF NOT EXISTS public.meal_items (
 *   id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   food_id    UUID REFERENCES public.foods(id) ON DELETE SET NULL,
 *   meal_type  TEXT NOT NULL,
 *   date       DATE NOT NULL,
 *   amount_g   NUMERIC NOT NULL,
 *   calories   NUMERIC NOT NULL,
 *   protein_g  NUMERIC NOT NULL DEFAULT 0,
 *   carbs_g    NUMERIC NOT NULL DEFAULT 0,
 *   fat_g      NUMERIC NOT NULL DEFAULT 0,
 *   sodium_mg  NUMERIC,
 *   sugar_g    NUMERIC,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users own meal items" ON public.meal_items
 *   FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
 */

import { supabase } from './supabase';
import { FoodItem, FoodSource } from '../types/food';

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

export interface SaveMealItemParams {
  userId: string;
  foodId: string;
  mealType: string;
  date: string;
  amountG: number;
  food: FoodRow;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SELECT_COLS =
  'id, name_ko, name_en, product_name, brand, calories_per_100g, carbs_per_100g, protein_per_100g, fat_per_100g, sodium_per_100g, sugar_per_100g, source, off_id';

/** OFFs 캐시 전 임시 ID 형식 */
export function isTempId(id: string) {
  return id.startsWith('off::');
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

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

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[\s_()[\]{}\-./]/g, '');
}

const PROCESSED_FOOD_KEYWORDS = [
  '샐러드',
  '소시지',
  '볶음밥',
  '도시락',
  '만두',
  '스낵',
  '칩',
  '바',
  '프로틴',
  '쉐이크',
  '음료',
  '주스',
  '시리얼',
  '과자',
  '볼',
  '큐브',
  '너겟',
  '패티',
  '햄',
  '훈제',
  '슬라이스',
  '양념',
  '맛',
  '소스',
  '토핑',
  '랩',
  '브리또',
  '피자',
  '버거',
  '샌드위치',
  '김밥',
];

const RAW_FOOD_PREFIXES = ['생', '국내산', '무가공', '자연산', '신선한', '유기농'];

function tokenizeSearchText(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .split(/[\s_()[\]{}\-./]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function getPrimaryDisplayName(row: FoodRow) {
  return row.name_ko ?? row.product_name ?? '';
}

function startsWithWordBoundary(text: string, query: string) {
  if (!text || !query) return false;
  if (text.startsWith(query)) return true;

  const tokens = tokenizeSearchText(text);
  return tokens.some((token) => token.startsWith(query));
}

function getLengthClosenessBonus(text: string, query: string) {
  if (!text || !query) return 0;
  const diff = Math.abs(text.length - query.length);
  return Math.max(0, 18 - diff * 2);
}

function getProcessedFoodPenalty(row: FoodRow, normalizedQuery: string) {
  const name = getPrimaryDisplayName(row);
  const normalizedName = normalizeSearchText(name);
  const normalizedBrand = normalizeSearchText(row.brand);

  let penalty = 0;
  for (const keyword of PROCESSED_FOOD_KEYWORDS) {
    const normalizedKeyword = normalizeSearchText(keyword);
    if (!normalizedKeyword) continue;
    if (normalizedName.includes(normalizedKeyword)) {
      penalty += normalizedQuery === normalizedKeyword ? 0 : 18;
    }
    if (normalizedBrand.includes(normalizedKeyword)) {
      penalty += 4;
    }
  }

  return penalty;
}

function getRawFoodBonus(row: FoodRow, normalizedQuery: string) {
  const primaryName = getPrimaryDisplayName(row);
  const normalizedName = normalizeSearchText(primaryName);
  if (!normalizedName) return 0;

  if (normalizedName === normalizedQuery) return 26;

  for (const prefix of RAW_FOOD_PREFIXES) {
    const normalizedPrefix = normalizeSearchText(prefix);
    if (normalizedName === `${normalizedPrefix}${normalizedQuery}`) {
      return 18;
    }
  }

  return 0;
}

function scoreFieldMatch(value: string | null | undefined, normalizedQuery: string, weight: number) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return 0;

  if (normalized === normalizedQuery) return weight + 120;
  if (startsWithWordBoundary(normalized, normalizedQuery)) return weight + 75;
  if (normalized.startsWith(normalizedQuery)) return weight + 60;
  if (normalized.includes(normalizedQuery)) return weight + 30;

  return 0;
}

function scoreFoodRow(row: FoodRow, normalizedQuery: string) {
  const primaryName = getPrimaryDisplayName(row);
  const normalizedPrimaryName = normalizeSearchText(primaryName);
  const normalizedBrand = normalizeSearchText(row.brand);

  let score = 0;

  score += scoreFieldMatch(row.name_ko, normalizedQuery, 40);
  score += scoreFieldMatch(row.product_name, normalizedQuery, 34);
  score += scoreFieldMatch(row.name_en, normalizedQuery, 18);
  score += scoreFieldMatch(row.brand, normalizedQuery, 4);

  if (normalizedPrimaryName === normalizedQuery) score += 40;
  score += getLengthClosenessBonus(normalizedPrimaryName, normalizedQuery);
  score += getRawFoodBonus(row, normalizedQuery);

  if (normalizedBrand === normalizedQuery) {
    score -= 12;
  }

  score -= getProcessedFoodPenalty(row, normalizedQuery);

  if (row.source === 'user') score += 6;
  else if (row.source === 'mfds') score += 4;
  else if (row.source === 'usda') score += 2;
  else if (row.source === 'openfoodfacts') score += 1;

  return score;
}

// ─── 1. Supabase DB 검색 ──────────────────────────────────────────────────────

async function searchDb(query: string): Promise<FoodRow[]> {
  const trimmed = query.trim();
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
    .or(orClauses.join(','))
    .order('updated_at', { ascending: false })
    .limit(120);

  if (error) throw error;

  const rows = ((data as FoodRow[]) ?? [])
    .filter((row) => scoreFoodRow(row, normalizedQuery) > 0)
    .sort((a, b) => {
      const scoreDiff = scoreFoodRow(b, normalizedQuery) - scoreFoodRow(a, normalizedQuery);
      if (scoreDiff !== 0) return scoreDiff;

      const aName = normalizeSearchText(getPrimaryDisplayName(a));
      const bName = normalizeSearchText(getPrimaryDisplayName(b));
      const lengthDiff = aName.length - bName.length;
      if (lengthDiff !== 0) return lengthDiff;

      return a.product_name.localeCompare(b.product_name, 'ko');
    });

  return rows.slice(0, 50);
}

// ─── 2. Open Food Facts API ───────────────────────────────────────────────────

async function fetchOFF(query: string): Promise<FoodRow[]> {
  const params = new URLSearchParams({
    search_terms: query,
    json: 'true',
    fields: 'id,product_name,brands,nutriments',
    page_size: '10',
  });

  const res = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?${params}`,
  );
  if (!res.ok) return [];

  const data = await res.json();
  const products: any[] = data.products ?? [];

  return products
    .map((p): FoodRow | null => {
      const n = p.nutriments ?? {};
      const cal = n['energy-kcal_100g'];
      if (!cal || cal <= 0) return null;
      const name = (p.product_name as string | undefined)?.trim();
      if (!name) return null;

      return {
        id: `off::${p.id}`,
        name_ko: null,
        name_en: name,
        product_name: name,
        brand: (p.brands as string | undefined)?.split(',')[0]?.trim() || null,
        calories_per_100g: Math.round(cal),
        carbs_per_100g: round1(n['carbohydrates_100g'] ?? 0),
        protein_per_100g: round1(n['proteins_100g'] ?? 0),
        fat_per_100g: round1(n['fat_100g'] ?? 0),
        sodium_per_100g:
          n['sodium_100g'] != null ? round1(n['sodium_100g'] * 1000) : null,
        sugar_per_100g:
          n['sugars_100g'] != null ? round1(n['sugars_100g']) : null,
        source: 'openfoodfacts',
        off_id: String(p.id),
      };
    })
    .filter((item): item is FoodRow => item !== null);
}

// ─── 3. OFFs 결과 → Supabase 캐시 ────────────────────────────────────────────

async function cacheToDb(rows: FoodRow[]): Promise<FoodRow[]> {
  const offIds = rows
    .map((r) => r.off_id)
    .filter((id): id is string => id !== null);
  if (offIds.length === 0) return rows;

  // 이미 저장된 항목 일괄 조회
  const { data: existing } = await supabase
    .from('foods')
    .select('id, off_id')
    .in('off_id', offIds);

  const existingMap = new Map(
    (existing ?? []).map((e: any) => [e.off_id as string, e.id as string]),
  );

  // 없는 것만 삽입
  const toInsert = rows.filter(
    (r) => r.off_id && !existingMap.has(r.off_id),
  );

  if (toInsert.length > 0) {
    const { data: inserted } = await supabase
      .from('foods')
      .insert(
        toInsert.map((r) => ({
          name_ko: r.name_ko,
          name_en: r.name_en,
          product_name: r.product_name,
          brand: r.brand,
          calories_per_100g: r.calories_per_100g,
          carbs_per_100g: r.carbs_per_100g,
          protein_per_100g: r.protein_per_100g,
          fat_per_100g: r.fat_per_100g,
          sodium_per_100g: r.sodium_per_100g,
          sugar_per_100g: r.sugar_per_100g,
          source: 'openfoodfacts',
          visibility: 'public',
          user_id: null,
          off_id: r.off_id,
        })),
      )
      .select('id, off_id');

    (inserted ?? []).forEach((item: any) => {
      existingMap.set(item.off_id as string, item.id as string);
    });
  }

  // 실제 UUID로 교체
  return rows.map((r) => ({
    ...r,
    id:
      r.off_id && existingMap.has(r.off_id)
        ? existingMap.get(r.off_id)!
        : r.id,
  }));
}

// ─── 통합 검색 ────────────────────────────────────────────────────────────────

export async function searchFoods(query: string): Promise<FoodRow[]> {
  if (!query.trim()) return [];

  // 1. Supabase 먼저
  try {
    const dbResults = await searchDb(query);
    if (dbResults.length > 0) return dbResults;
  } catch {
    // DB 오류 시 OFFs로 fallback
  }

  // 2. Open Food Facts
  let offResults: FoodRow[];
  try {
    offResults = await fetchOFF(query);
  } catch {
    return [];
  }

  if (offResults.length === 0) return [];

  // 3. 결과 캐시 (실패해도 OFFs 결과 반환)
  try {
    return await cacheToDb(offResults);
  } catch {
    return offResults;
  }
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
      visibility: 'public',
      user_id: params.userId,
      off_id: null,
      notes: params.notes ?? null,
    })
    .select(SELECT_COLS)
    .single();

  if (error) throw error;
  return data as FoodRow;
}

// ─── meal_items 저장 ──────────────────────────────────────────────────────────

export async function saveMealItem(params: SaveMealItemParams): Promise<void> {
  const ratio = params.amountG / 100;
  const { food } = params;

  const { error } = await supabase.from('meal_items').insert({
    user_id: params.userId,
    food_id: isTempId(params.foodId) ? null : params.foodId,
    meal_type: params.mealType,
    date: params.date,
    amount_g: params.amountG,
    calories: Math.round(food.calories_per_100g * ratio),
    protein_g: round1(food.protein_per_100g * ratio),
    carbs_g: round1(food.carbs_per_100g * ratio),
    fat_g: round1(food.fat_per_100g * ratio),
    sodium_mg:
      food.sodium_per_100g != null
        ? round1(food.sodium_per_100g * ratio)
        : null,
    sugar_g:
      food.sugar_per_100g != null ? round1(food.sugar_per_100g * ratio) : null,
  });

  if (error) throw error;
}

// ─── FoodItem 기반 meal_items 저장 ────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function saveMealItemFromFoodItem(params: {
  userId: string;
  foodItem: FoodItem;
  mealType: string;
  date: string;
  amountG: number;
}): Promise<void> {
  const { userId, foodItem, mealType, date, amountG } = params;
  const ratio = amountG / 100;
  const n = foodItem.nutrients;

  const { error } = await supabase.from('meal_items').insert({
    user_id: userId,
    food_id: UUID_REGEX.test(foodItem.id) ? foodItem.id : null,
    meal_type: mealType,
    date,
    amount_g: amountG,
    calories: Math.round(n.calories * ratio),
    protein_g: round1(n.protein_g * ratio),
    carbs_g: round1(n.carbs_g * ratio),
    fat_g: round1(n.fat_g * ratio),
    sodium_mg: n.sodium_mg != null ? round1(n.sodium_mg * ratio) : null,
    sugar_g: n.sugar_g != null ? round1(n.sugar_g * ratio) : null,
  });

  if (error) throw error;
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
