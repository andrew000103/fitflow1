import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { scaleFoodNutrition } from '../utils/foodRecommendations.js'
import { getFoodDisplayName } from '../utils/foodNaming.js'
import { mealTypeLabel, tx } from '../utils/appLanguage.js'

function getTodayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function FoodDetailPage() {
  const { foodId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { appLanguage, foods, customFoods, addFoodToMeal, foodNameLanguage } = useOutletContext()
  const mealType = searchParams.get('mealType') || 'lunch'

  const food = [...customFoods, ...foods].find((item) => item.id === foodId)
  const defaultUnit = food?.servingUnits?.[0] || null
  const [quantity, setQuantity] = useState('1')
  const [gramInput, setGramInput] = useState(food?.defaultServingGrams ? String(food.defaultServingGrams) : '')
  const [selectedUnitId, setSelectedUnitId] = useState(defaultUnit?.id || '')
  const [useGramMode, setUseGramMode] = useState(false)

  const selectedUnit = food?.servingUnits?.find((item) => item.id === selectedUnitId) || defaultUnit
  const quantityNumber = Number(quantity) || 1
  const grams = useGramMode ? Number(gramInput) || 0 : null
  const nutrition = useMemo(
    () => (food ? scaleFoodNutrition(food, { quantity: quantityNumber, grams, servingUnit: selectedUnit }) : null),
    [food, grams, quantityNumber, selectedUnit],
  )

  if (!food || !nutrition) {
    return (
      <section className="page-section">
        <PageHeader
          eyebrow={tx(appLanguage, '식단 / 음식', 'Nutrition / Food')}
          title={tx(appLanguage, '음식을 찾을 수 없습니다', 'Food not found')}
          description={tx(appLanguage, '선택한 음식 정보를 찾을 수 없습니다.', 'The selected food could not be found.')}
        />
      </section>
    )
  }

  function handleAdd() {
    addFoodToMeal({
      food,
      mealType,
      nutrition,
      quantity: quantityNumber,
      selectedUnitLabel: useGramMode ? `${grams}g` : selectedUnit?.label || food.defaultServingLabel,
      grams,
      loggedDate: getTodayIso(),
    })
    navigate('/nutrition/diary')
  }

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={tx(appLanguage, '식단 / 음식 상세', 'Nutrition / Food Detail')}
        title={getFoodDisplayName(food, foodNameLanguage)}
        description={tx(appLanguage, `${mealTypeLabel(appLanguage, mealType)}에 추가하기 전에 양을 조절합니다.`, `Adjust the amount before adding to ${mealTypeLabel(appLanguage, mealType)}.`)}
      />

      <article className="content-card">
        <div className="feed-head">
          <div>
            <span className="card-kicker">{food.category || tx(appLanguage, '음식', 'Food')}</span>
            <h2>{getFoodDisplayName(food, foodNameLanguage)}</h2>
          </div>
          <span className="pill-tag">{food.defaultServingLabel}</span>
        </div>

        <div className="summary-grid tight">
          <div>
            <span>{tx(appLanguage, '칼로리', 'Calories')}</span>
            <strong>{nutrition.kcal} kcal</strong>
          </div>
          <div>
            <span>{tx(appLanguage, '탄수화물', 'Carbs')}</span>
            <strong>{nutrition.carbs} g</strong>
          </div>
          <div>
            <span>{tx(appLanguage, '단백질', 'Protein')}</span>
            <strong>{nutrition.protein} g</strong>
          </div>
          <div>
            <span>{tx(appLanguage, '지방', 'Fat')}</span>
            <strong>{nutrition.fat} g</strong>
          </div>
        </div>

        <div className="program-chip-list">
          <button
            className={useGramMode ? 'inline-action' : 'inline-action active-soft'}
            type="button"
            onClick={() => setUseGramMode(false)}
          >
            {tx(appLanguage, '1회분', 'Serving')}
          </button>
          <button
            className={useGramMode ? 'inline-action active-soft' : 'inline-action'}
            type="button"
            onClick={() => setUseGramMode(true)}
          >
            {tx(appLanguage, '그램 / ml', 'Grams / ml')}
          </button>
        </div>

        {useGramMode ? (
          <label className="field-label">
            {tx(appLanguage, '양', 'Amount')}
            <input
              value={gramInput}
              inputMode="decimal"
              onChange={(event) => setGramInput(event.target.value)}
              placeholder="예: 150"
            />
          </label>
        ) : (
          <div className="compact-grid">
            <label className="field-label">
              {tx(appLanguage, '단위', 'Unit')}
              <select value={selectedUnitId} onChange={(event) => setSelectedUnitId(event.target.value)}>
                {(food.servingUnits?.length ? food.servingUnits : [{ id: 'default', label: food.defaultServingLabel, multiplier: 1 }]).map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              {tx(appLanguage, '수량', 'Quantity')}
              <input
                value={quantity}
                inputMode="decimal"
                onChange={(event) => setQuantity(event.target.value)}
              />
            </label>
          </div>
        )}

        <button className="inline-action primary-dark" type="button" onClick={handleAdd}>
          {tx(appLanguage, `${mealTypeLabel(appLanguage, mealType)}에 추가`, `Add to ${mealTypeLabel(appLanguage, mealType)}`)}
        </button>
      </article>
    </section>
  )
}

export default FoodDetailPage
