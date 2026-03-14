export function calculateHealthTargets({
  age,
  heightCm,
  weightKg,
  gender,
  activityLevel,
  goalType,
}) {
  const safeAge = Number(age)
  const safeHeight = Number(heightCm)
  const safeWeight = Number(weightKg)

  const activityMap = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    high: 1.725,
  }

  const activityMultiplier = activityMap[activityLevel] ?? 1.375

  let bmr = 0

  if (gender === 'male') {
    bmr = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5
  } else if (gender === 'female') {
    bmr = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 161
  } else {
    const maleBmr = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5
    const femaleBmr = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 161
    bmr = (maleBmr + femaleBmr) / 2
  }

  const tdee = bmr * activityMultiplier

  let targetCalories = tdee
  let targetProtein = safeWeight * 1.8
  let targetSteps = 8000

  if (goalType === 'cut') {
    targetCalories = tdee - 400
    targetProtein = safeWeight * 2.0
    targetSteps = 10000
  } else if (goalType === 'maintain') {
    targetCalories = tdee
    targetProtein = safeWeight * 1.8
    targetSteps = 8000
  } else if (goalType === 'bulk') {
    targetCalories = tdee + 250
    targetProtein = safeWeight * 1.9
    targetSteps = 7000
  }

  let targetWorkoutsPerWeek = 3
  if (activityLevel === 'moderate') targetWorkoutsPerWeek = 4
  if (activityLevel === 'high') targetWorkoutsPerWeek = 5

  return {
    targetCalories: Math.round(targetCalories),
    targetProteinG: Math.round(targetProtein),
    targetSteps: Math.round(targetSteps),
    targetWorkoutsPerWeek,
  }
}
