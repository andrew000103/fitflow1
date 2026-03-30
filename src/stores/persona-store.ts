import { create } from 'zustand';
import { getLatestUserGoal, getUserProfile } from '../lib/profile';
import { supabase } from '../lib/supabase';
import {
  PersonaCalculationResult,
  PersonaGoalSnapshot,
  PersonaMealDaySummary,
  PersonaOnboardingInput,
  PersonaProfileSnapshot,
  PersonaSourceBreakdown,
  PersonaStage,
  PersonaDailyState,
  PersonaDataCompleteness,
  calculatePersonaProfile,
} from '../lib/persona-engine';
import { useAIPlanStore } from './ai-plan-store';
import { useDietStore } from './diet-store';
import type { MealEntry } from '../types/food';

interface WorkoutSessionRow {
  id: string;
  started_at: string | null;
  ended_at: string | null;
}

interface PersonaStoreState {
  personaId: PersonaCalculationResult['personaId'] | null;
  personaStage: PersonaStage | null;
  confidence: number;
  dailyState: PersonaDailyState | null;
  headlineMessage: string | null;
  supportingMessage: string | null;
  reliabilityState: 'idle' | 'loading' | 'temporary' | 'ready' | 'error';
  validationWarnings: string[];
  sourceBreakdown: PersonaSourceBreakdown | null;
  dataCompleteness: PersonaDataCompleteness | null;
  nickname: string | null;
  lastUpdated: string | null;
  isCalculating: boolean;
  error: string | null;
  calculatePersona: (userId: string) => Promise<PersonaCalculationResult | null>;
  reset: () => void;
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

function buildMealSummariesForRecentWeek(userId: string, now = new Date()) {
  const { allEntriesByUser, currentUserId } = useDietStore.getState();
  const userEntriesByDate = allEntriesByUser[userId] ?? {};
  const knownDates = Object.keys(userEntriesByDate);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = formatDateKey(addDays(now, index - 6));
    return summarizeMealEntries(userEntriesByDate[date] ?? [], date);
  });

  const todayKey = formatDateKey(now);
  return {
    meals7d: days,
    todayMeals: days.find((day) => day.date === todayKey) ?? summarizeMealEntries(userEntriesByDate[todayKey] ?? [], todayKey),
    isReady: currentUserId === userId && knownDates.length > 0,
    hasAnyEntries: days.some((day) => day.entryCount > 0),
  };
}

function mapOnboardingData(): PersonaOnboardingInput | null {
  const onboarding = useAIPlanStore.getState().onboardingData;
  if (!onboarding) return null;

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

function mapProfile(profile: Awaited<ReturnType<typeof getUserProfile>>): PersonaProfileSnapshot | null {
  if (!profile) return null;

  return {
    createdAt: profile.created_at,
    age: profile.age,
    heightCm: profile.height_cm,
    weightKg: profile.weight_kg,
    gender: profile.gender,
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

async function fetchRecentWorkoutSummary(userId: string, now = new Date()) {
  const since = startOfDay(addDays(now, -13)).toISOString();
  const todayStart = startOfDay(now).getTime();
  const todayEnd = endOfDay(now).getTime();

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, started_at, ended_at')
    .eq('user_id', userId)
    .gte('started_at', since)
    .order('started_at', { ascending: false });

  if (error) throw error;

  const completedSessions = ((data ?? []) as WorkoutSessionRow[]).filter((session) => session.ended_at);
  const activeDays = new Set(
    completedSessions
      .map((session) => {
        const basis = session.ended_at ?? session.started_at;
        if (!basis) return null;
        return formatDateKey(new Date(basis));
      })
      .filter(Boolean) as string[],
  );

  return {
    sessionCount14d: completedSessions.length,
    activeDays14d: activeDays.size,
    completedToday: completedSessions.some((session) => {
      const basis = session.ended_at ?? session.started_at;
      if (!basis) return false;
      const timestamp = new Date(basis).getTime();
      return timestamp >= todayStart && timestamp <= todayEnd;
    }),
    latestCompletedAt: completedSessions[0]?.ended_at ?? null,
  };
}

export const usePersonaStore = create<PersonaStoreState>((set) => ({
  personaId: null,
  personaStage: null,
  confidence: 0,
  dailyState: null,
  headlineMessage: null,
  supportingMessage: null,
  reliabilityState: 'idle',
  validationWarnings: [],
  sourceBreakdown: null,
  dataCompleteness: null,
  nickname: null,
  lastUpdated: null,
  isCalculating: false,
  error: null,

  calculatePersona: async (userId) => {
    const requestId = ++latestPersonaRequestId;
    set({ isCalculating: true, error: null, reliabilityState: 'loading' });

    try {
      const now = new Date();
      const onboarding = mapOnboardingData();
      const mealContext = buildMealSummariesForRecentWeek(userId, now);
      const { meals7d, todayMeals } = mealContext;

      const [profileRecord, goalRecord, workouts] = await Promise.all([
        getUserProfile(userId),
        getLatestUserGoal(userId),
        fetchRecentWorkoutSummary(userId, now),
      ]);

      const result = calculatePersonaProfile({
        profile: mapProfile(profileRecord),
        goal: mapGoal(goalRecord),
        onboarding,
        workouts,
        meals7d,
        todayMeals,
        now,
      });

      const isMealDataReady = mealContext.isReady;
      const confidence = isMealDataReady ? result.confidence : Math.min(result.confidence, 0.45);
      const validationWarnings: string[] = [];

      if (!isMealDataReady) {
        validationWarnings.push('meal-data-not-ready');
      }
      if (!mealContext.hasAnyEntries) {
        validationWarnings.push('meal-history-empty');
      }
      if (result.sourceBreakdown.goalSource !== 'user_goal') {
        validationWarnings.push('goal-derived-from-fallback');
      }
      if (result.dataCompleteness.score < 0.55) {
        validationWarnings.push('low-data-completeness');
      }

      const supportingMessage = !isMealDataReady
        ? '최근 식단 기록을 아직 모두 불러오지 못해 임시 페르소나를 보여주고 있어요.'
        : !mealContext.hasAnyEntries
          ? '식단 기록이 더 쌓이면 페르소나가 더 정확해져요.'
          : null;

      if (requestId !== latestPersonaRequestId) {
        return result;
      }

      set({
        personaId: result.personaId,
        personaStage: result.personaStage,
        confidence,
        dailyState: result.dailyState,
        headlineMessage: result.headlineMessage,
        supportingMessage,
        reliabilityState: isMealDataReady && validationWarnings.length === 0 ? 'ready' : 'temporary',
        validationWarnings,
        sourceBreakdown: result.sourceBreakdown,
        dataCompleteness: result.dataCompleteness,
        nickname: result.nickname,
        lastUpdated: now.toISOString(),
        isCalculating: false,
        error: null,
      });

      return result;
    } catch (error) {
      if (requestId !== latestPersonaRequestId) {
        return null;
      }
      const message = error instanceof Error ? error.message : 'Failed to calculate persona';
      set({
        personaId: null,
        personaStage: null,
        confidence: 0,
        dailyState: null,
        headlineMessage: null,
        supportingMessage: '페르소나를 다시 계산하지 못했어요. 잠시 후 다시 불러올게요.',
        reliabilityState: 'error',
        validationWarnings: ['calculation-failed'],
        sourceBreakdown: null,
        dataCompleteness: null,
        nickname: null,
        lastUpdated: null,
        isCalculating: false,
        error: message,
      });
      return null;
    }
  },

  reset: () =>
    set({
      personaId: null,
      personaStage: null,
      confidence: 0,
      dailyState: null,
      headlineMessage: null,
      supportingMessage: null,
      reliabilityState: 'idle',
      validationWarnings: [],
      sourceBreakdown: null,
      dataCompleteness: null,
      nickname: null,
      lastUpdated: null,
      isCalculating: false,
      error: null,
    }),
}));
