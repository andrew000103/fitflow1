export type GoalType = 'cut' | 'maintain' | 'bulk'
export type RestMovementType = 'compound' | 'isolation'
export type RestObjective = 'strength' | 'hypertrophy' | 'custom'
export type RestTimerState = 'idle' | 'running' | 'warning' | 'finished'

export type MuscleGroup =
  | 'chest'
  | 'front_delts'
  | 'middle_delts'
  | 'rear_delts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'lats'
  | 'upper_back'
  | 'lower_back'
  | 'neck'
  | 'abs'
  | 'glutes'
  | 'hamstrings'
  | 'quadriceps'

export interface WorkoutSetInput {
  weightKg: number
  reps: number
  isCompleted?: boolean
  restSecAfter?: number | null
  completedAt?: string | Date | null
  rir?: number | null
  rpe?: number | null
}

export interface WorkoutExerciseInput {
  exerciseId?: string
  name?: string
  sets: WorkoutSetInput[]
}

export interface ExerciseBestSnapshot {
  maxWeightKg: number
  maxSetVolumeKg: number
  maxEstimated1RMKg: number
  maxExerciseVolumeKg: number
}

export interface ExercisePerformanceSummary extends ExerciseBestSnapshot {
  completedSetCount: number
}

export interface ExercisePRResult {
  isMaxWeightPR: boolean
  isMaxSetVolumePR: boolean
  isEstimated1RMPR: boolean
  isExerciseVolumePR: boolean
  nextBests: ExerciseBestSnapshot
}

export interface RestTimerInput {
  movementType: RestMovementType
  objective?: RestObjective
  customRestSec?: number | null
  userDefaultRestSec?: number | null
}

export interface DailyBurnInput {
  bmrCalories: number
  activityCalories?: number
  exerciseCalories?: number
  stepCalories?: number
}

export interface RecommendedCaloriesRange {
  min: number
  target: number
  max: number
}

export interface FatigueExerciseInput {
  muscleDistribution: Partial<Record<MuscleGroup, number>>
  sets: WorkoutSetInput[]
}

export interface FatigueDayInput {
  daysAgo: number
  exercises: FatigueExerciseInput[]
}

export interface FatigueOptions {
  lookbackDays?: number
  stimulusPerFatiguePoint?: number
  maxFatigueScore?: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function isCompletedSet(set: WorkoutSetInput) {
  return set.isCompleted !== false
}

export function calculateSetVolume(set: WorkoutSetInput) {
  return round(set.weightKg * set.reps, 2)
}

export function calculateExerciseVolume(exercise: WorkoutExerciseInput) {
  return round(
    exercise.sets.filter(isCompletedSet).reduce((sum, set) => sum + calculateSetVolume(set), 0),
    2,
  )
}

export function calculateSessionVolume(exercises: WorkoutExerciseInput[]) {
  return round(exercises.reduce((sum, exercise) => sum + calculateExerciseVolume(exercise), 0), 2)
}

export function calculateEstimated1RM(weightKg: number, reps: number) {
  if (weightKg <= 0 || reps <= 0) {
    return 0
  }

  return round(weightKg * (1 + reps / 30), 2)
}

export function summarizeExercisePerformance(exercise: WorkoutExerciseInput): ExercisePerformanceSummary {
  const completedSets = exercise.sets.filter(isCompletedSet)
  const maxWeightKg = completedSets.reduce((best, set) => Math.max(best, set.weightKg), 0)
  const maxSetVolumeKg = completedSets.reduce((best, set) => Math.max(best, calculateSetVolume(set)), 0)
  const maxEstimated1RMKg = completedSets.reduce((best, set) => {
    const estimate = set.reps <= 12 ? calculateEstimated1RM(set.weightKg, set.reps) : 0
    return Math.max(best, estimate)
  }, 0)
  const maxExerciseVolumeKg = calculateExerciseVolume(exercise)

  return {
    completedSetCount: completedSets.length,
    maxWeightKg,
    maxSetVolumeKg,
    maxEstimated1RMKg,
    maxExerciseVolumeKg,
  }
}

export function detectExercisePRs(
  exercise: WorkoutExerciseInput,
  previousBests: ExerciseBestSnapshot,
): ExercisePRResult {
  const summary = summarizeExercisePerformance(exercise)

  return {
    isMaxWeightPR: summary.maxWeightKg > previousBests.maxWeightKg,
    isMaxSetVolumePR: summary.maxSetVolumeKg > previousBests.maxSetVolumeKg,
    isEstimated1RMPR: summary.maxEstimated1RMKg > previousBests.maxEstimated1RMKg,
    isExerciseVolumePR: summary.maxExerciseVolumeKg > previousBests.maxExerciseVolumeKg,
    nextBests: {
      maxWeightKg: Math.max(summary.maxWeightKg, previousBests.maxWeightKg),
      maxSetVolumeKg: Math.max(summary.maxSetVolumeKg, previousBests.maxSetVolumeKg),
      maxEstimated1RMKg: Math.max(summary.maxEstimated1RMKg, previousBests.maxEstimated1RMKg),
      maxExerciseVolumeKg: Math.max(summary.maxExerciseVolumeKg, previousBests.maxExerciseVolumeKg),
    },
  }
}

export function resolveRestSeconds({
  movementType,
  objective = 'hypertrophy',
  customRestSec,
  userDefaultRestSec,
}: RestTimerInput) {
  if (typeof customRestSec === 'number' && customRestSec > 0) {
    return Math.round(customRestSec)
  }

  if (typeof userDefaultRestSec === 'number' && userDefaultRestSec > 0) {
    return Math.round(userDefaultRestSec)
  }

  if (objective === 'custom' && customRestSec) {
    return Math.round(customRestSec)
  }

  if (movementType === 'compound') {
    return objective === 'strength' ? 150 : 120
  }

  return 75
}

export function getRestTimerState(timeLeftSec: number) {
  if (timeLeftSec < 0) {
    return 'finished' satisfies RestTimerState
  }

  if (timeLeftSec === 0) {
    return 'idle' satisfies RestTimerState
  }

  if (timeLeftSec <= 10) {
    return 'warning' satisfies RestTimerState
  }

  return 'running' satisfies RestTimerState
}

export function calculateDailyBurn({
  bmrCalories,
  activityCalories = 0,
  exerciseCalories = 0,
  stepCalories = 0,
}: DailyBurnInput) {
  return round(bmrCalories + activityCalories + exerciseCalories + stepCalories, 2)
}

export function calculateNetCalories(intakeCalories: number, totalBurnedCalories: number) {
  return round(intakeCalories - totalBurnedCalories, 2)
}

export function calculateRecommendedCalories(
  maintenanceCalories: number,
  goalType: GoalType,
): RecommendedCaloriesRange {
  if (goalType === 'cut') {
    return {
      min: Math.round(maintenanceCalories - 500),
      target: Math.round(maintenanceCalories - 400),
      max: Math.round(maintenanceCalories - 300),
    }
  }

  if (goalType === 'bulk') {
    return {
      min: Math.round(maintenanceCalories + 200),
      target: Math.round(maintenanceCalories + 275),
      max: Math.round(maintenanceCalories + 350),
    }
  }

  return {
    min: Math.round(maintenanceCalories - 100),
    target: Math.round(maintenanceCalories),
    max: Math.round(maintenanceCalories + 100),
  }
}

export function getFatigueDecay(daysAgo: number) {
  if (daysAgo <= 0) {
    return 1
  }
  if (daysAgo === 1) {
    return 0.8
  }
  if (daysAgo === 2) {
    return 0.6
  }
  if (daysAgo === 3) {
    return 0.4
  }
  if (daysAgo === 4) {
    return 0.25
  }
  if (daysAgo === 5) {
    return 0.1
  }
  return 0
}

export function calculateMuscleFatigue(
  days: FatigueDayInput[],
  options: FatigueOptions = {},
): Partial<Record<MuscleGroup, number>> {
  const lookbackDays = options.lookbackDays ?? 5
  const stimulusPerFatiguePoint = options.stimulusPerFatiguePoint ?? 40
  const maxFatigueScore = options.maxFatigueScore ?? 100
  const totals: Partial<Record<MuscleGroup, number>> = {}

  for (const day of days) {
    if (day.daysAgo > lookbackDays) {
      continue
    }

    const decay = getFatigueDecay(day.daysAgo)
    if (decay <= 0) {
      continue
    }

    for (const exercise of day.exercises) {
      for (const set of exercise.sets) {
        if (!isCompletedSet(set)) {
          continue
        }

        const setStimulus = calculateSetVolume(set)
        for (const [muscleGroup, share] of Object.entries(exercise.muscleDistribution)) {
          if (!share || share <= 0) {
            continue
          }
          const fatiguePoints = (setStimulus * share * decay) / stimulusPerFatiguePoint
          const typedGroup = muscleGroup as MuscleGroup
          totals[typedGroup] = (totals[typedGroup] || 0) + fatiguePoints
        }
      }
    }
  }

  return Object.fromEntries(
    Object.entries(totals).map(([muscleGroup, score]) => [
      muscleGroup,
      clamp(Math.round(score as number), 0, maxFatigueScore),
    ]),
  ) as Partial<Record<MuscleGroup, number>>
}

export const EXAMPLE_MUSCLE_DISTRIBUTIONS: Record<string, Partial<Record<MuscleGroup, number>>> = {
  barbell_row: {
    lats: 0.4,
    upper_back: 0.4,
    biceps: 0.2,
  },
  squat: {
    quadriceps: 0.45,
    glutes: 0.3,
    hamstrings: 0.15,
    lower_back: 0.1,
  },
}
