export function getFoodDisplayName(food, language = 'en') {
  if (!food) {
    return ''
  }

  if (language === 'ko') {
    return food.localNames?.ko || food.name
  }

  return food.localNames?.en || food.name
}

export function getFoodAllNames(food) {
  return [food?.name, food?.localNames?.ko, food?.localNames?.en].filter(Boolean)
}

export function getMealDisplayName(meal, foodMap, language = 'en') {
  if (meal?.foodId && foodMap?.has(meal.foodId)) {
    return getFoodDisplayName(foodMap.get(meal.foodId), language)
  }

  if (meal?.name && foodMap?.size) {
    const matchedFood = [...foodMap.values()].find((food) => getFoodAllNames(food).includes(meal.name))

    if (matchedFood) {
      return getFoodDisplayName(matchedFood, language)
    }
  }

  return meal?.name || ''
}
