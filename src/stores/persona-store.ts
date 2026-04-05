import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getLatestUserGoal } from '../lib/profile';
import {
  calculatePersonaProfile,
  type EvolutionChecklistItem,
  type PersonaCalculationResult,
  type PersonaDailyState,
  type PersonaGoalSnapshot,
  type PersonaMealDaySummary,
  type PersonaOnboardingInput,
} from '../lib/persona-engine';
import { assignPixelVariant, classifyArchetype } from '../lib/ai-level-classifier';
import {
  type CharacterArchetypeId,
  type CharacterLevelId,
  type PixelVariantId,
} from '../lib/pixel-character-config';
import { supabase } from '../lib/supabase';
import { type AIPlan } from './ai-plan-store';
import { useAIPlanStore } from './ai-plan-store';
import { useAuthStore } from './auth-store';
import { useDietStore } from './diet-store';
import type { MealEntry } from '../types/food';

export type QuickCharacterWorkoutFrequency = '1_2' | '3_4' | '5_plus';
export type QuickCharacterTrainingStyle = 'health' | 'physique' | 'performance';
export type QuickCharacterDietConsistency = 'low' | 'medium' | 'high';

export interface QuickCharacterProfile {
  userId: string;
  experience: NonNullable<PersonaOnboardingInput['experience']>;
  workoutFrequency: QuickCharacterWorkoutFrequency;
  trainingStyle: QuickCharacterTrainingStyle;
  dietConsistency?: QuickCharacterDietConsistency | null;
  /** 픽셀 캐릭터 변형 배정에 사용. character-setup-screen에서 선택 */
  gender?: 'male' | 'female' | 'undisclosed' | null;
  completedAt: string;
  source: 'quick_character_setup';
}

interface WorkoutSessionRow {
  id: string;
  started_at: string | null;
  ended_at: string | null;
}

interface PersonaStoreState {
  quickCharacterProfile: QuickCharacterProfile | null;
  levelId: CharacterLevelId | null;
  levelName: string | null;
  nextLevelId: CharacterLevelId | null;
  nextLevelName: string | null;
  progressToNext: number;
  checklist: EvolutionChecklistItem[];
  dailyState: PersonaDailyState | null;
  headlineMessage: string | null;
  progressMessage: string | null;
  supportingMessage: string | null;
  reliabilityState: 'idle' | 'loading' | 'temporary' | 'ready' | 'error';
  lastUpdated: string | null;
  isCalculating: boolean;
  error: string | null;
  /** 픽셀 캐릭터 변형 (M3+) */
  variantId: PixelVariantId | null;
  /** 분류 유형 (M3+) */
  archetypeId: CharacterArchetypeId | null;
  setQuickCharacterProfile: (profile: Omit<QuickCharacterProfile, 'completedAt' | 'source'>) => void;
  clearQuickCharacterProfile: () => void;
  calculatePersona: (userId: string) => Promise<PersonaCalculationResult | null>;
  reset: () => void;
}

interface WorkoutProgressSummary {
  totalCompletedSessions: number;
  sessionCount14d: number;
  sessionCount28d: number;
  sessionCount56d: number;
  activeDays14d: number;
  activeDays28d: number;
  activeDays56d: number;
  completedToday: boolean;
  latestCompletedAt: string | null;
}

let latestPersonaRequestId = 0;

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date: Date, offset: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function summarizeMealEntries(entries: MealEntry[], date: string): PersonaMealDaySummary {
  const mealTypes = new Set(entries.map((entry) => entry.meal_type));

  return entries.reduce<PersonaMealDaySummary>(
    (summary, entry) => ({
      ...summary,
      calories: summary.calories + Math.max(entry.calories, 0),
      protein_g: summary.protein_g + Math.max(entry.protein_g, 0),
      carbs_g: summary.carbs_g + Math.max(entry.carbs_g, 0),
      fat_g: summary.fat_g + Math.max(entry.fat_g, 0),
    }),
    {
      date,
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      mealCount: mealTypes.size,
      entryCount: entries.length,
    },
  );
}

function buildMealSummaries(userId: string, windowDays: number, now = new Date()) {
  const { allEntriesByUser, currentUserId } = useDietStore.getState();
  const userEntriesByDate = allEntriesByUser[userId] ?? {};
  const knownDates = Object.keys(userEntriesByDate);
  const dates = Array.from({ length: windowDays }, (_, index) => formatDateKey(addDays(now, index - (windowDays - 1))));
  const summaries = dates.map((date) => summarizeMealEntries(userEntriesByDate[date] ?? [], date));

  return {
    summaries,
    hasAnyEntries: summaries.some((day) => day.entryCount > 0),
    isReady: currentUserId === userId && knownDates.length > 0,
  };
}

function mapOnboardingData(): PersonaOnboardingInput | null {
  const onboarding = useAIPlanStore.getState().onboardingData;
  if (onboarding) {
    return {
      goal: onboarding.goal,
      experience: onboarding.experience,
      workoutDaysPerWeek: onboarding.workoutDaysPerWeek,
      dietaryRestrictions: onboarding.dietaryRestrictions,
      overeatingHabit: onboarding.overeatingHabit,
      age: onboarding.age,
      height: onboarding.height,
      weight: onboarding.weight,
      gender: onboarding.gender,
    };
  }

  const quickProfile = usePersonaStore.getState().quickCharacterProfile;
  const currentUserId = useAuthStore.getState().user?.id;
  if (!quickProfile || !currentUserId || quickProfile.userId !== currentUserId) return null;

  const workoutDaysPerWeek = quickProfile.workoutFrequency === '1_2'
    ? 2
    : quickProfile.workoutFrequency === '3_4'
      ? 4
      : 5;

  return {
    experience: quickProfile.experience,
    workoutDaysPerWeek,
  };
}

function mapGoal(goal: Awaited<ReturnType<typeof getLatestUserGoal>>): PersonaGoalSnapshot | null {
  if (!goal) return null;

  return {
    goalType: goal.goal_type,
    caloriesTarget: goal.calories_target,
    proteinTargetG: goal.protein_target_g,
    carbsTargetG: goal.carbs_target_g,
    fatTargetG: goal.fat_target_g,
  };
}

function mapAppliedPlanGoal(plan: AIPlan | null): PersonaGoalSnapshot | null {
  if (!plan?.isApplied) return null;

  return {
    caloriesTarget: plan.targetCalories,
    proteinTargetG: plan.targetMacros.protein,
    carbsTargetG: plan.targetMacros.carbs,
    fatTargetG: plan.targetMacros.fat,
  };
}

function buildActiveDayCount(sessions: WorkoutSessionRow[], windowStart: number) {
  return new Set(
    sessions
      .map((session) => session.ended_at ?? session.started_at)
      .filter((basis): basis is string => Boolean(basis))
      .filter((basis) => new Date(basis).getTime() >= windowStart)
      .map((basis) => formatDateKey(new Date(basis))),
  ).size;
}

async function fetchWorkoutProgressSummary(userId: string, now = new Date()): Promise<WorkoutProgressSummary> {
  const since56d = startOfDay(addDays(now, -55)).toISOString();
  const since28dMs = startOfDay(addDays(now, -27)).getTime();
  const since14dMs = startOfDay(addDays(now, -13)).getTime();
  const since56dMs = startOfDay(addDays(now, -55)).getTime();
  const todayStart = startOfDay(now).getTime();
  const todayEnd = endOfDay(now).getTime();

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select('id, started_at, ended_at')
      .eq('user_id', userId)
      .gte('started_at', since56d)
      .order('started_at', { ascending: false }),
    supabase
      .from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('ended_at', 'is', null),
  ]);

  if (error) throw error;
  if (countError) throw countError;

  const completedSessions = ((data ?? []) as WorkoutSessionRow[]).filter((session) => session.ended_at);
  const sessionCount14d = completedSessions.filter((session) => {
    const basis = session.ended_at ?? session.started_at;
    return basis ? new Date(basis).getTime() >= since14dMs : false;
  }).length;
  const sessionCount28d = completedSessions.filter((session) => {
    const basis = session.ended_at ?? session.started_at;
    return basis ? new Date(basis).getTime() >= since28dMs : false;
  }).length;
  const latestCompletedAt = completedSessions[0]?.ended_at ?? null;

  return {
    totalCompletedSessions: count ?? completedSessions.length,
    sessionCount14d,
    sessionCount28d,
    sessionCount56d: completedSessions.length,
    activeDays14d: buildActiveDayCount(completedSessions, since14dMs),
    activeDays28d: buildActiveDayCount(completedSessions, since28dMs),
    activeDays56d: buildActiveDayCount(completedSessions, since56dMs),
    completedToday: completedSessions.some((session) => {
      const basis = session.ended_at ?? session.started_at;
      if (!basis) return false;
      const timestamp = new Date(basis).getTime();
      return timestamp >= todayStart && timestamp <= todayEnd;
    }),
    latestCompletedAt,
  };
}

export const usePersonaStore = create<PersonaStoreState>()(
  persist((set) => ({
  quickCharacterProfile: null,
  levelId: null,
  levelName: null,
  nextLevelId: null,
  nextLevelName: null,
  progressToNext: 0,
  checklist: [],
  dailyState: null,
  headlineMessage: null,
  progressMessage: null,
  supportingMessage: null,
  reliabilityState: 'idle',
  lastUpdated: null,
  isCalculating: false,
  error: null,
  variantId: null,
  archetypeId: null,

  setQuickCharacterProfile: (profile) =>
    set({
      quickCharacterProfile: {
        ...profile,
        completedAt: new Date().toISOString(),
        source: 'quick_character_setup',
      },
    }),

  clearQuickCharacterProfile: () => set({ quickCharacterProfile: null }),

  calculatePersona: async (userId) => {
    const requestId = ++latestPersonaRequestId;
    set({ isCalculating: true, error: null, reliabilityState: 'loading' });

    try {
      const now = new Date();
      const onboarding = mapOnboardingData();
      const currentPlan = useAIPlanStore.getState().currentPlan;
      const mealContext56d = buildMealSummaries(userId, 56, now);
      const meals56d = mealContext56d.summaries;
      const meals28d = meals56d.slice(-28);
      const meals14d = meals56d.slice(-14);
      const todayMeals = meals56d[meals56d.length - 1] ?? summarizeMealEntries([], formatDateKey(now));

      const [goalRecord, workouts] = await Promise.all([
        getLatestUserGoal(userId),
        fetchWorkoutProgressSummary(userId, now),
      ]);

      const resolvedGoal = mapAppliedPlanGoal(currentPlan) ?? mapGoal(goalRecord);

      const result = calculatePersonaProfile({
        goal: resolvedGoal,
        onboarding,
        workouts,
        meals14d,
        meals28d,
        meals56d,
        todayMeals,
      });

      if (requestId !== latestPersonaRequestId) {
        return result;
      }

      const hasMealData = mealContext56d.hasAnyEntries;
      const isMealDataReady = mealContext56d.isReady;
      const supportingMessage = !isMealDataReady
        ? '식단 기록을 아직 다 불러오지 못해 지금은 운동 기록 중심으로 레벨 안내를 보여드리고 있어요.'
        : !hasMealData
          ? '식단 기록까지 쌓이면 레벨 안내가 더 정확해져요.'
          : null;

      // Derive pixel variant + archetype from onboarding or quick profile
      const onboardingRaw = useAIPlanStore.getState().onboardingData;
      const quickProfileForVariant = usePersonaStore.getState().quickCharacterProfile;
      const variantGender: import('../stores/ai-plan-store').AIGender =
        onboardingRaw?.gender ?? (quickProfileForVariant?.gender === 'female' ? 'female' : 'male');
      const variantGoal: import('../stores/ai-plan-store').AIGoal = onboardingRaw?.goal ?? 'maintenance';
      const variantGymType: import('../stores/ai-plan-store').GymType = onboardingRaw?.gymType ?? 'bodyweight';
      const computedVariantId = assignPixelVariant(variantGender, variantGoal, variantGymType);
      const computedArchetypeId = classifyArchetype(variantGoal, variantGymType, onboardingRaw?.experience ?? 'beginner');

      set({
        levelId: result.levelId,
        levelName: result.levelName,
        nextLevelId: result.nextLevelId,
        nextLevelName: result.nextLevelName,
        progressToNext: result.progressToNext,
        checklist: result.checklist,
        dailyState: result.dailyState,
        headlineMessage: result.headlineMessage,
        progressMessage: result.progressMessage,
        supportingMessage,
        reliabilityState: isMealDataReady ? 'ready' : 'temporary',
        lastUpdated: now.toISOString(),
        isCalculating: false,
        error: null,
        variantId: computedVariantId,
        archetypeId: computedArchetypeId,
      });

      return result;
    } catch (error) {
      if (requestId !== latestPersonaRequestId) {
        return null;
      }

      const message = error instanceof Error ? error.message : 'Failed to calculate character evolution';
      set({
        levelId: null,
        levelName: null,
        nextLevelId: null,
        nextLevelName: null,
        progressToNext: 0,
        checklist: [],
        dailyState: null,
        headlineMessage: null,
        progressMessage: null,
        supportingMessage: '현재 레벨 상태를 다시 계산하지 못했어요. 잠시 후 다시 불러올게요.',
        reliabilityState: 'error',
        lastUpdated: null,
        isCalculating: false,
        error: message,
      });
      return null;
    }
  },

  reset: () =>
    set({
      quickCharacterProfile: null,
      levelId: null,
      levelName: null,
      nextLevelId: null,
      nextLevelName: null,
      progressToNext: 0,
      checklist: [],
      dailyState: null,
      headlineMessage: null,
      progressMessage: null,
      supportingMessage: null,
      reliabilityState: 'idle',
      lastUpdated: null,
      isCalculating: false,
      error: null,
      variantId: null,
      archetypeId: null,
    }),
}),
    {
      name: 'persona-store',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState: any, fromVersion: number) => {
        const state = persistedState as Partial<PersonaStoreState>;
        if (fromVersion < 2) {
          // challenger/ranker 레벨 ID를 10단계 체계로 마이그레이션
          const legacyMap: Record<string, string> = { challenger: 'grandmaster', ranker: 'god' };
          if (state.levelId && legacyMap[state.levelId]) {
            state.levelId = legacyMap[state.levelId] as CharacterLevelId;
          }
          if (state.nextLevelId && legacyMap[state.nextLevelId]) {
            state.nextLevelId = legacyMap[state.nextLevelId] as CharacterLevelId;
          }
        }
        return state;
      },
      partialize: (state) => ({
        quickCharacterProfile: state.quickCharacterProfile,
        variantId: state.variantId,
        archetypeId: state.archetypeId,
      }),
    })
);
