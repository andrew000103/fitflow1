import { foodApiEnv, hasUsdaApiKey } from './food-env';
import { FoodItem } from '../types/food';

const BASE = 'https://api.nal.usda.gov/fdc/v1/foods/search';

interface UsdaNutrient {
  nutrientName?: string;
  value?: number;
}

interface UsdaFood {
  fdcId: number;
  description?: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: UsdaNutrient[];
}

interface UsdaResponse {
  foods?: UsdaFood[];
}

function nutrientValue(food: UsdaFood, name: string) {
  const match = food.foodNutrients?.find((nutrient) => nutrient.nutrientName === name);
  return Number.isFinite(match?.value) ? match?.value ?? 0 : 0;
}

function normalizeUsdaFood(food: UsdaFood): FoodItem | null {
  const name = food.description?.trim();
  const calories = nutrientValue(food, 'Energy');
  if (!name || calories <= 0) return null;

  const servingUnit = food.servingSizeUnit?.toLowerCase();
  const servingSize =
    servingUnit === 'g' || servingUnit === 'gm' || servingUnit === 'grams'
      ? food.servingSize
      : undefined;

  return {
    id: `usda:${food.fdcId}`,
    name,
    brand: food.brandOwner?.trim() || undefined,
    source: 'usda',
    nutrients: {
      calories: Math.round(calories),
      protein_g: Math.round(nutrientValue(food, 'Protein') * 10) / 10,
      carbs_g: Math.round(nutrientValue(food, 'Carbohydrate, by difference') * 10) / 10,
      fat_g: Math.round(nutrientValue(food, 'Total lipid (fat)') * 10) / 10,
      fiber_g: Math.round(nutrientValue(food, 'Fiber, total dietary') * 10) / 10,
      sugar_g: Math.round(nutrientValue(food, 'Sugars, total including NLEA') * 10) / 10,
      cholesterol_mg: Math.round(nutrientValue(food, 'Cholesterol') * 10) / 10,
      sodium_mg: Math.round(nutrientValue(food, 'Sodium, Na') * 10) / 10,
    },
    nutrition_basis: {
      amount: 100,
      unit: 'g',
      label: '100g',
    },
    serving: servingSize && servingSize > 0 ? { amount: servingSize, unit: 'g', label: `${servingSize}g` } : undefined,
  };
}

export async function searchUsdaFoods(query: string): Promise<FoodItem[]> {
  if (!hasUsdaApiKey() || !query.trim()) return [];

  const params = new URLSearchParams({
    api_key: foodApiEnv.usdaApiKey,
    query,
    pageSize: '20',
    dataType: ['Foundation', 'Survey (FNDDS)', 'Branded'].join(','),
  });

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) {
    throw new Error('USDA 검색 실패');
  }

  const data = (await res.json()) as UsdaResponse;
  return (data.foods ?? [])
    .map(normalizeUsdaFood)
    .filter((item): item is FoodItem => item !== null);
}
