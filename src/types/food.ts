export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
};

export type FoodSource = 'openfoodfacts' | 'mfds' | 'usda' | 'custom';
export type NutritionUnit = 'g' | 'mL' | 'serving';
export type FoodVisibility = 'private' | 'public';

export const NUTRITION_UNIT_LABEL: Record<NutritionUnit, string> = {
  g: 'g',
  mL: 'mL',
  serving: '인분',
};

export interface OFFProduct {
  code: string;
  product_name: string;
  product_name_ko?: string;
  brands?: string;
  serving_size?: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    'energy-kcal_serving'?: number;
    'proteins_100g'?: number;
    'carbohydrates_100g'?: number;
    'fat_100g'?: number;
    'fiber_100g'?: number;
    'sodium_100g'?: number;
  };
  image_front_small_url?: string;
}

export interface OFFSearchResponse {
  products: OFFProduct[];
  count: number;
  page: number;
}

export interface FoodNutrients {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sugar_g?: number;
  fiber_g?: number;
  saturated_fat_g?: number;
  trans_fat_g?: number;
  sodium_mg?: number;
  cholesterol_mg?: number;
}

export interface NutritionBasis {
  amount: number;
  unit: NutritionUnit;
  label: string;
}

export interface ServingInfo {
  amount: number;
  unit: NutritionUnit;
  label: string;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  source: FoodSource;
  visibility?: FoodVisibility;
  nutrients: FoodNutrients;
  nutrition_basis: NutritionBasis;
  serving?: ServingInfo;
  notes?: string;
}

export interface MealEntry {
  id: string;
  food: FoodItem;
  amount: number;
  amount_unit: NutritionUnit;
  meal_type: MealType;
  logged_at: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sugar_g?: number;
  fiber_g?: number;
  saturated_fat_g?: number;
  trans_fat_g?: number;
  sodium_mg?: number;
  cholesterol_mg?: number;
}
