import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import AppIcon from '../components/AppIcon.jsx'
import { getFoodDisplayName, getMealDisplayName } from '../utils/foodNaming.js'
import { mealTypeLabel, tx } from '../utils/appLanguage.js'
import { buildMacroTargets } from '../utils/macroTargets.js'

const CRAVING_STORAGE_KEY = 'fitflow_craving_foods'

const mealSections = [
  { key: 'breakfast', emptyKo: '아직 아침 기록이 없습니다.', emptyEn: 'No breakfast logged yet.' },
  { key: 'lunch', emptyKo: '아직 점심 기록이 없습니다.', emptyEn: 'No lunch logged yet.' },
  { key: 'dinner', emptyKo: '아직 저녁 기록이 없습니다.', emptyEn: 'No dinner logged yet.' },
  { key: 'snack', emptyKo: '아직 간식 기록이 없습니다.', emptyEn: 'No snacks logged yet.' },
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

function loadCravings() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(CRAVING_STORAGE_KEY)
    const parsedValue = rawValue ? JSON.parse(rawValue) : []
    return Array.isArray(parsedValue) ? parsedValue.filter(Boolean).slice(0, 6) : []
  } catch {
    return []
  }
}

function createCheatMenuRecommendation(foods, cravings, appLanguage) {
  const weightedPool = []

  foods.slice(0, 40).forEach((food) => {
    const displayName = getFoodDisplayName(food, appLanguage)
    const popularityWeight = Math.max(1, Math.round((food.popularityScore || 0) / 20))
    for (let index = 0; index < popularityWeight; index += 1) {
      weightedPool.push({
        kind: 'food',
        id: food.id,
        label: displayName,
        calories: food.nutritionPerServing?.kcal || 0,
      })
    }
  })

  cravings.forEach((craving) => {
    for (let index = 0; index < 4; index += 1) {
      weightedPool.push({
        kind: 'craving',
        id: craving,
        label: craving,
        calories: null,
      })
    }
  })

  if (!weightedPool.length) {
    return null
  }

  const selected = weightedPool[Math.floor(Math.random() * weightedPool.length)]
  return selected
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
    userProfile,
  } = useOutletContext()

  const [quickAccessTab, setQuickAccessTab] = useState('ff')
  const [ffRefreshIndex, setFfRefreshIndex] = useState(0)
  const [cravings, setCravings] = useState(loadCravings)
  const [cravingInput, setCravingInput] = useState('')
  const [cheatRecommendation, setCheatRecommendation] = useState(null)
  const [isScratching, setIsScratching] = useState(false)

  const todayIso = formatLocalDate()
  const todayMeals = useMemo(
    () => meals.filter((meal) => (meal.loggedDate || todayIso) === todayIso),
    [meals, todayIso],
  )
  const foodMap = useMemo(
    () => new Map([...customFoods, ...foods].map((food) => [food.id, food])),
    [customFoods, foods],
  )

  const totals = todayMeals.reduce(
    (acc, meal) => {
      acc.calories += Number(meal.calories || 0)
      acc.carbs += Number(meal.carbs || 0)
      acc.protein += Number(meal.protein || 0)
      acc.fat += Number(meal.fat || 0)
      return acc
    },
    { calories: 0, carbs: 0, protein: 0, fat: 0 },
  )
  const macroTargets = useMemo(
    () => buildMacroTargets(recommendedCalories, userProfile?.macroRatioPreset),
    [recommendedCalories, userProfile?.macroRatioPreset],
  )
  const progressPercent = Math.min(
    100,
    recommendedCalories > 0 ? Math.round((totals.calories / recommendedCalories) * 100) : 0,
  )

  const macroCards = [
    {
      key: 'carbs',
      label: tx(appLanguage, '탄수화물', 'Carbs'),
      current: totals.carbs,
      target: macroTargets.carbs,
      accentClass: 'carbs',
    },
    {
      key: 'protein',
      label: tx(appLanguage, '단백질', 'Protein'),
      current: totals.protein,
      target: macroTargets.protein,
      accentClass: 'protein',
    },
    {
      key: 'fat',
      label: tx(appLanguage, '지방', 'Fat'),
      current: totals.fat,
      target: macroTargets.fat,
      accentClass: 'fat',
    },
  ]

  const groupedMeals = mealSections.map((section) => {
    const items = todayMeals.filter((meal) => meal.mealType === section.key)
    return {
      ...section,
      items,
      calories: items.reduce((sum, meal) => sum + Number(meal.calories || 0), 0),
    }
  })

  const ffRecommendations = useMemo(
    () => foods.slice().sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0)).slice(0, 6),
    [foods],
  )
  const recentEntries = useMemo(
    () => Array.from(new Map(meals.map((meal) => [meal.name, meal])).values()).slice(0, 4),
    [meals],
  )
  const visibleFfRecommendations = useMemo(
    () => pickItems(ffRecommendations, ffRefreshIndex, 4),
    [ffRecommendations, ffRefreshIndex],
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CRAVING_STORAGE_KEY, JSON.stringify(cravings))
    }
  }, [cravings])

  useEffect(() => {
    setCheatRecommendation(createCheatMenuRecommendation(ffRecommendations, cravings, foodNameLanguage))
  }, [cravings, ffRecommendations, foodNameLanguage])

  function handleAddCraving() {
    const trimmedValue = cravingInput.trim()

    if (!trimmedValue) {
      return
    }

    setCravings((current) => [trimmedValue, ...current.filter((item) => item !== trimmedValue)].slice(0, 6))
    setCravingInput('')
  }

  function handleScratchReveal() {
    if (isScratching) {
      return
    }

    setIsScratching(true)

    window.setTimeout(() => {
      setCheatRecommendation(createCheatMenuRecommendation(ffRecommendations, cravings, foodNameLanguage))
      setIsScratching(false)
    }, 1200)
  }

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={tx(appLanguage, '식단', 'Nutrition')}
        title={tx(appLanguage, '오늘의 식단', "Today's nutrition")}
        description={tx(appLanguage, '오늘 먹을 흐름과 목표를 빠르게 확인하고, 바로 기록으로 이어지는 식단 홈입니다.', 'This is the nutrition home for quickly checking today targets and jumping straight into logging meals.')}
      />

      <article className="content-card nutrition-overview-card">
        <div className="nutrition-home-head">
          <div>
            <span className="card-kicker">{tx(appLanguage, '오늘 기준', 'Today baseline')}</span>
            <h2>{totals.calories} / {recommendedCalories} kcal</h2>
            <p>{tx(appLanguage, `목표까지 ${Math.max(0, recommendedCalories - totals.calories)} kcal 남았어요.`, `${Math.max(0, recommendedCalories - totals.calories)} kcal left to your target.`)}</p>
          </div>
          <div className="nutrition-home-side">
            <span className="mini-panel">{tx(appLanguage, `소모 ${Math.round(totalBurn)} kcal`, `Burn ${Math.round(totalBurn)} kcal`)}</span>
            <span className="mini-panel">{tx(appLanguage, `${todayMeals.length}개 기록`, `${todayMeals.length} logs`)}</span>
          </div>
        </div>

        <div className="nutrition-progress-track" aria-label="Calorie progress">
          <span style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="nutrition-macro-card-grid">
          {macroCards.map((item) => {
            const percent = item.target > 0 ? Math.min(100, Math.round((item.current / item.target) * 100)) : 0
            return (
              <div className={`nutrition-macro-card ${item.accentClass}`} key={item.key}>
                <div className="nutrition-macro-card-top">
                  <span>{item.label}</span>
                  <strong>{item.current}g</strong>
                </div>
                <div className="nutrition-macro-bar">
                  <span style={{ width: `${percent}%` }} />
                </div>
                <p>{tx(appLanguage, `목표 ${item.target}g`, `Target ${item.target}g`)}</p>
              </div>
            )
          })}
        </div>
      </article>

      <section className="nutrition-meal-section">
        <div className="feed-head">
          <div>
            <span className="card-kicker">{tx(appLanguage, '식사', 'Meals')}</span>
            <h2>{tx(appLanguage, '식사별 기록', 'Meals')}</h2>
          </div>
          <Link className="inline-action" to={{ pathname: '/nutrition/add-food', search: '?mealType=lunch' }}>
            {tx(appLanguage, '음식 검색', 'Search food')}
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
                <Link className="inline-action" to={{ pathname: '/nutrition/add-food', search: `?mealType=${section.key}` }}>
                  {tx(appLanguage, '+ 음식 추가', '+ Add food')}
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
                    {tx(appLanguage, section.emptyKo, section.emptyEn)}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="nutrition-side-by-side">
        <article className="content-card nutrition-home-quick-widget">
          <div className="feed-head">
            <div>
              <span className="card-kicker">{tx(appLanguage, '빠른 추천', 'Quick picks')}</span>
              <h2>{tx(appLanguage, '빠른 메뉴 추천', 'Quick menu picks')}</h2>
            </div>
            <div className="quick-inline-tools">
              <span className="mini-panel">{aiCoach.nutritionTitle}</span>
              {quickAccessTab === 'ff' ? (
                <button
                  className="inline-action"
                  type="button"
                  onClick={() => setFfRefreshIndex((current) => (current + 4) % Math.max(ffRecommendations.length, 1))}
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
              {tx(appLanguage, 'FF 추천', 'FF picks')}
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
                    <span>{tx(appLanguage, '추천', 'Pick')}</span>
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

        <article className="content-card nutrition-cheat-widget compact">
          <div className="feed-head">
            <div>
              <span className="card-kicker nutrition-cheat-kicker">{tx(appLanguage, '치팅데이', 'Cheat day')}</span>
              <h2>{tx(appLanguage, '참았다 먹자', 'Save it for the right day')}</h2>
            </div>
          </div>

          <div className="nutrition-cheat-inline">
            <input
              value={cravingInput}
              onChange={(event) => setCravingInput(event.target.value)}
              placeholder={tx(appLanguage, '먹고 싶은 메뉴 입력', 'Add a craving')}
            />
            <button className="inline-action" type="button" onClick={handleAddCraving}>
              {tx(appLanguage, '추가', 'Add')}
            </button>
          </div>

          {cravings.length > 0 ? (
            <div className="nutrition-craving-chips">
              {cravings.slice(0, 4).map((item) => (
                <span className="pill-tag" key={item}>{item}</span>
              ))}
            </div>
          ) : null}

          <button
            className={isScratching ? 'nutrition-cheat-pick-button compact scratching' : 'nutrition-cheat-pick-button compact'}
            type="button"
            onClick={handleScratchReveal}
          >
            <div className={isScratching ? 'nutrition-cheat-result visible' : 'nutrition-cheat-result hidden'}>
              <span>{tx(appLanguage, '치팅데이', 'Cheat day')}</span>
              <strong>
                {isScratching
                  ? tx(appLanguage, '긁는 중...', 'Scratching...')
                  : cheatRecommendation?.label || tx(appLanguage, '긁어서 메뉴 보기', 'Scratch to reveal')}
              </strong>
              <em>
                {isScratching
                  ? tx(appLanguage, '조금만 더 참으면 오늘의 메뉴가 열려요.', 'Wait just a moment and your menu will appear.')
                  : tx(appLanguage, '버튼을 누르면 복권 긁듯 메뉴가 공개돼요.', 'Tap to reveal today menu like scratching a lottery ticket.')}
              </em>
            </div>
            <div className="nutrition-cheat-scratch-layer" aria-hidden="true">
              <div className="nutrition-cheat-scratch-shine" />
            </div>
          </button>
        </article>
      </div>
    </section>
  )
}

export default NutritionLauncherPage
