import { useState } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { mealTypeLabel, tx } from '../utils/appLanguage.js'

function getTodayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function CustomFoodPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mealType = searchParams.get('mealType') || 'lunch'
  const presetName = searchParams.get('name') || ''
  const { appLanguage, createCustomFood, addFoodToMeal } = useOutletContext()
  const [form, setForm] = useState({
    name: presetName,
    baseAmountLabel: '1 serving',
    baseAmountGrams: '',
    kcal: '',
    carbs: '',
    protein: '',
    fat: '',
    fiber: '',
    sugar: '',
    sodium: '',
  })

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim() || Number(form.kcal) <= 0) {
      return
    }

    const customFood = createCustomFood({
      name: form.name.trim(),
      baseAmountLabel: form.baseAmountLabel || '1 serving',
      baseAmountGrams: Number(form.baseAmountGrams) || null,
      nutrition: {
        kcal: Number(form.kcal),
        carbs: Number(form.carbs || 0),
        protein: Number(form.protein || 0),
        fat: Number(form.fat || 0),
        fiber: Number(form.fiber || 0),
        sugar: Number(form.sugar || 0),
        sodium: Number(form.sodium || 0),
      },
    })

    addFoodToMeal({
      food: customFood,
      mealType,
      nutrition: customFood.nutritionPerServing,
      quantity: 1,
      selectedUnitLabel: customFood.defaultServingLabel,
      grams: customFood.defaultServingGrams,
      loggedDate: getTodayIso(),
    })

    navigate('/nutrition/diary')
  }

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={tx(appLanguage, '식단 / 사용자 음식', 'Nutrition / Custom Food')}
        title={tx(appLanguage, '직접 음식 입력', 'Direct Food Entry')}
        description={tx(appLanguage, `${mealTypeLabel(appLanguage, mealType)}에 바로 추가할 사용자 정의 음식을 만듭니다.`, `Create a custom food to add to ${mealTypeLabel(appLanguage, mealType)}.`)}
      />

      <article className="content-card">
        <form className="stack-form" onSubmit={handleSubmit}>
          <label className="field-label">
            {tx(appLanguage, '음식 이름', 'Food name')}
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>

          <div className="compact-grid">
            <label className="field-label">
              {tx(appLanguage, '기준량', 'Base amount')}
              <input
                value={form.baseAmountLabel}
                onChange={(event) => setForm((current) => ({ ...current, baseAmountLabel: event.target.value }))}
                placeholder="예: 100g, 1 serving, 1개"
              />
            </label>
            <label className="field-label">
              {tx(appLanguage, '기준 g', 'Base grams')}
              <input
                value={form.baseAmountGrams}
                inputMode="decimal"
                onChange={(event) => setForm((current) => ({ ...current, baseAmountGrams: event.target.value }))}
                placeholder="선택"
              />
            </label>
          </div>

          <div className="compact-grid">
            <label className="field-label">
              kcal
              <input
                value={form.kcal}
                inputMode="decimal"
                onChange={(event) => setForm((current) => ({ ...current, kcal: event.target.value }))}
              />
            </label>
            <label className="field-label">
              {tx(appLanguage, '탄수화물', 'Carbs')}
              <input
                value={form.carbs}
                inputMode="decimal"
                onChange={(event) => setForm((current) => ({ ...current, carbs: event.target.value }))}
              />
            </label>
            <label className="field-label">
              {tx(appLanguage, '단백질', 'Protein')}
              <input
                value={form.protein}
                inputMode="decimal"
                onChange={(event) => setForm((current) => ({ ...current, protein: event.target.value }))}
              />
            </label>
            <label className="field-label">
              {tx(appLanguage, '지방', 'Fat')}
              <input
                value={form.fat}
                inputMode="decimal"
                onChange={(event) => setForm((current) => ({ ...current, fat: event.target.value }))}
              />
            </label>
          </div>

          <details className="drawer-card">
            <summary>
              <span>{tx(appLanguage, '선택 영양소', 'Optional nutrients')}</span>
              <span>{tx(appLanguage, '열기', 'Open')}</span>
            </summary>
            <div className="drawer-card-body">
              <div className="compact-grid">
                <label className="field-label">
                  {tx(appLanguage, '식이섬유', 'Fiber')}
                  <input
                    value={form.fiber}
                    inputMode="decimal"
                    onChange={(event) => setForm((current) => ({ ...current, fiber: event.target.value }))}
                  />
                </label>
                <label className="field-label">
                  {tx(appLanguage, '당류', 'Sugar')}
                  <input
                    value={form.sugar}
                    inputMode="decimal"
                    onChange={(event) => setForm((current) => ({ ...current, sugar: event.target.value }))}
                  />
                </label>
                <label className="field-label">
                  {tx(appLanguage, '나트륨', 'Sodium')}
                  <input
                    value={form.sodium}
                    inputMode="decimal"
                    onChange={(event) => setForm((current) => ({ ...current, sodium: event.target.value }))}
                  />
                </label>
              </div>
            </div>
          </details>

          <button className="inline-action primary-dark" type="submit">
            {tx(appLanguage, '저장 후 추가', 'Save and Add')}
          </button>
        </form>
      </article>
    </section>
  )
}

export default CustomFoodPage
