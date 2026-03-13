import { Link, useOutletContext } from 'react-router-dom'
import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'

function NutritionHubPage({ entry }) {
  const {
    addMeal,
    quickAddSuggestedMeal,
    meals,
    consumedCalories,
    totalBurn,
    netCalories,
    recommendedCalories,
    totalProtein,
    foodSuggestions,
    aiCoach,
  } = useOutletContext()
  const [name, setName] = useState('Salmon Poke')
  const [calories, setCalories] = useState('540')
  const [protein, setProtein] = useState('34')

  function handleSubmit(event) {
    event.preventDefault()
    const nextCalories = Number(calories)
    const nextProtein = Number(protein)
    if (!name || nextCalories <= 0) {
      return
    }
    addMeal({ name, calories: nextCalories, protein: nextProtein })
  }

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Nutrition"
        title="초기 MVP에서는 보조 플로우로 운영되는 식단 허브"
        description="FatSecret형 식단 기록 경험을 독립 탭 대신 Analytics와 Profile 내부 진입, 그리고 홈 위젯 흐름으로 먼저 검증합니다."
      />

      <div className="card-grid split">
        <article className="content-card">
          <span className="card-kicker">Quick meal log</span>
          <form className="stack-form" onSubmit={handleSubmit}>
            <label className="field-label">
              Meal name
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <div className="compact-grid">
              <label className="field-label">
                Calories
                <input value={calories} onChange={(event) => setCalories(event.target.value)} inputMode="numeric" />
              </label>
              <label className="field-label">
                Protein
                <input value={protein} onChange={(event) => setProtein(event.target.value)} inputMode="numeric" />
              </label>
            </div>
            <button className="inline-action primary-dark" type="submit">
              식단 추가
            </button>
          </form>
        </article>
        <article className="content-card">
          <span className="card-kicker">Daily summary</span>
          <h2>{consumedCalories} kcal consumed</h2>
          <p>단백질 {totalProtein}g, 총 소모 {totalBurn} kcal, net {netCalories} kcal, 권장 섭취량 {recommendedCalories} kcal입니다.</p>
          <div className="mini-panel">{aiCoach.nutrition}</div>
          <Link className="inline-action" to={entry === 'analytics' ? '/analytics' : '/profile'}>
            이전 탭으로 돌아가기
          </Link>
        </article>
      </div>

      <article className="content-card">
        <span className="card-kicker">Quick add suggestions</span>
        <div className="program-chip-list">
          {foodSuggestions.map((item) => (
            <button key={item.name} type="button" className="template-chip removable" onClick={() => quickAddSuggestedMeal(item.name)}>
              <strong>{item.name}</strong>
              <span>{item.calories} kcal · {item.protein}g protein</span>
            </button>
          ))}
        </div>
      </article>

      <article className="content-card">
        <span className="card-kicker">Recent meals</span>
        <div className="simple-list">
          {meals.map((meal) => (
            <div className="simple-row" key={meal.id}>
              <strong>{meal.name}</strong>
              <span>{meal.calories} kcal · {meal.protein}g protein</span>
              <span>{meal.createdAt}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}

export default NutritionHubPage
