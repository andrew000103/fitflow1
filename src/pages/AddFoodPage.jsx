import { useMemo, useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import AppIcon from '../components/AppIcon.jsx'
import { buildQuickAccessFoods, searchFoods } from '../utils/foodRecommendations.js'
import { getFoodDisplayName } from '../utils/foodNaming.js'
import { mealTypeLabel, tx } from '../utils/appLanguage.js'

const mealLabels = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
}

function FoodSection({ title, items, mealType, foodNameLanguage, appLanguage }) {
  if (!items.length) {
    return null
  }

  return (
    <div className="food-section-block">
      <div className="feed-head">
        <strong>{title}</strong>
        <span className="mini-caption">{items.length} {tx(appLanguage, '개', 'items')}</span>
      </div>
      <div className="database-list">
        {items.map((food) => (
          <Link
            key={food.id}
            className="database-row add-food-row"
            to={{ pathname: `/nutrition/food/${food.id}`, search: `?mealType=${mealType}` }}
          >
            <span className="database-icon"><AppIcon name="nutrition" size="sm" /></span>
            <div className="database-copy">
              <strong>{getFoodDisplayName(food, foodNameLanguage)}</strong>
              <span>{food.defaultServingLabel}</span>
              <span>
                {food.nutritionPerServing.kcal} kcal · C {food.nutritionPerServing.carbs} / P {food.nutritionPerServing.protein} / F {food.nutritionPerServing.fat}
              </span>
            </div>
            <span className="inline-action">{tx(appLanguage, '선택', 'Select')}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function AddFoodPage() {
  const { appLanguage, foods, customFoods, meals, foodNameLanguage } = useOutletContext()
  const [searchParams] = useSearchParams()
  const mealType = searchParams.get('mealType') || 'lunch'
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')

  const quickAccess = useMemo(
    () => buildQuickAccessFoods({ mealType, meals, foods, customFoods }),
    [customFoods, foods, mealType, meals],
  )

  const results = useMemo(
    () => searchFoods({ foods, customFoods, query: searchQuery }).slice(0, 20),
    [customFoods, foods, searchQuery],
  )

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={tx(appLanguage, '식단 / 음식 추가', 'Nutrition / Add Food')}
        title={tx(appLanguage, '음식 추가', 'Add Food')}
        description={tx(appLanguage, `${mealTypeLabel(appLanguage, mealType)}에 추가할 음식을 검색하고 빠르게 선택합니다.`, `Search and select food for ${mealTypeLabel(appLanguage, mealType)}.`)}
      />

      <article className="content-card">
        <div className="feed-head">
          <label className="field-label" style={{ flex: 1 }}>
            {tx(appLanguage, '음식 검색', 'Search food')}
            <input
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={tx(appLanguage, '음식명, 브랜드, 키워드 검색', 'Search by food name, brand, or keyword')}
            />
          </label>
          <Link
            className="inline-action"
            to={{ pathname: '/nutrition/custom-food', search: `?mealType=${mealType}&name=${encodeURIComponent(searchQuery)}` }}
          >
            {tx(appLanguage, '직접 입력', 'Direct entry')}
          </Link>
        </div>
      </article>

      {!searchQuery.trim() ? (
        <>
          <article className="content-card">
            <FoodSection title={tx(appLanguage, '빠른 접근', 'Quick Access')} items={quickAccess.quick} mealType={mealType} foodNameLanguage={foodNameLanguage} appLanguage={appLanguage} />
            <FoodSection title={tx(appLanguage, '최근', 'Recent')} items={quickAccess.recent} mealType={mealType} foodNameLanguage={foodNameLanguage} appLanguage={appLanguage} />
            <FoodSection title={tx(appLanguage, '자주 먹음', 'Frequent')} items={quickAccess.frequent} mealType={mealType} foodNameLanguage={foodNameLanguage} appLanguage={appLanguage} />
            <FoodSection title={tx(appLanguage, '인기', 'Popular')} items={quickAccess.popular} mealType={mealType} foodNameLanguage={foodNameLanguage} appLanguage={appLanguage} />
          </article>

          <article className="content-card">
            <div className="feed-head">
              <div>
                <span className="card-kicker">{tx(appLanguage, '둘러보기', 'Browse')}</span>
                <h2>{tx(appLanguage, '전체 음식 목록', 'All Foods')}</h2>
              </div>
            </div>
            <div className="database-list">
              {results.map((food) => (
                <Link
                  key={food.id}
                  className="database-row add-food-row"
                  to={{ pathname: `/nutrition/food/${food.id}`, search: `?mealType=${mealType}` }}
                >
                  <span className="database-icon">
                    <AppIcon name="nutrition" size="sm" />
                  </span>
                  <div className="database-copy">
                    <strong>{getFoodDisplayName(food, foodNameLanguage)}</strong>
                    <span>{food.category || tx(appLanguage, '일반', 'General')} · {food.defaultServingLabel}</span>
                    <span>{food.nutritionPerServing.kcal} kcal</span>
                  </div>
                  <span className="inline-action">{tx(appLanguage, '열기', 'Open')}</span>
                </Link>
              ))}
            </div>
          </article>
        </>
      ) : (
        <article className="content-card">
          <div className="feed-head">
            <div>
              <span className="card-kicker">{tx(appLanguage, '검색 결과', 'Search results')}</span>
              <h2>{tx(appLanguage, `${results.length}개 음식 검색됨`, `${results.length} foods found`)}</h2>
            </div>
          </div>
          <div className="database-list">
            {results.length > 0 ? (
              results.map((food) => (
                <Link
                  key={food.id}
                  className="database-row add-food-row"
                  to={{ pathname: `/nutrition/food/${food.id}`, search: `?mealType=${mealType}` }}
                >
                  <span className="database-icon">
                    <AppIcon name="nutrition" size="sm" />
                  </span>
                  <div className="database-copy">
                    <strong>{getFoodDisplayName(food, foodNameLanguage)}</strong>
                    <span>{food.brand || food.category || tx(appLanguage, '일반', 'General')}</span>
                    <span>
                      {food.nutritionPerServing.kcal} kcal · C {food.nutritionPerServing.carbs} / P {food.nutritionPerServing.protein} / F {food.nutritionPerServing.fat}
                    </span>
                  </div>
                  <span className="inline-action">{tx(appLanguage, '선택', 'Select')}</span>
                </Link>
              ))
            ) : (
              <div className="mini-panel">{tx(appLanguage, '검색 결과가 없습니다. 직접 음식을 추가해보세요.', 'No results found. Add a custom food instead.')}</div>
            )}
          </div>
          <Link
            className="inline-action"
            to={{ pathname: '/nutrition/custom-food', search: `?mealType=${mealType}&name=${encodeURIComponent(searchQuery)}` }}
          >
            {tx(appLanguage, '직접 음식 추가', 'Add custom food')}
          </Link>
        </article>
      )}
    </section>
  )
}

export default AddFoodPage
