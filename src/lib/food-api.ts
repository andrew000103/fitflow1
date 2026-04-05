// src/lib/food-api.ts
import { FoodItem } from '../types/food';
import { supabase } from './supabase';

const FUNCTION_NAME = 'search-food';

/**
 * Searches for food items by calling the 'search-food' Supabase Edge Function.
 *
 * @param query The search term for food.
 * @returns A promise that resolves to an array of FoodItem objects.
 * @throws An error if the function invocation fails or returns an error.
 */
export async function searchFoodFromApi(query: string, page: number): Promise<FoodItem[]> {
  if (!query.trim()) {
    return [];
  }

  const { data, error } = await supabase.functions.invoke<FoodItem[]>(FUNCTION_NAME, {
    body: { query, page },
  });

  if (error) {
    console.error(`Error invoking ${FUNCTION_NAME}:`, error);
    throw new Error('음식 검색 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  }

  if (!data) {
    return [];
  }

  // The data should be an array of FoodItems.
  // We can add validation here if needed (e.g., with Zod).
  return data;
}
