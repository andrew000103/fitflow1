import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ─── 타입 ─────────────────────────────────────────────────────────────────────

export type AIGoal = 'weight_loss' | 'muscle_gain' | 'strength_gain' | 'maintenance' | 'health';
export type AIGender = 'male' | 'female' | 'undisclosed';
export type AIExperience = 'beginner' | 'intermediate' | 'advanced';
export type GymType = 'full_gym' | 'garage_gym' | 'dumbbell_only' | 'bodyweight';

export const AI_GOAL_LABEL: Record<AIGoal, string> = {
  weight_loss: '체중 감량',
  muscle_gain: '근육 증가 (벌크업)',
  strength_gain: '근력 강화',
  maintenance: '체형 유지',
  health: '건강 개선',
};

export interface StrengthEntry {
  exercise: string;
  weightKg: number;
}

export interface OnboardingData {
  goal: AIGoal;
  primaryStrengthFocus?: 'squat' | 'bench' | 'deadlift' | 'balanced';
  gender: AIGender;
  age: number;
  height: number;
  weight: number;
  experience: AIExperience;
  workoutDaysPerWeek: number;
  gymType: GymType;
  equipmentList?: string[];
  dietaryRestrictions: string[];
  // Phase 2 (optional)
  recoveryLevel?: 'easy' | 'moderate' | 'hard';
  overeatingHabit?: 'rarely' | 'sometimes' | 'often';
  sleepQuality?: 'good' | 'average' | 'poor';
  plateauHistory?: string;
  // 운동 강도 프로필 (optional)
  strengthProfile?: StrengthEntry[];
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  repsRange: string;
  weight_kg?: number | null;
  note?: string | null;
}

export interface WorkoutDay {
  dayLabel: 'day1' | 'day2' | 'day3' | 'day4' | 'day5' | 'day6' | 'day7';
  isRestDay: boolean;
  focus?: string | null;
  exercises: WorkoutExercise[];
}

export interface MealEntry {
  timing: string;
  foods: string[];
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
}

export interface DietDay {
  targetCalories: number;
  meals: MealEntry[];
}

export interface AIPlan {
  id: string;
  weekStart: string;
  targetCalories: number;
  targetMacros: { protein: number; carbs: number; fat: number };
  weeklyWorkout: WorkoutDay[];
  weeklyDiet: DietDay[];
  explanation: {
    summary: string;
    detail: string;
    sources: string[];
  };
  safetyFlags: string[];
  generatedAt: string;
  isApplied?: boolean;
  appliedAt?: string | null;
  appliedSections?: string[];
  lastAutoAdjustedCycle?: number;
  lastAutoAdjustedAt?: string | null;
}

type LegacyDayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type LegacyWorkoutDay = Omit<WorkoutDay, 'dayLabel'> & {
  dayLabel?: WorkoutDay['dayLabel'];
  dayOfWeek?: LegacyDayOfWeek;
};

type LegacyAIPlan = Omit<AIPlan, 'weeklyWorkout'> & {
  weeklyWorkout: LegacyWorkoutDay[];
};

const LEGACY_DAY_ORDER: LegacyDayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function normalizeWorkoutDay(day: LegacyWorkoutDay, index: number): WorkoutDay {
  if (day.dayLabel) {
    return {
      ...day,
      dayLabel: day.dayLabel,
    };
  }

  if (day.dayOfWeek) {
    const legacyIndex = LEGACY_DAY_ORDER.indexOf(day.dayOfWeek);
    if (legacyIndex >= 0) {
      return {
        ...day,
        dayLabel: `day${legacyIndex + 1}` as WorkoutDay['dayLabel'],
      };
    }
  }

  const fallbackIndex = Math.min(Math.max(index + 1, 1), 7);
  return {
    ...day,
    dayLabel: `day${fallbackIndex}` as WorkoutDay['dayLabel'],
  };
}

function normalizeAIPlan(plan: AIPlan | LegacyAIPlan | null): AIPlan | null {
  if (!plan) return null;

  const isApplied = plan.isApplied ?? false;
  const appliedAt = isApplied ? plan.appliedAt ?? null : null;

  return {
    ...plan,
    weeklyWorkout: (plan.weeklyWorkout ?? []).map(normalizeWorkoutDay),
    isApplied,
    appliedAt,
    appliedSections: isApplied ? plan.appliedSections : undefined,
    lastAutoAdjustedCycle: plan.lastAutoAdjustedCycle ?? undefined,
    lastAutoAdjustedAt: plan.lastAutoAdjustedAt ?? null,
  };
}

// ─── 스토어 ────────────────────────────────────────────────────────────────────

interface AIPlanState {
  onboardingData: OnboardingData | null;
  currentPlan: AIPlan | null;
  previousPlan: AIPlan | null;
  isGenerating: boolean;
  isAdjusting: boolean;
  error: string | null;
  hasCompletedOnboarding: boolean;
  needsOnboarding: boolean;

  setOnboardingData: (data: OnboardingData) => void;
  setCurrentPlan: (plan: AIPlan) => void;
  updateWeekStart: (weekStart: string) => void;
  markCurrentPlanApplied: (appliedSections?: string[]) => void;
  setGenerating: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setNeedsOnboarding: (v: boolean) => void;
  markOnboardingComplete: () => void;
  restorePreviousPlan: () => void;
  clearPlan: () => void;
  reset: () => void;
  applyRuleBasedAdjustment: (userId: string) => Promise<void>;
  syncRecurringPlanForToday: (userId: string, today?: Date) => Promise<void>;
}

export const useAIPlanStore = create<AIPlanState>()(
  persist(
    (set, get) => ({
      onboardingData: null,
      currentPlan: null,
      previousPlan: null,
      isGenerating: false,
      isAdjusting: false,
      error: null,
      hasCompletedOnboarding: false,
      needsOnboarding: false,

      setNeedsOnboarding: (v) => set({ needsOnboarding: v }),

      markOnboardingComplete: () => set({ hasCompletedOnboarding: true, needsOnboarding: false }),

      setOnboardingData: (data) =>
        set({ onboardingData: data, hasCompletedOnboarding: true }),

      setCurrentPlan: (plan) =>
        set((state) => ({
          previousPlan: state.currentPlan,
          currentPlan: normalizeAIPlan(plan),
          error: null,
          isGenerating: false,
        })),

      updateWeekStart: (weekStart) =>
        set((state) => ({
          currentPlan: state.currentPlan
            ? { ...state.currentPlan, weekStart }
            : null,
        })),

      markCurrentPlanApplied: (appliedSections) =>
        set((state) => ({
          currentPlan: state.currentPlan
            ? {
                ...state.currentPlan,
                isApplied: true,
                appliedAt: new Date().toISOString(),
                appliedSections: appliedSections ?? state.currentPlan.appliedSections,
              }
            : null,
        })),

      setGenerating: (v) => set({ isGenerating: v }),

      setError: (msg) => set({ error: msg, isGenerating: false }),

      restorePreviousPlan: () =>
        set((state) => ({
          currentPlan: normalizeAIPlan(state.previousPlan ?? state.currentPlan),
          previousPlan: null,
        })),

      clearPlan: () => set({ currentPlan: null }),

      reset: () =>
        set({
          onboardingData: null,
          currentPlan: null,
          previousPlan: null,
          isGenerating: false,
          isAdjusting: false,
          error: null,
          hasCompletedOnboarding: false,
          needsOnboarding: false,
        }),

      applyRuleBasedAdjustment: async (userId: string) => {
        const currentPlan = normalizeAIPlan(get().currentPlan);
        if (!currentPlan) return;

        set({ isAdjusting: true });
        try {
          // dynamic import로 순환 의존성 방지 (ai-planner ↔ ai-plan-store)
          const {
            fetchRecentWorkoutPerformance,
            computeAdjustedWeight,
            updateAIPlanSnapshotInSupabase,
          } = await import('../lib/ai-planner');

          const planExercises = currentPlan.weeklyWorkout
            .flatMap((d) => d.exercises)
            .filter((e, i, arr) => arr.findIndex((x) => x.name === e.name) === i);

          const records = await fetchRecentWorkoutPerformance(userId, planExercises, 7);
          if (records.length === 0) {
            set({ isAdjusting: false });
            return;
          }

          const perfMap = new Map(records.map((r) => [r.exerciseName, r]));

          const updatedPlan: AIPlan = {
            ...currentPlan,
            weeklyWorkout: currentPlan.weeklyWorkout.map((day) => ({
              ...day,
              exercises: day.exercises.map((ex) => {
                const perf = perfMap.get(ex.name);
                if (!perf) return ex; // 기록 없음 → 현상 유지

                const newWeight = computeAdjustedWeight(
                  ex.name,
                  ex.weight_kg ?? null,
                  perf.completionRate
                );
                if (newWeight === ex.weight_kg) return ex;
                return { ...ex, weight_kg: newWeight };
              }),
            })),
          };

          set((state) => ({
            previousPlan: state.currentPlan,
            currentPlan: updatedPlan,
            isAdjusting: false,
          }));
          await updateAIPlanSnapshotInSupabase(updatedPlan).catch(() => {});
        } catch {
          set({ isAdjusting: false });
        }
      },

      syncRecurringPlanForToday: async (userId: string, today = new Date()) => {
        const currentPlan = normalizeAIPlan(get().currentPlan);
        if (!currentPlan?.isApplied) return;

        const workoutApplied = (currentPlan.appliedSections ?? ['workout', 'diet', 'goals']).includes('workout');
        if (!workoutApplied) return;

        const { getCycleDateRange, getPlanCycleInfo } = await import('../lib/ai-plan-schedule');
        const cycleInfo = getPlanCycleInfo(currentPlan, today);
        if (!cycleInfo.started || cycleInfo.cycle <= 0) return;

        const lastAdjustedCycle = currentPlan.lastAutoAdjustedCycle ?? null;
        if (lastAdjustedCycle !== null && lastAdjustedCycle >= cycleInfo.cycle) return;

        set({ isAdjusting: true });
        try {
          const {
            adjustRepsRange,
            computeAdjustedWeight,
            fetchRecentWorkoutPerformance,
            updateAIPlanSnapshotInSupabase,
          } = await import('../lib/ai-planner');

          const planExercises = currentPlan.weeklyWorkout
            .flatMap((d) => d.exercises)
            .filter((e, i, arr) => arr.findIndex((x) => x.name === e.name) === i);

          const previousCycleRange = getCycleDateRange(currentPlan, cycleInfo.cycle - 1);
          if (!previousCycleRange) {
            set({ isAdjusting: false });
            return;
          }

          const records = await fetchRecentWorkoutPerformance(userId, planExercises, {
            start: previousCycleRange.start.toISOString(),
            end: previousCycleRange.end.toISOString(),
          });
          if (records.length === 0) {
            const syncedPlan: AIPlan = {
              ...currentPlan,
              lastAutoAdjustedCycle: cycleInfo.cycle,
              lastAutoAdjustedAt: new Date().toISOString(),
            };
            set({
              currentPlan: syncedPlan,
              isAdjusting: false,
            });
            await updateAIPlanSnapshotInSupabase(syncedPlan).catch(() => {});
            return;
          }

          const perfMap = new Map(records.map((r) => [r.exerciseName, r]));

          const updatedPlan: AIPlan = {
            ...currentPlan,
            weeklyWorkout: currentPlan.weeklyWorkout.map((day) => ({
              ...day,
              exercises: day.exercises.map((ex) => {
                const perf = perfMap.get(ex.name);
                if (!perf) return ex;

                if (ex.weight_kg != null) {
                  const newWeight = computeAdjustedWeight(ex.name, ex.weight_kg, perf.completionRate);
                  return newWeight === ex.weight_kg ? ex : { ...ex, weight_kg: newWeight };
                }

                const nextRepsRange = adjustRepsRange(ex.repsRange, perf.completionRate);
                return nextRepsRange === ex.repsRange ? ex : { ...ex, repsRange: nextRepsRange };
              }),
            })),
            lastAutoAdjustedCycle: cycleInfo.cycle,
            lastAutoAdjustedAt: new Date().toISOString(),
          };

          set({
            currentPlan: updatedPlan,
            isAdjusting: false,
          });
          await updateAIPlanSnapshotInSupabase(updatedPlan).catch(() => {});
        } catch {
          set({ isAdjusting: false });
        }
      },
    }),
    {
      name: 'ai-plan-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as Partial<AIPlanState> | undefined;
        if (!state) return persistedState as AIPlanState;

        return {
          ...state,
          currentPlan: normalizeAIPlan(state.currentPlan as AIPlan | LegacyAIPlan | null),
          previousPlan: normalizeAIPlan(state.previousPlan as AIPlan | LegacyAIPlan | null),
        } as AIPlanState;
      },
    }
  )
);
