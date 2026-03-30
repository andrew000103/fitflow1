import { FoodItem } from '../types/food';
import type { FoodRow } from './diet-search';

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
const RAW_FOOD_PRIORITY_QUERIES = [
  '닭가슴살',
  '고구마',
  '현미밥',
  '계란',
  '달걀',
  '바나나',
  '두부',
  '오트밀',
  '감자',
  '쌀',
];

type RankableFood = {
  source: string;
  brand?: string | null;
};

type RankedFoodRow = FoodRow;
type RankedFoodItem = FoodItem;

export function normalizeSearchText(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[\s_()[\]{}\-./]/g, '');
}

function tokenizeSearchText(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .split(/[\s_()[\]{}\-./]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function hasWordBoundaryPrefixMatch(value: string | null | undefined, query: string) {
  if (!value || !query) return false;

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return false;

  return tokenizeSearchText(value).some(
    (token) => normalizeSearchText(token).startsWith(normalizedQuery),
  );
}

function isRawFoodPriorityQuery(normalizedQuery: string) {
  return RAW_FOOD_PRIORITY_QUERIES.some(
    (keyword) => normalizeSearchText(keyword) === normalizedQuery,
  );
}

function getLengthClosenessBonus(text: string, query: string) {
  if (!text || !query) return 0;
  const diff = Math.abs(text.length - query.length);
  return Math.max(0, 18 - diff * 2);
}

function getProcessedFoodPenalty(
  name: string,
  brand: string | null | undefined,
  normalizedQuery: string,
) {
  const normalizedName = normalizeSearchText(name);
  const normalizedBrand = normalizeSearchText(brand);

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

function getRawFoodBonus(primaryName: string, normalizedQuery: string) {
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

function getBrandlessBaseFoodBonus(
  brand: string | null | undefined,
  primaryName: string,
  normalizedQuery: string,
) {
  const normalizedName = normalizeSearchText(primaryName);
  const hasBrand = Boolean(brand?.trim());

  if (hasBrand || !normalizedName) return 0;
  if (normalizedName === normalizedQuery) return 18;
  if (normalizedName.startsWith(normalizedQuery)) return 8;
  return 0;
}

function getRawFoodPriorityAdjustments(
  brand: string | null | undefined,
  primaryName: string,
  normalizedQuery: string,
) {
  if (!isRawFoodPriorityQuery(normalizedQuery)) return 0;

  const normalizedName = normalizeSearchText(primaryName);
  let bonus = 0;

  bonus += getBrandlessBaseFoodBonus(brand, primaryName, normalizedQuery);
  if (normalizedName === normalizedQuery) bonus += 22;
  if (normalizedName.startsWith(normalizedQuery)) bonus += 8;
  bonus -= getProcessedFoodPenalty(primaryName, brand, normalizedQuery);

  return bonus;
}

function scoreFieldMatch(value: string | null | undefined, normalizedQuery: string, weight: number) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return 0;

  if (normalized === normalizedQuery) return weight + 120;
  if (hasWordBoundaryPrefixMatch(value, normalizedQuery)) return weight + 75;
  if (normalized.startsWith(normalizedQuery)) return weight + 60;
  if (normalized.includes(normalizedQuery)) return weight + 30;

  return 0;
}

function getSourceBonus(source: string) {
  if (source === 'user' || source === 'custom') return 6;
  if (source === 'mfds') return 4;
  if (source === 'usda') return 2;
  if (source === 'openfoodfacts') return 1;
  return 0;
}

export function scoreFoodRow(row: RankedFoodRow, normalizedQuery: string) {
  const primaryName = row.name_ko ?? row.product_name ?? '';
  const normalizedPrimaryName = normalizeSearchText(primaryName);
  const normalizedBrand = normalizeSearchText(row.brand);

  let score = 0;

  score += scoreFieldMatch(row.name_ko, normalizedQuery, 40);
  score += scoreFieldMatch(row.product_name, normalizedQuery, 34);
  score += scoreFieldMatch(row.name_en, normalizedQuery, 18);
  score += scoreFieldMatch(row.brand, normalizedQuery, 4);

  if (normalizedPrimaryName === normalizedQuery) score += 40;
  score += getLengthClosenessBonus(normalizedPrimaryName, normalizedQuery);
  score += getRawFoodBonus(primaryName, normalizedQuery);

  if (normalizedBrand === normalizedQuery) {
    score -= 12;
  }

  score -= getProcessedFoodPenalty(primaryName, row.brand, normalizedQuery);
  score += getBrandlessBaseFoodBonus(row.brand, primaryName, normalizedQuery);
  score += getRawFoodPriorityAdjustments(row.brand, primaryName, normalizedQuery);
  score += getSourceBonus(row.source);

  return score;
}

export function scoreFoodItem(item: RankedFoodItem, normalizedQuery: string) {
  const normalizedName = normalizeSearchText(item.name);
  const normalizedBrand = normalizeSearchText(item.brand);

  let score = 0;

  score += scoreFieldMatch(item.name, normalizedQuery, 40);
  score += scoreFieldMatch(item.brand, normalizedQuery, 4);

  if (normalizedName === normalizedQuery) score += 40;
  score += getLengthClosenessBonus(normalizedName, normalizedQuery);

  if (!item.brand?.trim()) {
    if (normalizedName === normalizedQuery) score += 18;
    else if (normalizedName.startsWith(normalizedQuery)) score += 8;
  }

  if (isRawFoodPriorityQuery(normalizedQuery)) {
    if (normalizedName === normalizedQuery) score += 22;
    if (normalizedName.startsWith(normalizedQuery)) score += 8;
    score -= getProcessedFoodPenalty(item.name, item.brand, normalizedQuery);
  } else {
    score -= getProcessedFoodPenalty(item.name, item.brand, normalizedQuery);
  }

  if (normalizedBrand === normalizedQuery) {
    score -= 12;
  }

  score += getSourceBonus(item.source);

  return score;
}

export function compareRankableFoodNames<T extends RankableFood>(
  a: T,
  b: T,
  getName: (item: T) => string,
) {
  const aName = normalizeSearchText(getName(a));
  const bName = normalizeSearchText(getName(b));
  const lengthDiff = aName.length - bName.length;
  if (lengthDiff !== 0) return lengthDiff;

  const brandlessDiff = Number(Boolean(a.brand?.trim())) - Number(Boolean(b.brand?.trim()));
  if (brandlessDiff !== 0) return brandlessDiff;

  return getName(a).localeCompare(getName(b), 'ko');
}
