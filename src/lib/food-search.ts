import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { FoodItem } from '../types/food';
import { foodRowToFoodItem, searchFoods as searchDbFoods } from './diet-search';
import { searchMfdsFoods } from './mfds';
import { searchOpenFoodFactsFoods } from './openfoodfacts';
import { searchUsdaFoods } from './usda';

const CACHE_KEY = 'food-search-cache:v2';
const RECENT_SEARCHES_KEY = 'food-recent-searches:v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const MAX_CACHE_ENTRIES = 40;
const MAX_RECENT_SEARCHES = 8;
const PROVIDER_TIMEOUT_MS = 5000;

interface FoodSearchCacheEntry {
  query: string;
  page: number;
  cachedAt: number;
  items: FoodItem[];
}

type FoodSearchCache = Record<string, FoodSearchCacheEntry>;

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

function normalizeSearchText(value: string | null | undefined) {
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

function hasWordBoundaryPrefixMatch(value: string | null | undefined, query: string) {
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

function getProcessedFoodPenalty(item: FoodItem, normalizedQuery: string) {
  const normalizedName = normalizeSearchText(item.name);
  const normalizedBrand = normalizeSearchText(item.brand);

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

function scoreFieldMatch(value: string | null | undefined, normalizedQuery: string, weight: number) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return 0;
  if (normalized === normalizedQuery) return weight + 120;
  if (hasWordBoundaryPrefixMatch(value, normalizedQuery)) return weight + 75;
  if (normalized.startsWith(normalizedQuery)) return weight + 60;
  if (normalized.includes(normalizedQuery)) return weight + 30;
  return 0;
}

function getLengthClosenessBonus(text: string, query: string) {
  if (!text || !query) return 0;
  const diff = Math.abs(text.length - query.length);
  return Math.max(0, 18 - diff * 2);
}

function scoreFoodItem(item: FoodItem, normalizedQuery: string) {
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
    score -= getProcessedFoodPenalty(item, normalizedQuery);
  } else {
    score -= getProcessedFoodPenalty(item, normalizedQuery);
  }

  if (normalizedBrand === normalizedQuery) score -= 12;

  if (item.source === 'custom') score += 6;
  else if (item.source === 'mfds') score += 4;
  else if (item.source === 'usda') score += 2;
  else if (item.source === 'openfoodfacts') score += 1;

  return score;
}

function rerankFoods(items: FoodItem[], query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return [...items].sort((a, b) => {
    const scoreDiff = scoreFoodItem(b, normalizedQuery) - scoreFoodItem(a, normalizedQuery);
    if (scoreDiff !== 0) return scoreDiff;

    const lengthDiff = normalizeSearchText(a.name).length - normalizeSearchText(b.name).length;
    if (lengthDiff !== 0) return lengthDiff;

    const brandlessDiff = Number(Boolean(a.brand?.trim())) - Number(Boolean(b.brand?.trim()));
    if (brandlessDiff !== 0) return brandlessDiff;

    return a.name.localeCompare(b.name, 'ko');
  });
}

function dedupeFoods(items: FoodItem[]) {
  const map = new Map<string, FoodItem>();

  for (const item of items) {
    const key = `${item.name.trim().toLowerCase().replace(/\s+/g, '')}::${item.brand?.trim().toLowerCase().replace(/\s+/g, '') ?? ''}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

function makeCacheId(query: string, page: number, userId?: string) {
  return `${userId ?? 'guest'}::${query.trim().toLowerCase().replace(/\s+/g, '')}::${page}`;
}

function makeRecentSearchesKey(userId?: string) {
  return `${RECENT_SEARCHES_KEY}:${userId ?? 'guest'}`;
}

function isFresh(entry: FoodSearchCacheEntry) {
  return Date.now() - entry.cachedAt < CACHE_TTL_MS;
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} 응답 시간 초과`));
        }, PROVIDER_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function readCache(): Promise<FoodSearchCache> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as FoodSearchCache;
    return parsed ?? {};
  } catch {
    return {};
  }
}

async function writeCache(cache: FoodSearchCache) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache write failures and keep search functional.
  }
}

function pruneCache(cache: FoodSearchCache) {
  const freshEntries = Object.entries(cache).filter(([, entry]) => isFresh(entry));
  freshEntries.sort((a, b) => b[1].cachedAt - a[1].cachedAt);
  return Object.fromEntries(freshEntries.slice(0, MAX_CACHE_ENTRIES));
}

async function getCachedFoods(query: string, page: number, userId?: string) {
  const cache = await readCache();
  const entry = cache[makeCacheId(query, page, userId)];
  return entry && isFresh(entry) ? entry.items : null;
}

async function setCachedFoods(query: string, page: number, items: FoodItem[], userId?: string) {
  const cache = await readCache();
  cache[makeCacheId(query, page, userId)] = {
    query: query.trim(),
    page,
    cachedAt: Date.now(),
    items,
  };
  await writeCache(pruneCache(cache));
}

export async function searchFoods(query: string, page = 1, userId?: string): Promise<FoodItem[]> {
  if (!query.trim()) return [];

  const cached = await getCachedFoods(query, page, userId);
  if (cached) {
    return cached;
  }

  let dbItems: FoodItem[] = [];
  try {
    dbItems = (await searchDbFoods(query)).map(foodRowToFoodItem);
  } catch {
    dbItems = [];
  }

  if (dbItems.length > 0) {
    const deduped = rerankFoods(dedupeFoods(dbItems), query);
    await setCachedFoods(query, page, deduped, userId);
    await saveRecentSearch(query, userId);
    return deduped;
  }

  if (Platform.OS === 'web') {
    return [];
  }

  const results = await Promise.allSettled([
    withTimeout(searchMfdsFoods(query), '식약처 검색'),
    withTimeout(searchOpenFoodFactsFoods(query, page), 'Open Food Facts 검색'),
    withTimeout(searchUsdaFoods(query), 'USDA 검색'),
  ]);

  const fulfilled = results
    .filter((result): result is PromiseFulfilledResult<FoodItem[]> => result.status === 'fulfilled')
    .flatMap((result) => result.value);

  if (fulfilled.length > 0) {
    const deduped = rerankFoods(dedupeFoods(fulfilled), query);
    await setCachedFoods(query, page, deduped, userId);
    await saveRecentSearch(query, userId);
    return deduped;
  }

  const rejection = results.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  if (rejection) {
    throw rejection.reason instanceof Error
      ? rejection.reason
      : new Error('음식 검색 중 오류가 발생했습니다.');
  }

  return [];
}

export async function clearFoodSearchCache() {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore cache clear failures.
  }
}

export async function getRecentFoodSearches(userId?: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(makeRecentSearchesKey(userId));
    if (!raw) return [];

    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveRecentSearch(query: string, userId?: string) {
  const normalized = query.trim();
  if (!normalized) return;

  try {
    const recent = await getRecentFoodSearches(userId);
    const next = [
      normalized,
      ...recent.filter((item) => item.toLowerCase() !== normalized.toLowerCase()),
    ].slice(0, MAX_RECENT_SEARCHES);
    await AsyncStorage.setItem(makeRecentSearchesKey(userId), JSON.stringify(next));
  } catch {
    // Ignore recent search persistence failures.
  }
}

export async function clearRecentFoodSearches(userId?: string) {
  try {
    await AsyncStorage.removeItem(makeRecentSearchesKey(userId));
  } catch {
    // Ignore clear failures.
  }
}
