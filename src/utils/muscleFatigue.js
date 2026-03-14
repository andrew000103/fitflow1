import {
  CATEGORY_MUSCLE_FALLBACKS,
  EXERCISE_MUSCLE_MAP,
  MUSCLE_LABELS,
  normalizeExerciseKey,
} from '../data/exerciseMuscleMap.js'
import { MUSCLE_RECOVERY_PROFILES, MUSCLE_RECOVERY_RATES } from '../data/muscleRecoveryRates.js'

const DEFAULT_RPE = 8
const DEFAULT_REST_SECONDS = 90

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function createEmptyMuscleMap() {
  return Object.fromEntries(Object.keys(MUSCLE_LABELS).map((key) => [key, 0]))
}

function getDaysPassed(dateString, now = new Date()) {
  if (!dateString) {
    return 0
  }

  const [year, month, day] = dateString.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.round((base.getTime() - target.getTime()) / 86400000))
}

export function getExerciseMuscleContribution(exerciseName, category) {
  const key = normalizeExerciseKey(exerciseName)
  return EXERCISE_MUSCLE_MAP[key] || CATEGORY_MUSCLE_FALLBACKS[category] || {}
}

export function getRpeFactor(rpe = DEFAULT_RPE) {
  if (rpe <= 6) return 0.8
  if (rpe === 7) return 0.9
  if (rpe === 8) return 1.0
  if (rpe === 9) return 1.15
  return 1.3
}

export function getRestDensityFactor(restSeconds = DEFAULT_REST_SECONDS) {
  if (restSeconds <= 45) return 1.15
  if (restSeconds <= 75) return 1.08
  if (restSeconds <= 120) return 1
  if (restSeconds <= 180) return 0.94
  return 0.88
}

export function getSetStimulusScore(setItem) {
  const weight = Number(setItem.weight ?? setItem.weightKg ?? 0)
  const reps = Number(setItem.reps ?? 0)
  const volume = Math.max(0, weight * reps)
  const rpeFactor = getRpeFactor(Number(setItem.rpe || DEFAULT_RPE))
  const restFactor = getRestDensityFactor(Number(setItem.restSeconds ?? setItem.restSecAfter ?? DEFAULT_REST_SECONDS))
  const repFactor = reps > 0 ? 0.82 + clamp(reps, 1, 20) * 0.022 : 0.82
  const intensityFactor = weight > 0 ? 0.9 + clamp(weight / 120, 0, 0.35) : 0.9

  // Use sqrt(volume) so heavy sets matter more without letting one giant set
  // overpower the whole fatigue map.
  return (Math.sqrt(Math.max(volume, 1)) / 6) * rpeFactor * restFactor * repFactor * intensityFactor
}

export function getMuscleRecoveryProfile(muscle) {
  return MUSCLE_RECOVERY_PROFILES[muscle] || { dailyRecovery: 0.22, label: 'Moderate' }
}

export function calculateWorkoutMuscleLoad(workoutSets, exerciseMuscleMap = EXERCISE_MUSCLE_MAP) {
  const totals = createEmptyMuscleMap()

  workoutSets.forEach((setItem) => {
    const contribution =
      exerciseMuscleMap[normalizeExerciseKey(setItem.exerciseName)] ||
      getExerciseMuscleContribution(setItem.exerciseName, setItem.category)

    const setScore = getSetStimulusScore(setItem)

    Object.entries(contribution).forEach(([muscle, share]) => {
      totals[muscle] += setScore * share
    })
  })

  return totals
}

export function applyFatigueDecay(fatigueEntries, recoveryRates = MUSCLE_RECOVERY_RATES, now = new Date()) {
  const totals = createEmptyMuscleMap()

  fatigueEntries.forEach((entry) => {
    const daysPassed = typeof entry.daysPassed === 'number' ? entry.daysPassed : getDaysPassed(entry.date, now)

    Object.entries(entry.loads || {}).forEach(([muscle, load]) => {
      const recoveryRate = recoveryRates[muscle] || 1 - getMuscleRecoveryProfile(muscle).dailyRecovery
      const decayed = load * Math.pow(recoveryRate, daysPassed)
      totals[muscle] += decayed
    })
  })

  return totals
}

export function normalizeMuscleScores(rawFatigue) {
  return Object.fromEntries(
    Object.entries(rawFatigue).map(([muscle, value]) => {
      const normalized = 100 * (1 - Math.exp(-(value || 0) / 12))
      return [muscle, Math.round(clamp(normalized, 0, 100))]
    }),
  )
}

export function getMuscleColor(score) {
  if (score >= 85) return '#c2410c'
  if (score >= 65) return '#ea580c'
  if (score >= 45) return '#eab308'
  if (score >= 20) return '#fde68a'
  return '#e5e7eb'
}

export function getFatigueLevel(score) {
  if (score >= 75) return '매우 높음'
  if (score >= 50) return '높음'
  if (score >= 25) return '보통'
  return '낮음'
}

export function getRecoveryRecommendation(scores) {
  const rows = Object.entries(scores)
    .map(([muscle, score]) => ({
      muscle,
      label: MUSCLE_LABELS[muscle],
      score,
      level: getFatigueLevel(score),
      recovery: getMuscleRecoveryProfile(muscle),
    }))
    .sort((a, b) => b.score - a.score)

  return {
    shouldRest: rows.filter((item) => item.score >= 55).slice(0, 3),
    trainable: [...rows].reverse().filter((item) => item.score <= 35).slice(0, 3),
    primaryUsage: rows.slice(0, 3),
    rows,
  }
}

export function calculateMuscleFatigue(sessions, now = new Date()) {
  const fatigueEntries = sessions.map((session) => {
    const workoutSets = session.exercises.flatMap((exercise) =>
      (exercise.timeline || []).map((setItem) => ({
        exerciseName: exercise.name,
        category: exercise.category,
        weight: Number(setItem.weight || 0),
        reps: Number(setItem.reps || 0),
        restSeconds: Number(setItem.restSeconds || setItem.restSecAfter || session.restSeconds || DEFAULT_REST_SECONDS),
        rpe: Number(setItem.rpe || session.rpe || DEFAULT_RPE),
      })),
    )

    return {
      date: session.date,
      loads: calculateWorkoutMuscleLoad(workoutSets),
    }
  })

  return applyFatigueDecay(fatigueEntries, MUSCLE_RECOVERY_RATES, now)
}
