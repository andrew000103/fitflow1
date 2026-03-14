import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { calculateNetCalories, calculateRecommendedCalories } from '../utils/fitnessMetrics.ts'

const mealSections = [
  { key: 'breakfast', label: '아침 식사', icon: '🌤️' },
  { key: 'lunch', label: '점심 식사', icon: '🍱' },
  { key: 'dinner', label: '저녁 식사', icon: '🍽️' },
  { key: 'snack', label: '간식 / 기타', icon: '🥤' },
]

const searchTabs = [
  { key: 'foods', label: '음식' },
  { key: 'recipes', label: '요리법' },
  { key: 'recent', label: '최근에 먹은 음식' },
]

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

function NutritionHubPage({ entry }) {
  const {
    addMeal,
    meals,
    totalBurn,
    recommendedCalories,
    foodSuggestions,
    aiCoach,
    goal,
  } = useOutletContext()

  const todayIso = getTodayIso()
  const normalizedMeals = useMemo(() => meals.map((meal, index) => normalizeMeal(meal, index)), [meals])
  const todayMeals = normalizedMeals.filter((meal) => meal.loggedDate === todayIso)
  const favoriteFoods = foodSuggestions.filter((food) => food.favorite)
  const recentFoods = Array.from(new Map(normalizedMeals.map((meal) => [meal.name, meal])).values()).slice(0, 6)

  const [activeMealType, setActiveMealType] = useState('lunch')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchTab, setSearchTab] = useState('foods')
  const [recentSearches, setRecentSearches] = useState(['poke', 'greek yogurt', 'protein shake'])
  const [selectedFood, setSelectedFood] = useState(foodSuggestions[0])
  const [servingMultiplier, setServingMultiplier] = useState('1')
  const [waterCups, setWaterCups] = useState(5)
  const [searchPanelOpen, setSearchPanelOpen] = useState(false)
  const [manualEntryOpen, setManualEntryOpen] = useState(false)
  const [manualForm, setManualForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  })

  const mealGroups = mealSections.map((section) => ({
    ...section,
    items: todayMeals.filter((meal) => meal.mealType === section.key),
  }))

  const todayConsumedCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0)
  const todayProtein = todayMeals.reduce((sum, meal) => sum + meal.protein, 0)

  const macroTotals = todayMeals.reduce(
    (acc, meal) => {
      acc.carbs += meal.carbs
      acc.protein += meal.protein
      acc.fat += meal.fat
      return acc
    },
    { carbs: 0, protein: 0, fat: 0 },
  )

  const macroCalories = {
    carbs: macroTotals.carbs * 4,
    protein: macroTotals.protein * 4,
    fat: macroTotals.fat * 9,
  }
  const totalMacroCalories = Math.max(1, macroCalories.carbs + macroCalories.protein + macroCalories.fat)
  const macroPercents = {
    carbs: Math.round((macroCalories.carbs / totalMacroCalories) * 100),
    protein: Math.round((macroCalories.protein / totalMacroCalories) * 100),
    fat: Math.round((macroCalories.fat / totalMacroCalories) * 100),
  }

  const intakeStreak = Math.max(4, Math.min(15, new Set(normalizedMeals.map((meal) => meal.loggedDate)).size))
  const calorieDiff = todayConsumedCalories - recommendedCalories
  const recommendedRange = calculateRecommendedCalories(
    totalBurn,
    goal === 'diet' ? 'cut' : goal,
  )
  const todayNetCalories = calculateNetCalories(todayConsumedCalories, totalBurn)

  const searchableFoods = useMemo(() => {
    if (searchTab === 'recent') {
      return recentFoods
    }
    const source = searchTab === 'recipes' ? foodSuggestions.slice().reverse() : foodSuggestions
    return source.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [foodSuggestions, recentFoods, searchQuery, searchTab])

  function handleFoodSelect(item) {
    setSelectedFood(item)
    if (searchQuery.trim()) {
      setRecentSearches((current) => [searchQuery, ...current.filter((entryItem) => entryItem !== searchQuery)].slice(0, 5))
    }
  }

  function handleAddSelectedFood() {
    if (!selectedFood) {
      return
    }
    const ratio = Number(servingMultiplier)
    addMeal({
      name: selectedFood.name,
      calories: Math.round(selectedFood.calories * ratio),
      protein: Math.round(selectedFood.protein * ratio),
      carbs: Math.round((selectedFood.carbs || 0) * ratio),
      fat: Math.round((selectedFood.fat || 0) * ratio),
      mealType: activeMealType,
      favorite: selectedFood.favorite,
      serving: ratio,
      loggedDate: todayIso,
    })
  }

  function handleManualSubmit(event) {
    event.preventDefault()
    const nextCalories = Number(manualForm.calories)
    const nextProtein = Number(manualForm.protein)
    if (!manualForm.name || nextCalories <= 0) {
      return
    }
    addMeal({
      name: manualForm.name,
      calories: nextCalories,
      protein: nextProtein,
      carbs: Number(manualForm.carbs || 0),
      fat: Number(manualForm.fat || 0),
      mealType: activeMealType,
      loggedDate: todayIso,
    })
    setManualForm({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
    })
  }

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Nutrition / Diary"
        title="식단 기록을 번거롭지 않게 만드는 다이어리 화면"
        description="오늘 날짜, streak, 칼로리와 탄단지 요약, 식사 구간별 기록과 빠른 검색 흐름을 한 화면에 묶었습니다."
      />

      <div className="card-grid three-up">
        <article className="content-card">
          <span className="card-kicker">📆 Today</span>
          <strong>{todayIso}</strong>
          <p>{intakeStreak}일 연속 기록 중입니다.</p>
        </article>
        <article className="content-card">
          <span className="card-kicker">🎯 Daily target</span>
          <strong>{todayConsumedCalories} / {recommendedCalories} kcal</strong>
          <p>{calorieDiff > 0 ? `권장치보다 ${calorieDiff} kcal 초과` : `권장치보다 ${Math.abs(calorieDiff)} kcal 부족`}</p>
          <span>권장 범위 {recommendedRange.min} - {recommendedRange.max} kcal</span>
        </article>
        <article className="content-card">
          <span className="card-kicker">💧 Water</span>
          <strong>{waterCups} cups</strong>
          <div className="program-chip-list">
            <button className="inline-action" type="button" onClick={() => setWaterCups((current) => Math.max(0, current - 1))}>
              -1
            </button>
            <button className="inline-action" type="button" onClick={() => setWaterCups((current) => current + 1)}>
              +1
            </button>
          </div>
        </article>
      </div>

      <div className="card-grid split">
        <article className="content-card">
          <span className="card-kicker">📊 Macro balance</span>
          <div className="macro-stack">
            <div className="macro-row">
              <div>
                <strong>탄수화물</strong>
                <span>{macroTotals.carbs}g · {macroPercents.carbs}%</span>
              </div>
              <div className="macro-bar"><span style={{ width: `${macroPercents.carbs}%` }} /></div>
            </div>
            <div className="macro-row">
              <div>
                <strong>단백질</strong>
                <span>{todayProtein}g · {macroPercents.protein}%</span>
              </div>
              <div className="macro-bar protein"><span style={{ width: `${macroPercents.protein}%` }} /></div>
            </div>
            <div className="macro-row">
              <div>
                <strong>지방</strong>
                <span>{macroTotals.fat}g · {macroPercents.fat}%</span>
              </div>
              <div className="macro-bar fat"><span style={{ width: `${macroPercents.fat}%` }} /></div>
            </div>
          </div>
          <div className="mini-panel">🔥 총 소모 {totalBurn} kcal · Net {todayNetCalories} kcal</div>
          <div className="mini-panel">🤖 {aiCoach.nutritionTitle} · {aiCoach.nutrition}</div>
        </article>

        <article className="content-card">
          <div className="feed-head">
            <div>
              <span className="card-kicker">⚡ Record methods</span>
              <h2>빠른 입력</h2>
            </div>
            <div className="program-chip-list">
              <button className="inline-action" type="button" onClick={() => setSearchPanelOpen((current) => !current)}>
                {searchPanelOpen ? '검색 닫기' : '음식 검색'}
              </button>
              <button className="inline-action" type="button" onClick={() => setManualEntryOpen((current) => !current)}>
                {manualEntryOpen ? '직접입력 닫기' : '직접 입력'}
              </button>
            </div>
          </div>
          <div className="program-chip-list">
            <button className="template-chip" type="button" onClick={() => setSearchTab('recent')}>
              <strong>🕘 최근 먹은 음식</strong>
              <span>반복 입력 최소화</span>
            </button>
            <button className="template-chip" type="button" onClick={() => setSelectedFood(favoriteFoods[0] || foodSuggestions[0])}>
              <strong>⭐ 즐겨찾기</strong>
              <span>자주 먹는 음식 우선</span>
            </button>
          </div>
          <div className="mini-panel">📷 바코드 스캔 / 🤳 사진 인식 AI는 확장 예정입니다.</div>
        </article>
      </div>

      <article className="content-card">
        <div className="feed-head">
          <div>
            <span className="card-kicker">🍱 Meal sections</span>
            <h2>식사 구간별 기록</h2>
          </div>
          <div className="program-chip-list">
            {mealSections.map((section) => (
              <button
                key={section.key}
                type="button"
                className={activeMealType === section.key ? 'inline-action active-soft' : 'inline-action'}
                onClick={() => setActiveMealType(section.key)}
              >
                {section.icon} {section.label}
              </button>
            ))}
          </div>
        </div>
        <div className="meal-section-grid">
          {mealGroups.map((section) => (
            <div className="meal-section-card" key={section.key}>
              <div className="feed-head">
                <strong>{section.icon} {section.label}</strong>
                <span>{section.items.reduce((sum, item) => sum + item.calories, 0)} kcal</span>
              </div>
              <div className="simple-list">
                {section.items.length > 0 ? (
                  section.items.map((meal) => (
                    <div className="simple-row" key={meal.id}>
                      <strong>{meal.name}</strong>
                      <span>{meal.calories} kcal · C {meal.carbs} / P {meal.protein} / F {meal.fat}</span>
                      <span>{meal.createdAt}</span>
                    </div>
                  ))
                ) : (
                  <div className="mini-panel">아직 기록이 없습니다.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </article>

      <div className="card-grid split">
        {searchPanelOpen ? (
        <article className="content-card">
          <span className="card-kicker">🔎 Food search</span>
          <label className="field-label">
            Search
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="예: poke, chicken, shake" />
          </label>
          <div className="program-chip-list">
            {searchTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={searchTab === tab.key ? 'inline-action active-soft' : 'inline-action'}
                onClick={() => setSearchTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="bullet-stack">
            <strong>최근 검색</strong>
            <div className="program-chip-list">
              {recentSearches.map((item) => (
                <button key={item} type="button" className="pill-tag" onClick={() => setSearchQuery(item)}>
                  🔍 {item}
                </button>
              ))}
            </div>
          </div>
          <div className="database-list">
            {searchableFoods.map((item) => (
              <button key={item.name} type="button" className="database-row" onClick={() => handleFoodSelect(item)}>
                <span className="database-icon">🍴</span>
                <div className="database-copy">
                  <strong>{item.name}</strong>
                  <span>{item.calories} kcal · C {item.carbs || 0} / P {item.protein} / F {item.fat || 0}</span>
                </div>
                <span className="pill-tag">{item.mealType || 'meal'}</span>
              </button>
            ))}
          </div>
        </article>
        ) : (
          <article className="content-card">
            <span className="card-kicker">🔎 Food search</span>
            <div className="mini-panel">음식 검색은 필요할 때만 펼쳐서 사용할 수 있게 정리했습니다.</div>
          </article>
        )}

        <article className="content-card">
          <span className="card-kicker">➕ Add selected food</span>
          {selectedFood ? (
            <>
              <div className="mini-panel">
                <strong>{selectedFood.name}</strong>
                <p>{selectedFood.calories} kcal · C {selectedFood.carbs || 0} / P {selectedFood.protein} / F {selectedFood.fat || 0}</p>
              </div>
              <div className="compact-grid">
                <label className="field-label">
                  Meal section
                  <select value={activeMealType} onChange={(event) => setActiveMealType(event.target.value)}>
                    {mealSections.map((section) => (
                      <option key={section.key} value={section.key}>
                        {section.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  Serving
                  <select value={servingMultiplier} onChange={(event) => setServingMultiplier(event.target.value)}>
                    <option value="0.5">0.5 serving</option>
                    <option value="1">1 serving</option>
                    <option value="1.5">1.5 serving</option>
                    <option value="2">2 servings</option>
                  </select>
                </label>
              </div>
              <button className="inline-action primary-dark" type="button" onClick={handleAddSelectedFood}>
                현재 식사에 추가
              </button>
            </>
          ) : (
            <div className="mini-panel">왼쪽에서 음식을 선택하세요.</div>
          )}

          {manualEntryOpen ? (
            <form className="stack-form" onSubmit={handleManualSubmit}>
              <span className="card-kicker">✍️ Direct entry</span>
              <label className="field-label">
                Food name
                <input
                  value={manualForm.name}
                  onChange={(event) => setManualForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <div className="compact-grid">
                <label className="field-label">
                  Calories
                  <input
                    value={manualForm.calories}
                    inputMode="numeric"
                    onChange={(event) => setManualForm((current) => ({ ...current, calories: event.target.value }))}
                  />
                </label>
                <label className="field-label">
                  Protein
                  <input
                    value={manualForm.protein}
                    inputMode="numeric"
                    onChange={(event) => setManualForm((current) => ({ ...current, protein: event.target.value }))}
                  />
                </label>
                <label className="field-label">
                  Carbs
                  <input
                    value={manualForm.carbs}
                    inputMode="numeric"
                    onChange={(event) => setManualForm((current) => ({ ...current, carbs: event.target.value }))}
                  />
                </label>
                <label className="field-label">
                  Fat
                  <input
                    value={manualForm.fat}
                    inputMode="numeric"
                    onChange={(event) => setManualForm((current) => ({ ...current, fat: event.target.value }))}
                  />
                </label>
              </div>
              <button className="inline-action" type="submit">
                직접 추가
              </button>
            </form>
          ) : (
            <div className="mini-panel">직접 입력은 필요할 때만 펼쳐서 사용합니다.</div>
          )}
        </article>
      </div>

      <article className="content-card">
        <span className="card-kicker">✨ Extensions</span>
        <div className="card-grid three-up">
          <div className="mini-panel">🥗 맞춤 식단 추천: 목표와 운동 피로도에 따라 점심/저녁 메뉴 추천</div>
          <div className="mini-panel">🍜 외식 메뉴 자동 추정: 메뉴명만 입력하면 칼로리와 탄단지 추정</div>
          <div className="mini-panel">🧾 OCR / 영수증 분석: 영수증과 사진에서 음식 항목을 읽어 자동 기록</div>
        </div>
        <Link className="inline-action" to={entry === 'analytics' ? '/analytics' : '/profile'}>
          이전 탭으로 돌아가기
        </Link>
      </article>
    </section>
  )
}

export default NutritionHubPage
