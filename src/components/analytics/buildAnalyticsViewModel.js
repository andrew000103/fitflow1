import { calculateDailyBurn, calculateNetCalories } from '../../utils/fitnessMetrics.ts'
import { getMacroRatioPreset } from '../../utils/macroTargets.js'

const bodyWeightTrend = [
  { day: 'Mon', weight: 78.4 },
  { day: 'Tue', weight: 78.2 },
  { day: 'Wed', weight: 78.1 },
  { day: 'Thu', weight: 78.0 },
  { day: 'Fri', weight: 77.9 },
  { day: 'Sat', weight: 77.8 },
  { day: 'Sun', weight: 77.7 },
]

const heatmapPattern = [
  [1, 0, 2, 1, 3, 2, 0],
  [0, 2, 2, 1, 0, 3, 1],
  [2, 1, 0, 3, 2, 1, 0],
  [3, 2, 1, 0, 2, 2, 1],
]

function categoryDisplay(category) {
  const labels = {
    chest: 'Chest',
    shoulders: 'Shoulders',
    back: 'Back',
    legs: 'Legs',
    abs: 'Abs',
    arms: 'Arms',
  }

  return labels[category] || category
}

function buildAnalyticsViewModel(context) {
  const {
    weeklyData,
    sessions,
    meals,
    totalVolume,
    netCalories,
    fatigueLabel,
    recommendedCalories,
    weeklyStepAverage,
    fatigueScore,
    fatigueByMuscle,
    recommendedCaloriesRange,
    lastWorkoutSummary,
    totalWorkoutCalories,
    aiCoach,
    userProfile,
  } = context

  const weeklyWorkoutCount = weeklyData.filter((item) => item.workout > 0).length

  const calorieTrend = weeklyData.map((item) => ({
    day: item.day,
    intake: item.intake,
    burn: calculateDailyBurn({
      bmrCalories: 1680,
      stepCalories: Math.round(item.steps * 0.04),
      exerciseCalories: Math.round(item.workout * 7.2),
    }),
  }))

  const fatigueRows = Object.entries(fatigueByMuscle || {})
    .map(([category, volume]) => ({
      category,
      label: categoryDisplay(category),
      volume,
      fatigue: Math.min(100, Math.round(Number(volume) || 0)),
    }))
    .sort((a, b) => b.volume - a.volume)

  const routineAdherence = Math.min(
    100,
    Math.round((weeklyWorkoutCount / Math.max(1, weeklyData.filter((item) => item.workout > 0).length)) * 100),
  )

  const currentMacros = meals.reduce(
    (acc, meal) => {
      acc.carbs += meal.carbs || 0
      acc.protein += meal.protein || 0
      acc.fat += meal.fat || 0
      return acc
    },
    { carbs: 0, protein: 0, fat: 0 },
  )

  const macroRatio = getMacroRatioPreset(userProfile?.macroRatioPreset)
  const macroBars = [
    {
      label: 'Carbs',
      value: Math.round(macroRatio.carbs * 100),
      current: currentMacros.carbs,
      className: '',
    },
    {
      label: 'Protein',
      value: Math.round(macroRatio.protein * 100),
      current: currentMacros.protein,
      className: 'protein',
    },
    {
      label: 'Fat',
      value: Math.round(macroRatio.fat * 100),
      current: currentMacros.fat,
      className: 'fat',
    },
  ]

  const topPRs = [...sessions]
    .flatMap((session) =>
      session.exercises.map((exercise) => ({
        session: session.title,
        name: exercise.name,
        estimated1RM: exercise.estimated1RM,
        maxWeight: exercise.maxWeight,
      })),
    )
    .sort((a, b) => b.estimated1RM - a.estimated1RM)
    .slice(0, 5)

  const weightMin = Math.min(...bodyWeightTrend.map((item) => item.weight))
  const weightMax = Math.max(...bodyWeightTrend.map((item) => item.weight))

  return {
    aiCoach,
    bodyWeightTrend,
    calorieTrend,
    calculateNetCalories,
    fatigueLabel,
    fatigueRows,
    fatigueScore,
    heatmapPattern,
    lastWorkoutSummary,
    macroBars,
    netCalories,
    recommendedCalories,
    recommendedCaloriesRange,
    routineAdherence,
    topPRs,
    totalVolume,
    totalWorkoutCalories,
    weightMax,
    weightMin,
    weeklyStepAverage,
    weeklyWorkoutCount,
    weeklyData,
  }
}

export default buildAnalyticsViewModel
