import {
  CATEGORY_MUSCLE_FALLBACKS,
  EXERCISE_MUSCLE_MAP,
  MUSCLE_LABELS,
  normalizeExerciseKey,
} from '../data/exerciseMuscleMap.js'
import { MUSCLE_RECOVERY_RATES } from '../data/muscleRecoveryRates.js'

const DEFAULT_RPE = 8

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

export function calculateWorkoutMuscleLoad(workoutSets, exerciseMuscleMap = EXERCISE_MUSCLE_MAP) {
  const totals = createEmptyMuscleMap()

  workoutSets.forEach((setItem) => {
    const contribution =
      exerciseMuscleMap[normalizeExerciseKey(setItem.exerciseName)] ||
      getExerciseMuscleContribution(setItem.exerciseName, setItem.category)

    const setScore = 1 * getRpeFactor(Number(setItem.rpe || DEFAULT_RPE))

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
      const recoveryRate = recoveryRates[muscle] || 0.78
      const decayed = load * Math.pow(recoveryRate, daysPassed)
      totals[muscle] += decayed
    })
  })

  return totals
}

export function normalizeMuscleScores(rawFatigue) {
  return Object.fromEntries(
    Object.entries(rawFatigue).map(([muscle, value]) => {
      const normalized = 100 * (1 - Math.exp(-(value || 0) / 3.4))
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
