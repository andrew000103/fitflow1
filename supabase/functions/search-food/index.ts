// supabase/functions/search-food/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// CORS headers for preflight and actual requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definitions based on the client-side app
type FoodSource = 'openfoodfacts' | 'mfds' | 'usda' | 'custom';
type NutritionUnit = 'g' | 'mL' | 'serving';

interface FoodNutrients {
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

interface NutritionBasis {
  amount: number;
  unit: NutritionUnit;
  label: string;
}

interface ServingInfo {
  amount: number;
  unit: NutritionUnit;
  label: string;
}

interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  source: FoodSource;
  nutrients: FoodNutrients;
  nutrition_basis: NutritionBasis;
  serving?: ServingInfo;
}

interface MfdsRow {
  DESC_KOR?: string;
  SERVING_SIZE?: string;
  NUTR_CONT1?: string; // Calories
  NUTR_CONT2?: string; // Carbs
  NUTR_CONT3?: string; // Protein
  NUTR_CONT4?: string; // Fat
  BGN_YEAR?: string;
  ANIMAL_PLANT?: string;
  MAKER_NAME?: string;
}

interface MfdsApiResponse {
  body?: {
    items?: Array<MfdsRow> | { item?: Array<MfdsRow> };
  };
}

// Utility to parse numbers from string fields
function parseNumber(value?: string): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

// Normalize MFDS API item to our app's FoodItem format
function normalizeMfdsItem(item: MfdsRow, index: number): FoodItem | null {
  const name = item.DESC_KOR?.trim();
  const calories = parseNumber(item.NUTR_CONT1);
  if (!name || calories <= 0) return null;

  const servingSize = parseNumber(item.SERVING_SIZE);
  const brand = item.MAKER_NAME?.trim() || item.ANIMAL_PLANT?.trim() || item.BGN_YEAR?.trim();

  return {
    id: `mfds:${name}:${index}`,
    name,
    brand: brand || undefined,
    source: 'mfds',
    nutrients: {
      calories: Math.round(calories),
      protein_g: Math.round(parseNumber(item.NUTR_CONT3) * 10) / 10,
      carbs_g: Math.round(parseNumber(item.NUTR_CONT2) * 10) / 10,
      fat_g: Math.round(parseNumber(item.NUTR_CONT4) * 10) / 10,
    },
    nutrition_basis: {
      amount: 100,
      unit: 'g',
      label: '100g',
    },
    serving: servingSize > 0 ? { amount: servingSize, unit: 'g', label: `${servingSize}g` } : undefined,
  };
}

// Extract the array of food items from the nested API response
function extractRows(data: MfdsApiResponse): MfdsRow[] {
  const items = data.body?.items;
  if (!items) return [];
  if (Array.isArray(items)) return items;
  return Array.isArray(items.item) ? items.item : [];
}

// Main server logic
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, page } = await req.json();
    if (!query || typeof query !== 'string' || !query.trim()) {
      return new Response(JSON.stringify({ error: 'Query parameter is required and must be a non-empty string.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('MFDS_API_KEY');
    if (!apiKey) {
      throw new Error('MFDS_API_KEY is not set in environment variables.');
    }

    const pageNo = page && typeof page === 'number' && page > 0 ? String(page) : '1';

    const params = new URLSearchParams({
      serviceKey: apiKey,
      desc_kor: query.trim(),
      pageNo,
      numOfRows: '20', // Standard page size
      type: 'json',
    });

    const apiResponse = await fetch(`https://apis.data.go.kr/1471000/FoodNtrIrdntInfoService1/getFoodNtrItdntList1?${params}`);

    if (!apiResponse.ok) {
      throw new Error(`Failed to fetch from MFDS API: ${apiResponse.status} ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();
    const foodItems = extractRows(data)
      .map(normalizeMfdsItem)
      .filter((item): item is FoodItem => item !== null);

    return new Response(JSON.stringify(foodItems), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
