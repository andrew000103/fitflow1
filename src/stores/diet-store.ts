import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { StateStorage, createJSONStorage, persist } from 'zustand/middleware';
import { syncAddEntry, syncRemoveEntry, syncUpdateEntry } from '../lib/diet-supabase';
import { FoodItem, MealEntry, MealType, NutritionUnit } from '../types/food';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function calcNutrients(food: FoodItem, amount: number, amountUnit: NutritionUnit) {
  const basis = food.nutrition_basis;
  const ratio = basis.unit === amountUnit ? amount / Math.max(basis.amount, 1) : amount / Math.max(basis.amount, 1);
  const n = food.nutrients;

  return {
    calories: Math.round(n.calories * ratio),
    protein_g: Math.round(n.protein_g * ratio * 10) / 10,
    carbs_g: Math.round(n.carbs_g * ratio * 10) / 10,
    fat_g: Math.round(n.fat_g * ratio * 10) / 10,
    sugar_g: n.sugar_g !== undefined ? Math.round(n.sugar_g * ratio * 10) / 10 : undefined,
    fiber_g: n.fiber_g !== undefined ? Math.round(n.fiber_g * ratio * 10) / 10 : undefined,
    saturated_fat_g:
      n.saturated_fat_g !== undefined ? Math.round(n.saturated_fat_g * ratio * 10) / 10 : undefined,
    trans_fat_g:
      n.trans_fat_g !== undefined ? Math.round(n.trans_fat_g * ratio * 10) / 10 : undefined,
    sodium_mg: n.sodium_mg !== undefined ? Math.round(n.sodium_mg * ratio * 10) / 10 : undefined,
    cholesterol_mg:
      n.cholesterol_mg !== undefined ? Math.round(n.cholesterol_mg * ratio * 10) / 10 : undefined,
  };
}

interface DietStore {
  currentUserId: string | null;
  allEntriesByUser: Record<string, Record<string, MealEntry[]>>;
  entriesByDate: Record<string, MealEntry[]>;
  setCurrentUser: (userId: string | null) => void;
  addEntry: (
    food: FoodItem,
    amount: number,
    amountUnit: NutritionUnit,
    mealType: MealType,
    date: string,
  ) => void;
  removeEntry: (date: string, entryId: string) => void;
  updateAmount: (date: string, entryId: string, amount: number) => void;
  getDayTotals: (date: string) => {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  getDayEntries: (date: string) => MealEntry[];
  getMealEntries: (date: string, mealType: MealType) => MealEntry[];
  hydrateFromSupabase: (date: string, entries: MealEntry[]) => void;
}

const webStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(name);
  },
};

const dietStorage = createJSONStorage(() =>
  Platform.OS === 'web' ? webStorage : AsyncStorage,
);

export const useDietStore = create<DietStore>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      allEntriesByUser: {},
      entriesByDate: {},
      setCurrentUser: (userId) => {
        const nextEntries = userId ? get().allEntriesByUser[userId] ?? {} : {};
        set({
          currentUserId: userId,
          entriesByDate: nextEntries,
        });
      },
      addEntry: (food, amount, amountUnit, mealType, date) => {
        const currentUserId = get().currentUserId;
        if (!currentUserId) return;

        const entry: MealEntry = {
          id: genId(),
          food,
          amount,
          amount_unit: amountUnit,
          meal_type: mealType,
          logged_at: new Date().toISOString(),
          ...calcNutrients(food, amount, amountUnit),
        };

        set((state) => ({
          allEntriesByUser: {
            ...state.allEntriesByUser,
            [currentUserId]: {
              ...(state.allEntriesByUser[currentUserId] ?? {}),
              [date]: [...((state.allEntriesByUser[currentUserId]?.[date] ?? [])), entry],
            },
          },
          entriesByDate: {
            ...state.entriesByDate,
            [date]: [...(state.entriesByDate[date] ?? []), entry],
          },
        }));

        syncAddEntry(currentUserId, entry, date).catch(() => {});
      },
      removeEntry: (date, entryId) => {
        const currentUserId = get().currentUserId;
        if (!currentUserId) return;

        set((state) => ({
          allEntriesByUser: {
            ...state.allEntriesByUser,
            [currentUserId]: {
              ...(state.allEntriesByUser[currentUserId] ?? {}),
              [date]: (state.allEntriesByUser[currentUserId]?.[date] ?? []).filter((e) => e.id !== entryId),
            },
          },
          entriesByDate: {
            ...state.entriesByDate,
            [date]: (state.entriesByDate[date] ?? []).filter((e) => e.id !== entryId),
          },
        }));

        syncRemoveEntry(entryId).catch(() => {});
      },
      updateAmount: (date, entryId, amount) => {
        const currentUserId = get().currentUserId;
        if (!currentUserId) return;

        const entry = get().entriesByDate[date]?.find((e) => e.id === entryId);

        set((state) => ({
          allEntriesByUser: {
            ...state.allEntriesByUser,
            [currentUserId]: {
              ...(state.allEntriesByUser[currentUserId] ?? {}),
              [date]: (state.allEntriesByUser[currentUserId]?.[date] ?? []).map((e) =>
                e.id !== entryId
                  ? e
                  : { ...e, amount, ...calcNutrients(e.food, amount, e.amount_unit) },
              ),
            },
          },
          entriesByDate: {
            ...state.entriesByDate,
            [date]: (state.entriesByDate[date] ?? []).map((e) =>
              e.id !== entryId
                ? e
                : { ...e, amount, ...calcNutrients(e.food, amount, e.amount_unit) },
            ),
          },
        }));

        if (entry) {
          const nutrients = calcNutrients(entry.food, amount, entry.amount_unit);
          syncUpdateEntry(entryId, amount, nutrients).catch(() => {});
        }
      },
      hydrateFromSupabase: (date, entries) => {
        const currentUserId = get().currentUserId;
        if (!currentUserId || entries.length === 0) return;
        set((state) => ({
          allEntriesByUser: {
            ...state.allEntriesByUser,
            [currentUserId]: {
              ...(state.allEntriesByUser[currentUserId] ?? {}),
              [date]: entries,
            },
          },
          entriesByDate: {
            ...state.entriesByDate,
            [date]: entries,
          },
        }));
      },
      getDayEntries: (date) => get().entriesByDate[date] ?? [],
      getMealEntries: (date, mealType) =>
        (get().entriesByDate[date] ?? []).filter((e) => e.meal_type === mealType),
      getDayTotals: (date) =>
        (get().entriesByDate[date] ?? []).reduce(
          (acc, e) => ({
            calories: acc.calories + e.calories,
            protein_g: acc.protein_g + e.protein_g,
            carbs_g: acc.carbs_g + e.carbs_g,
            fat_g: acc.fat_g + e.fat_g,
          }),
          { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
        ),
    }),
    {
      name: 'diet-store:v1',
      storage: dietStorage,
      partialize: (state) => ({
        allEntriesByUser: state.allEntriesByUser,
      }),
    },
  ),
);
