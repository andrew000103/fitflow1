import { foodApiEnv, hasMfdsApiKey } from './food-env';
import { FoodItem } from '../types/food';

const BASE = 'https://apis.data.go.kr/1471000/FoodNtrIrdntInfoService1';
const ENDPOINT = '/getFoodNtrItdntList1';

interface MfdsRow {
  DESC_KOR?: string;
  SERVING_SIZE?: string;
  NUTR_CONT1?: string;
  NUTR_CONT2?: string;
  NUTR_CONT3?: string;
  NUTR_CONT4?: string;
  BGN_YEAR?: string;
  ANIMAL_PLANT?: string;
  MAKER_NAME?: string;
}

interface MfdsApiResponse {
  body?: {
    items?: Array<MfdsRow> | { item?: Array<MfdsRow> };
  };
}

function parseNumber(value?: string) {
  if (!value) return 0;
  const parsed = Number.parseFloat(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

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

function extractRows(data: MfdsApiResponse): MfdsRow[] {
  const items = data.body?.items;
  if (!items) return [];
  if (Array.isArray(items)) return items;
  return Array.isArray(items.item) ? items.item : [];
}

export async function searchMfdsFoods(query: string): Promise<FoodItem[]> {
  if (!hasMfdsApiKey() || !query.trim()) return [];

  const params = new URLSearchParams({
    serviceKey: foodApiEnv.mfdsApiKey,
    desc_kor: query,
    pageNo: '1',
    numOfRows: '20',
    type: 'json',
  });

  const res = await fetch(`${BASE}${ENDPOINT}?${params}`);
  if (!res.ok) {
    throw new Error('식약처 검색 실패');
  }

  const data = (await res.json()) as MfdsApiResponse;
  return extractRows(data)
    .map(normalizeMfdsItem)
    .filter((item): item is FoodItem => item !== null);
}
