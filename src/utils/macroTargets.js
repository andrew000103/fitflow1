export const MACRO_RATIO_PRESETS = {
  balanced: {
    carbs: 0.4,
    protein: 0.4,
    fat: 0.2,
  },
  lower_carb: {
    carbs: 0.5,
    protein: 0.3,
    fat: 0.2,
  },
}

export function getMacroRatioPreset(preset) {
  return MACRO_RATIO_PRESETS[preset] || MACRO_RATIO_PRESETS.balanced
}

export function buildMacroTargets(recommendedCalories, preset = 'balanced') {
  const safeCalories = Number(recommendedCalories || 0)
  const ratio = getMacroRatioPreset(preset)

  return {
    carbs: Math.round((safeCalories * ratio.carbs) / 4),
    protein: Math.round((safeCalories * ratio.protein) / 4),
    fat: Math.round((safeCalories * ratio.fat) / 9),
  }
}
