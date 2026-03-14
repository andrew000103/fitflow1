import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import AppIcon from '../components/AppIcon.jsx'
import { getFoodDisplayName, getMealDisplayName } from '../utils/foodNaming.js'
import { mealTypeLabel, tx } from '../utils/appLanguage.js'

const mealSections = [
  { key: 'breakfast', label: 'Breakfast', empty: '아직 아침 기록이 없습니다.' },
  { key: 'lunch', label: 'Lunch', empty: '아직 점심 기록이 없습니다.' },
  { key: 'dinner', label: 'Dinner', empty: '아직 저녁 기록이 없습니다.' },
  { key: 'snack', label: 'Snacks', empty: '아직 간식 기록이 없습니다.' },
]

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function pickItems(items, offset, count = 2) {
  if (!items.length) {
    return []
  }

  return Array.from({ length: Math.min(count, items.length) }, (_, index) => items[(offset + index) % items.length])
}

function NutritionLauncherPage() {
  const {
    meals,
    foods,
    customFoods,
    appLanguage,
    foodNameLanguage,
    quickAddSuggestedMeal,
    recommendedCalories,
    totalBurn,
    aiCoach,
  } = useOutletContext()
  const [quickAccessTab, setQuickAccessTab] = useState('ff')
  const [ffRefreshIndex, setFfRefreshIndex] = useState(0)
  const [cheatPick, setCheatPick] = useState('Burger')

  const todayIso = formatLocalDate()
  const todayMeals = useMemo(
    () => meals.filter((meal) => (meal.loggedDate || todayIso) === todayIso),
    [meals, todayIso],
  )
  const foodMap = useMemo(
    () => new Map([...customFoods, ...foods].map((food) => [food.id, food])),
    [customFoods, foods],
  )

  const macroTotals = todayMeals.reduce(
    (acc, meal) => {
      acc.calories += Number(meal.calories || 0)
      acc.carbs += Number(meal.carbs || 0)
      acc.protein += Number(meal.protein || 0)
      acc.fat += Number(meal.fat || 0)
      return acc
    },
    { calories: 0, carbs: 0, protein: 0, fat: 0 },
  )

  const progressPercent = Math.min(
    100,
    recommendedCalories > 0 ? Math.round((macroTotals.calories / recommendedCalories) * 100) : 0,
  )

  const groupedMeals = mealSections.map((section) => {
    const items = todayMeals.filter((meal) => meal.mealType === section.key)
    return {
      ...section,
      items,
      calories: items.reduce((sum, meal) => sum + Number(meal.calories || 0), 0),
    }
  })

  const ffRecommendations = useMemo(() => foods.slice().sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0)).slice(0, 4), [foods])

  const recentEntries = useMemo(
    () => Array.from(new Map(meals.map((meal) => [meal.name, meal])).values()).slice(0, 4),
    [meals],
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
        eyebrow={tx(appLanguage, '식단', 'Nutrition')}
        title={tx(appLanguage, '오늘의 식단 다이어리', "Today's Diary")}
        description={tx(appLanguage, '오늘 먹은 음식 기록을 가장 빠르게 이어가는 Nutrition 홈입니다.', 'The fastest home for continuing today meal log.')}
      />

      <article className="content-card nutrition-home-card">
        <div className="nutrition-home-head">
          <div>
            <span className="card-kicker">{tx(appLanguage, '오늘', 'Today')}</span>
            <h2>{macroTotals.calories} kcal</h2>
            <p>{tx(appLanguage, `목표 ${recommendedCalories} kcal 대비 ${progressPercent}% 진행 중입니다.`, `${progressPercent}% of your ${recommendedCalories} kcal target.`)}</p>
          </div>
          <div className="nutrition-home-side">
            <span className="mini-panel">{tx(appLanguage, `소모 ${Math.round(totalBurn)} kcal`, `Burn ${Math.round(totalBurn)} kcal`)}</span>
            <span className="mini-panel">{tx(appLanguage, `${todayMeals.length}개 기록`, `${todayMeals.length} meals logged`)}</span>
          </div>
        </div>

        <div className="nutrition-progress-track" aria-label="Calorie progress">
          <span style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="nutrition-macro-compact">
          <span>C {macroTotals.carbs}g</span>
          <span>P {macroTotals.protein}g</span>
          <span>F {macroTotals.fat}g</span>
          <span>{tx(appLanguage, `남음 ${Math.max(0, recommendedCalories - macroTotals.calories)} kcal`, `Remaining ${Math.max(0, recommendedCalories - macroTotals.calories)} kcal`)}</span>
        </div>
      </article>

      <section className="nutrition-meal-section">
        <div className="feed-head">
          <div>
            <span className="card-kicker">{tx(appLanguage, '식사', 'Meals')}</span>
            <h2>{tx(appLanguage, '식사별 기록', 'Meals')}</h2>
          </div>
          <Link className="inline-action" to={{ pathname: '/nutrition/add-food', search: '?mealType=lunch' }}>
            {tx(appLanguage, '음식 검색', 'Search Food')}
          </Link>
        </div>

        <div className="nutrition-meal-grid">
          {groupedMeals.map((section) => (
            <article className="content-card nutrition-meal-card" key={section.key}>
              <div className="feed-head">
                <div>
                  <strong>{mealTypeLabel(appLanguage, section.key)}</strong>
                  <span className="mini-caption">{section.calories} kcal</span>
                </div>
                <Link
                  className="inline-action"
                  to={{ pathname: '/nutrition/add-food', search: `?mealType=${section.key}` }}
                >
                  {tx(appLanguage, '+ 음식 추가', '+ Add Food')}
                </Link>
              </div>

              <div className="nutrition-food-preview-list">
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
      </section>

      <article className="content-card nutrition-home-quick-widget">
        <div className="feed-head">
          <div>
            <span className="card-kicker">{tx(appLanguage, '빠른 접근', 'Quick Access')}</span>
            <h2>{tx(appLanguage, '작고 빠른 추천 슬롯', 'Small and fast recommendation slots')}</h2>
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

export default NutritionLauncherPage
