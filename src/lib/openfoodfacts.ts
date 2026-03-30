import { FoodItem, OFFProduct, OFFSearchResponse } from '../types/food';

const BASE = 'https://world.openfoodfacts.org';

function normalizeProduct(p: OFFProduct): FoodItem | null {
  const n = p.nutriments;
  const cal = n['energy-kcal_100g'];
  if (!cal || cal <= 0) return null;

  const name = p.product_name_ko || p.product_name;
  if (!name?.trim()) return null;

  return {
    id: p.code,
    name: name.trim(),
    brand: p.brands?.split(',')[0]?.trim(),
    source: 'openfoodfacts',
    nutrients: {
      calories: Math.round(cal),
      protein_g: Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
      carbs_g: Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
      fat_g: Math.round((n['fat_100g'] ?? 0) * 10) / 10,
      fiber_g: Math.round((n['fiber_100g'] ?? 0) * 10) / 10,
      sodium_mg: Math.round((n['sodium_100g'] ?? 0) * 1000 * 10) / 10,
    },
    nutrition_basis: {
      amount: 100,
      unit: 'g',
      label: '100g',
    },
    serving: p.serving_size
      ? {
          amount: parseFloat(p.serving_size) || 0,
          unit: 'g',
          label: p.serving_size,
        }
      : undefined,
  };
}

export async function searchOpenFoodFactsFoods(query: string, page = 1): Promise<FoodItem[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page: String(page),
    page_size: '20',
    fields: 'code,product_name,product_name_ko,brands,serving_size,nutriments',
    lc: 'ko,en',
  });

  const res = await fetch(`${BASE}/cgi/search.pl?${params}`);

  if (!res.ok) throw new Error('검색 실패');

  const data = (await res.json()) as OFFSearchResponse;
  return data.products.map(normalizeProduct).filter((f): f is FoodItem => f !== null);
}

export const searchFoods = searchOpenFoodFactsFoods;
