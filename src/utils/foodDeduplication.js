function normalizeFoodName(name = '') {
  return name.toLowerCase().trim().replace(/[^a-z0-9가-힣]+/g, ' ').trim()
}

function nutritionSimilarity(left = {}, right = {}) {
  const keys = ['kcal', 'carbs', 'protein', 'fat']
  return keys.every((key) => Math.abs(Number(left[key] || 0) - Number(right[key] || 0)) <= (key === 'kcal' ? 30 : 6))
}

export function findFoodMergeCandidate({ customFood, existingCustomFoods, canonicalFoods }) {
  const normalizedName = normalizeFoodName(customFood.name)
  const matchingCustomFoods = existingCustomFoods.filter((item) => {
    if (normalizeFoodName(item.name) !== normalizedName) {
      return false
    }

    return nutritionSimilarity(item.nutritionPerServing, customFood.nutritionPerServing)
  })

  const canonicalMatch = canonicalFoods.find((item) => {
    if (normalizeFoodName(item.name) !== normalizedName) {
      return false
    }

    return nutritionSimilarity(item.nutritionPerServing, customFood.nutritionPerServing)
  })

  const confidenceScore = canonicalMatch ? 0.92 : matchingCustomFoods.length >= 2 ? 0.84 : matchingCustomFoods.length >= 1 ? 0.68 : 0

  if (!canonicalMatch && matchingCustomFoods.length === 0) {
    return null
  }

  return {
    id: `food-merge-${Date.now()}`,
    normalizedName,
    customFoodIds: [customFood.id, ...matchingCustomFoods.map((item) => item.id)],
    suggestedCanonicalFoodId: canonicalMatch?.id || null,
    confidenceScore,
    reviewStatus: 'pending',
    createdAt: new Date().toISOString(),
  }
}
