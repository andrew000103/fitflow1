import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import AppIcon from '../components/AppIcon.jsx'
import { calculateNetCalories, calculateRecommendedCalories } from '../utils/fitnessMetrics.ts'
import { getFoodDisplayName, getMealDisplayName } from '../utils/foodNaming.js'
import { mealTypeLabel, tx } from '../utils/appLanguage.js'

const mealSections = [
  { key: 'breakfast', label: '아침 식사', icon: 'nutrition', empty: '아직 아침 기록이 없습니다.' },
  { key: 'lunch', label: '점심 식사', icon: 'nutrition', empty: '아직 점심 기록이 없습니다.' },
  { key: 'dinner', label: '저녁 식사', icon: 'nutrition', empty: '아직 저녁 기록이 없습니다.' },
  { key: 'snack', label: '간식 / 기타', icon: 'nutrition', empty: '아직 간식 기록이 없습니다.' },
]

function pickItems(items, offset, count = 2) {
  if (!items.length) {
    return []
  }

  return Array.from({ length: Math.min(count, items.length) }, (_, index) => items[(offset + index) % items.length])
}

function getTodayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeMeal(meal, index) {
  const defaultType = mealSections[index % mealSections.length].key
  return {
    ...meal,
    mealType: meal.mealType || defaultType,
    carbs: meal.carbs ?? Math.round((meal.calories - meal.protein * 4) / 8),
    fat: meal.fat ?? Math.max(4, Math.round(meal.calories / 45)),
    favorite: meal.favorite ?? false,
    loggedDate: meal.loggedDate || getTodayIso(),
  }
}

function NutritionHubPage() {
  const {
    meals,
    totalBurn,
    recommendedCalories,
    foods,
    customFoods,
    appLanguage,
    foodNameLanguage,
    aiCoach,
    goal,
    quickAddSuggestedMeal,
  } = useOutletContext()
  const [quickAccessTab, setQuickAccessTab] = useState('ff')
  const [ffRefreshIndex, setFfRefreshIndex] = useState(0)
  const [cheatPick, setCheatPick] = useState('버거')

  const todayIso = getTodayIso()
  const normalizedMeals = useMemo(() => meals.map((meal, index) => normalizeMeal(meal, index)), [meals])
  const todayMeals = normalizedMeals.filter((meal) => meal.loggedDate === todayIso)
  const foodMap = useMemo(
    () => new Map([...customFoods, ...foods].map((food) => [food.id, food])),
    [customFoods, foods],
  )

  const mealGroups = mealSections.map((section) => ({
    ...section,
    items: todayMeals.filter((meal) => meal.mealType === section.key),
  }))

  const todayConsumedCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0)
  const macroTotals = todayMeals.reduce(
    (acc, meal) => {
      acc.carbs += meal.carbs
      acc.protein += meal.protein
      acc.fat += meal.fat
      return acc
    },
    { carbs: 0, protein: 0, fat: 0 },
  )

  const recommendedRange = calculateRecommendedCalories(totalBurn, goal === 'diet' ? 'cut' : goal)
  const todayNetCalories = calculateNetCalories(todayConsumedCalories, totalBurn)
  const ffRecommendations = useMemo(
    () => foods.slice().sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0)).slice(0, 4),
    [foods],
  )
  const recentEntries = useMemo(
    () => Array.from(new Map(normalizedMeals.map((meal) => [meal.name, meal])).values()).slice(0, 4),
    [normalizedMeals],
  )
  const visibleFfRecommendations = useMemo(
    () => pickItems(ffRecommendations, ffRefreshIndex, 2),
    [ffRecommendations, ffRefreshIndex],
  )
  const cheatFoodPool = useMemo(
    () => (appLanguage === 'ko' ? ['버거', '피자', '치킨', '라면', '떡볶이', '디저트'] : ['Burger', 'Pizza', 'Fried Chicken', 'Ramen', 'Tteokbokki', 'Dessert']),
    [appLanguage],
  )
  const currentCheatPick = cheatFoodPool.includes(cheatPick) ? cheatPick : cheatFoodPool[0]

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={tx(appLanguage, '식단 / 다이어리', 'Nutrition / Diary')}
        title={tx(appLanguage, '식단 기록을 빠르게 이어가는 다이어리', 'Fast Nutrition Diary')}
        description={tx(appLanguage, '요약 다음에 바로 meal sections를 보여주고, 추천은 그 아래 작은 슬롯으로만 둡니다.', 'Show meal sections right after summary, with recommendations kept small below.')}
      />

      <article className="content-card nutrition-home-card">
        <div className="nutrition-home-head">
          <div>
            <span className="card-kicker">{tx(appLanguage, '오늘 요약', 'Today Summary')}</span>
            <h2>{todayConsumedCalories} / {recommendedCalories} kcal</h2>
            <p>{tx(appLanguage, `권장 범위 ${recommendedRange.min} - ${recommendedRange.max} kcal · Net ${todayNetCalories} kcal`, `Recommended range ${recommendedRange.min} - ${recommendedRange.max} kcal · Net ${todayNetCalories} kcal`)}</p>
          </div>
          <div className="nutrition-home-side">
            <span className="mini-panel">Net {todayNetCalories} kcal</span>
          </div>
        </div>
        <div className="nutrition-macro-compact">
          <span>C {macroTotals.carbs}g</span>
          <span>P {macroTotals.protein}g</span>
          <span>F {macroTotals.fat}g</span>
          <span>{tx(appLanguage, `남음 ${Math.max(0, recommendedCalories - todayConsumedCalories)} kcal`, `Remaining ${Math.max(0, recommendedCalories - todayConsumedCalories)} kcal`)}</span>
        </div>
      </article>

      <article className="content-card">
        <div className="feed-head">
          <div>
            <span className="card-kicker">{tx(appLanguage, '식사', 'Meals')}</span>
            <h2>{tx(appLanguage, '식사별 기록이 메인입니다', 'Meals are the main action')}</h2>
          </div>
          <Link className="inline-action" to={{ pathname: '/nutrition/add-food', search: '?mealType=lunch' }}>
            {tx(appLanguage, '음식 검색', 'Search Food')}
          </Link>
        </div>
        <div className="meal-section-grid">
                {mealGroups.map((section) => (
            <article className="meal-section-card" key={section.key}>
              <div className="feed-head">
                <div>
                  <strong><AppIcon name={section.icon} size="sm" /> {mealTypeLabel(appLanguage, section.key)}</strong>
                  <span className="mini-caption">{section.items.reduce((sum, item) => sum + item.calories, 0)} kcal</span>
                </div>
                <Link
                  className="inline-action"
                  to={{ pathname: '/nutrition/add-food', search: `?mealType=${section.key}` }}
                >
                  {tx(appLanguage, '+ 음식 추가', '+ Add Food')}
                </Link>
              </div>
              <div className="simple-list">
                {section.items.length > 0 ? (
                  section.items.slice(0, 3).map((meal) => (
                    <div className="simple-row compact nutrition-food-preview minimal" key={meal.id}>
                      <strong>{getMealDisplayName(meal, foodMap, foodNameLanguage)}</strong>
                      <span>{meal.calories} kcal</span>
                      <span>{meal.selectedUnitLabel || `P ${meal.protein}g`}</span>
                    </div>
                  ))
                ) : (
                  <div className="mini-panel">
                    {section.key === 'breakfast'
                      ? tx(appLanguage, '아직 아침 기록이 없습니다.', 'No breakfast logged yet.')
                      : section.key === 'lunch'
                        ? tx(appLanguage, '아직 점심 기록이 없습니다.', 'No lunch logged yet.')
                        : section.key === 'dinner'
                          ? tx(appLanguage, '아직 저녁 기록이 없습니다.', 'No dinner logged yet.')
                          : tx(appLanguage, '아직 간식 기록이 없습니다.', 'No snacks logged yet.')}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </article>

      <article className="content-card nutrition-home-quick-widget">
        <div className="feed-head">
          <div>
            <span className="card-kicker">{tx(appLanguage, '빠른 접근', 'Quick Access')}</span>
            <h2>{tx(appLanguage, '추천과 최근 기록만 간결하게', 'Keep recommendations and recent items compact')}</h2>
          </div>
          <div className="quick-inline-tools">
            <span className="mini-panel">{aiCoach.nutritionTitle}</span>
            {quickAccessTab === 'ff' ? (
              <button
                className="inline-action"
                type="button"
                onClick={() => setFfRefreshIndex((current) => (current + 2) % Math.max(ffRecommendations.length, 1))}
              >
                <AppIcon name="refresh" size="sm" />
              </button>
            ) : null}
          </div>
        </div>
        <div className="program-chip-list">
          <button
            type="button"
            className={quickAccessTab === 'ff' ? 'inline-action active-soft' : 'inline-action'}
            onClick={() => setQuickAccessTab('ff')}
          >
            {tx(appLanguage, 'FF 추천', 'FF Picks')}
          </button>
          <button
            type="button"
            className={quickAccessTab === 'recent' ? 'inline-action active-soft' : 'inline-action'}
            onClick={() => setQuickAccessTab('recent')}
          >
            {tx(appLanguage, '최근', 'Recent')}
          </button>
        </div>
        <div className="nutrition-food-chip-grid compact">
          {quickAccessTab === 'ff'
            ? visibleFfRecommendations.map((food) => (
                <Link
                  key={food.id}
                  className="quick-add-card compact"
                  to={{ pathname: `/nutrition/food/${food.id}`, search: '?mealType=lunch' }}
                >
                  <strong>{getFoodDisplayName(food, foodNameLanguage)}</strong>
                  <span>{food.nutritionPerServing.kcal} kcal</span>
                  <span>{tx(appLanguage, 'FF 추천', 'FF Pick')}</span>
                </Link>
              ))
            : recentEntries.map((meal) =>
                meal.foodId && foodMap.has(meal.foodId) ? (
                  <Link
                    key={meal.id}
                    className="quick-add-card compact"
                    to={{ pathname: `/nutrition/food/${meal.foodId}`, search: `?mealType=${meal.mealType || 'lunch'}` }}
                  >
                    <strong>{getMealDisplayName(meal, foodMap, foodNameLanguage)}</strong>
                    <span>{meal.calories} kcal</span>
                    <span>{tx(appLanguage, '최근', 'Recent')}</span>
                  </Link>
                ) : (
                  <button
                    key={meal.id}
                    className="quick-add-card compact"
                    type="button"
                    onClick={() => quickAddSuggestedMeal(meal.name)}
                  >
                    <strong>{getMealDisplayName(meal, foodMap, foodNameLanguage)}</strong>
                    <span>{meal.calories} kcal</span>
                    <span>{tx(appLanguage, '최근', 'Recent')}</span>
                  </button>
                ),
              )}
        </div>
      </article>

      <article className="content-card nutrition-cheat-widget">
        <div className="feed-head">
          <div>
            <span className="card-kicker">Today&apos;s Cheat Pick</span>
            <h2>{tx(appLanguage, '오늘은 치팅데이', "Today's Cheat Pick")}</h2>
          </div>
          <button
            className="inline-action"
            type="button"
            onClick={() => setCheatPick(cheatFoodPool[Math.floor(Math.random() * cheatFoodPool.length)])}
          >
            <AppIcon name="refresh" size="sm" />
          </button>
        </div>
        <button
          className="nutrition-cheat-pick-button"
          type="button"
          onClick={() => setCheatPick(cheatFoodPool[Math.floor(Math.random() * cheatFoodPool.length)])}
        >
          <span>{tx(appLanguage, '오늘의 치팅 픽', "Today's Cheat Pick")}</span>
          <strong>{currentCheatPick}</strong>
        </button>
      </article>
    </section>
  )
}

export default NutritionHubPage
