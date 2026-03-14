import { getFoodAllNames } from './foodNaming.js'

function normalizeText(value = '') {
  return value.toLowerCase().trim().replace(/[^a-z0-9가-힣]+/g, ' ').trim()
}

function uniqueBy(items, getKey) {
  return items.filter((item, index) => index === items.findIndex((candidate) => getKey(candidate) === getKey(item)))
}

export function searchFoods({ foods, customFoods, query }) {
  const normalizedQuery = normalizeText(query)
  const source = [...customFoods, ...foods]

  return source
    .filter((food) => {
      if (!normalizedQuery) {
        return true
      }

      const haystack = [
        ...getFoodAllNames(food),
        food.normalizedName,
        food.brand,
        food.category,
        ...(food.keywords || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
    .sort((left, right) => {
      const leftExact = getFoodAllNames(left).some((item) => normalizeText(item) === normalizedQuery) ? 1 : 0
      const rightExact = getFoodAllNames(right).some((item) => normalizeText(item) === normalizedQuery) ? 1 : 0
      if (leftExact !== rightExact) {
        return rightExact - leftExact
      }
      return (right.popularityScore || 0) - (left.popularityScore || 0)
    })
}

export function buildQuickAccessFoods({ mealType, meals, foods, customFoods }) {
  const combinedFoods = [...customFoods, ...foods]
  const foodMap = new Map(combinedFoods.map((food) => [food.id, food]))
  const mealTypeEntries = meals.filter((meal) => meal.mealType === mealType)

  const recent = uniqueBy(
    meals
      .map((meal) => meal.foodId ? foodMap.get(meal.foodId) : combinedFoods.find((food) => getFoodAllNames(food).includes(meal.name)))
      .filter(Boolean),
    (food) => food.id,
  ).slice(0, 4)

  const frequencyMap = meals.reduce((acc, meal) => {
    const key = meal.foodId || normalizeText(meal.name)
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const frequent = uniqueBy(
    combinedFoods
      .filter((food) => frequencyMap[food.id] || getFoodAllNames(food).some((item) => frequencyMap[normalizeText(item)]))
      .sort((left, right) => {
        const leftCount = frequencyMap[left.id] || Math.max(...getFoodAllNames(left).map((item) => frequencyMap[normalizeText(item)] || 0)) || 0
        const rightCount = frequencyMap[right.id] || Math.max(...getFoodAllNames(right).map((item) => frequencyMap[normalizeText(item)] || 0)) || 0
        return rightCount - leftCount
      }),
    (food) => food.id,
  ).slice(0, 4)

  const mealTypeFrequent = uniqueBy(
    mealTypeEntries
      .map((meal) => meal.foodId ? foodMap.get(meal.foodId) : combinedFoods.find((food) => getFoodAllNames(food).includes(meal.name)))
      .filter(Boolean),
    (food) => food.id,
  ).slice(0, 4)

  const popular = [...foods]
    .sort((left, right) => (right.popularityScore || 0) - (left.popularityScore || 0))
    .slice(0, 4)

  return {
    recent,
    frequent,
    mealTypeFrequent,
    popular,
    quick: [...recent, ...frequent, ...mealTypeFrequent, ...popular].filter(
      (food, index, array) => index === array.findIndex((candidate) => candidate.id === food.id),
    ).slice(0, 6),
  }
}

export function scaleFoodNutrition(food, { quantity = 1, grams = null, servingUnit = null }) {
  if (grams && food.nutritionPer100g) {
    const ratio = grams / 100
    return {
      kcal: Math.round(food.nutritionPer100g.kcal * ratio),
      carbs: Math.round(food.nutritionPer100g.carbs * ratio),
      protein: Math.round(food.nutritionPer100g.protein * ratio),
      fat: Math.round(food.nutritionPer100g.fat * ratio),
    }
  }

  const multiplier = servingUnit?.multiplier || 1
  const ratio = quantity * multiplier

  return {
    kcal: Math.round(food.nutritionPerServing.kcal * ratio),
    carbs: Math.round(food.nutritionPerServing.carbs * ratio),
    protein: Math.round(food.nutritionPerServing.protein * ratio),
    fat: Math.round(food.nutritionPerServing.fat * ratio),
  }
}
