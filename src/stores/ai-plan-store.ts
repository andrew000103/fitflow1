import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SurveyLevelResult } from '../lib/ai-level-classifier';

// ─── 타입 ─────────────────────────────────────────────────────────────────────

export type AIGoal = 'weight_loss' | 'muscle_gain' | 'lean_bulk' | 'strength_gain' | 'maintenance';
export type AIGender = 'male' | 'female';
export type AIExperience = 'beginner' | 'novice' | 'intermediate' | 'upper_intermediate' | 'advanced';
export type GymType = 'full_gym' | 'garage_gym' | 'dumbbell_only' | 'bodyweight';

export const AI_EXPERIENCE_LABEL: Record<AIExperience, string> = {
  beginner: '입문 (0~3개월)',
  novice: '초급 (3개월~1년)',
  intermediate: '중급 (1~2년)',
  upper_intermediate: '중상급 (2~4년)',
  advanced: '상급 (4년+)',
};

export const AI_GOAL_LABEL: Record<AIGoal, string> = {
  weight_loss: '다이어트',
  muscle_gain: '벌크업',
  lean_bulk: '린매스업',
  strength_gain: '스트렝스 강화',
  maintenance: '체중 유지',
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

type LegacyAIGoal = AIGoal | 'health';
type LegacyAIGender = AIGender | 'undisclosed';

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
type LegacyAIExperience = 'beginner' | 'intermediate' | 'advanced';

type LegacyWorkoutDay = Omit<WorkoutDay, 'dayLabel'> & {
  dayLabel?: WorkoutDay['dayLabel'];
  dayOfWeek?: LegacyDayOfWeek;
};

type LegacyAIPlan = Omit<AIPlan, 'weeklyWorkout'> & {
  weeklyWorkout: LegacyWorkoutDay[];
};

function normalizeExerciseDisplayName(name: string): string {
  if (name === '데드리프트') return '컨벤셔널 데드리프트';
  if (name === '스쿼트') return '바벨 스쿼트';
  return name;
}

function normalizeStrengthEntries(entries?: StrengthEntry[]): StrengthEntry[] | undefined {
  return entries?.map((entry) => ({
    ...entry,
    exercise: normalizeExerciseDisplayName(entry.exercise),
  }));
}

export function normalizeExperience(value: unknown): AIExperience {
  switch (value) {
    case 'beginner':
    case 'novice':
    case 'intermediate':
    case 'upper_intermediate':
    case 'advanced':
      return value;
    default:
      return 'beginner';
  }
}

function normalizeOnboardingData(
  data?: (
    Partial<Omit<OnboardingData, 'goal' | 'gender' | 'experience'>> & {
      goal?: LegacyAIGoal;
      gender?: LegacyAIGender;
      experience?: AIExperience | LegacyAIExperience;
    }
  ) | null,
): OnboardingData | null {
  if (!data) return null;

  const normalizedGoal: AIGoal =
    data.goal === 'weight_loss' ||
    data.goal === 'muscle_gain' ||
    data.goal === 'lean_bulk' ||
    data.goal === 'strength_gain' ||
    data.goal === 'maintenance'
      ? data.goal
      : 'maintenance';

  const normalizedGender: AIGender = data.gender === 'female' ? 'female' : 'male';

  return {
    ...data,
    goal: normalizedGoal,
    gender: normalizedGender,
    experience: normalizeExperience(data.experience),
    strengthProfile: normalizeStrengthEntries(data.strengthProfile),
  } as OnboardingData;
}

const LEGACY_DAY_ORDER: LegacyDayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function normalizeWorkoutDay(day: LegacyWorkoutDay, index: number): WorkoutDay {
  if (day.dayLabel) {
    return {
      ...day,
      dayLabel: day.dayLabel,
      exercises: (day.exercises ?? []).map((exercise) => ({
        ...exercise,
        name: normalizeExerciseDisplayName(exercise.name),
      })),
    };
  }

  if (day.dayOfWeek) {
    const legacyIndex = LEGACY_DAY_ORDER.indexOf(day.dayOfWeek);
    if (legacyIndex >= 0) {
      return {
        ...day,
        dayLabel: `day${legacyIndex + 1}` as WorkoutDay['dayLabel'],
        exercises: (day.exercises ?? []).map((exercise) => ({
          ...exercise,
          name: normalizeExerciseDisplayName(exercise.name),
        })),
      };
    }
  }

  const fallbackIndex = Math.min(Math.max(index + 1, 1), 7);
  return {
    ...day,
    dayLabel: `day${fallbackIndex}` as WorkoutDay['dayLabel'],
    exercises: (day.exercises ?? []).map((exercise) => ({
      ...exercise,
      name: normalizeExerciseDisplayName(exercise.name),
    })),
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
  surveyLevelResult: SurveyLevelResult | null;
  pendingPostSignupIntent: 'plan' | 'signup_only' | null;
  pendingPostSignupEmail: string | null;
  pendingResumeOnboardingData: OnboardingData | null;
  pendingResumeSurveyLevelResult: SurveyLevelResult | null;
  currentPlan: AIPlan | null;
  previousPlan: AIPlan | null;
  isGenerating: boolean;
  isAdjusting: boolean;
  error: string | null;
  hasCompletedOnboarding: boolean;
  needsOnboarding: boolean;

  setOnboardingData: (data: OnboardingData) => void;
  setSurveyLevelResult: (result: SurveyLevelResult | null) => void;
  setPendingPostSignupIntent: (intent: 'plan' | 'signup_only' | null) => void;
  setPendingPostSignupEmail: (email: string | null) => void;
  stashPendingResumeContext: (data: OnboardingData, result: SurveyLevelResult) => void;
  applyPendingResumeContext: () => void;
  clearPendingResumeContext: () => void;
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
  swapExercise: (dayLabel: WorkoutDay['dayLabel'], exerciseIndex: number, newExerciseName: string) => void;
  applyRuleBasedAdjustment: (userId: string) => Promise<void>;
  syncRecurringPlanForToday: (userId: string, today?: Date) => Promise<void>;
}

export const useAIPlanStore = create<AIPlanState>()(
  persist(
    (set, get) => ({
      onboardingData: null,
      surveyLevelResult: null,
      pendingPostSignupIntent: null,
      pendingPostSignupEmail: null,
      pendingResumeOnboardingData: null,
      pendingResumeSurveyLevelResult: null,
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
        set({
          onboardingData: normalizeOnboardingData(data),
          hasCompletedOnboarding: true,
        }),

      setSurveyLevelResult: (result) => set({ surveyLevelResult: result }),

      setPendingPostSignupIntent: (intent) => set({ pendingPostSignupIntent: intent }),

      setPendingPostSignupEmail: (email) => set({ pendingPostSignupEmail: email }),

      stashPendingResumeContext: (data, result) =>
        set({
          pendingResumeOnboardingData: normalizeOnboardingData(data),
          pendingResumeSurveyLevelResult: result,
        }),

      applyPendingResumeContext: () =>
        set((state) => ({
          onboardingData: state.pendingResumeOnboardingData ?? state.onboardingData,
          surveyLevelResult: state.pendingResumeSurveyLevelResult ?? state.surveyLevelResult,
          hasCompletedOnboarding: Boolean(
            state.pendingResumeOnboardingData ?? state.onboardingData ?? state.hasCompletedOnboarding
          ),
        })),

      clearPendingResumeContext: () =>
        set({
          pendingResumeOnboardingData: null,
          pendingResumeSurveyLevelResult: null,
        }),

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

      swapExercise: (dayLabel, exerciseIndex, newExerciseName) =>
        set((state) => ({
          currentPlan: state.currentPlan
            ? {
                ...state.currentPlan,
                weeklyWorkout: state.currentPlan.weeklyWorkout.map((day) =>
                  day.dayLabel !== dayLabel
                    ? day
                    : {
                        ...day,
                        exercises: day.exercises.map((exercise, index) =>
                          index === exerciseIndex
                            ? { ...exercise, name: newExerciseName.trim() || exercise.name }
                            : exercise
                        ),
                      }
                ),
              }
            : null,
        })),

      reset: () =>
        set((state) => {
          const shouldPreserveResumeContext = Boolean(
            state.pendingPostSignupIntent && state.onboardingData && state.surveyLevelResult
          );

          return {
            onboardingData: shouldPreserveResumeContext ? state.onboardingData : null,
            surveyLevelResult: shouldPreserveResumeContext ? state.surveyLevelResult : null,
            pendingPostSignupIntent: shouldPreserveResumeContext ? state.pendingPostSignupIntent : null,
            pendingPostSignupEmail: shouldPreserveResumeContext ? state.pendingPostSignupEmail : null,
            pendingResumeOnboardingData: shouldPreserveResumeContext
              ? state.pendingResumeOnboardingData ?? state.onboardingData
              : null,
            pendingResumeSurveyLevelResult: shouldPreserveResumeContext
              ? state.pendingResumeSurveyLevelResult ?? state.surveyLevelResult
              : null,
            currentPlan: null,
            previousPlan: null,
            isGenerating: false,
            isAdjusting: false,
            error: null,
            hasCompletedOnboarding: shouldPreserveResumeContext,
            needsOnboarding: false,
          };
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
      version: 4,
      migrate: (persistedState) => {
        const state = persistedState as Partial<AIPlanState> | undefined;
        if (!state) return persistedState as AIPlanState;

        return {
          ...state,
          onboardingData: normalizeOnboardingData(state.onboardingData),
          surveyLevelResult: state.surveyLevelResult ?? null,
          pendingPostSignupIntent: state.pendingPostSignupIntent ?? null,
          pendingPostSignupEmail: state.pendingPostSignupEmail ?? null,
          pendingResumeOnboardingData: normalizeOnboardingData(state.pendingResumeOnboardingData),
          pendingResumeSurveyLevelResult: state.pendingResumeSurveyLevelResult ?? null,
          currentPlan: normalizeAIPlan(state.currentPlan as AIPlan | LegacyAIPlan | null),
          previousPlan: normalizeAIPlan(state.previousPlan as AIPlan | LegacyAIPlan | null),
        } as AIPlanState;
      },
    }
  )
);
