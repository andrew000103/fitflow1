import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { FoodItem } from '../types/food';
import { foodRowToFoodItem, searchFoods as searchDbFoods } from './diet-search';
import {
  compareRankableFoodNames,
  normalizeSearchText,
  scoreFoodItem,
} from './food-search-ranking';
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

function rerankFoods(items: FoodItem[], query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return [...items].sort((a, b) => {
    const scoreDiff = scoreFoodItem(b, normalizedQuery) - scoreFoodItem(a, normalizedQuery);
    if (scoreDiff !== 0) return scoreDiff;
    return compareRankableFoodNames(a, b, (item) => item.name);
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
