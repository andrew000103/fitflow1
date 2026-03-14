import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import TrainActionCard from '../components/train/TrainActionCard.jsx'

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function NutritionLauncherPage() {
  const { consumedCalories, meals, quickAddSuggestedMeal, foodSuggestions, recommendedCalories } = useOutletContext()
  const todayMeals = meals.filter((meal) => meal.loggedDate === formatLocalDate())
  const favoriteFood = foodSuggestions.find((item) => item.favorite) || foodSuggestions[0]

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Nutrition"
        title="Nutrition"
        description="오늘 식단을 빠르게 기록하고, 상세 다이어리는 필요한 화면에서 확인합니다."
      />

      <div className="launcher-stat-row">
        <article className="launcher-stat-card">
          <span className="card-kicker">Today</span>
          <strong>{consumedCalories} kcal</strong>
          <p>권장 {recommendedCalories} kcal 대비 현재 섭취량입니다.</p>
        </article>
        <article className="launcher-stat-card">
          <span className="card-kicker">Meals logged</span>
          <strong>{todayMeals.length}</strong>
          <p>오늘 기록한 식사 개수입니다.</p>
        </article>
      </div>

      <div className="train-action-grid">
        <TrainActionCard
          to="/nutrition/diary"
          title="Open Diary"
          subtitle="오늘 식단 기록과 섭취 요약을 확인합니다."
          icon="diary"
          cta="Open"
        />
        <TrainActionCard
          to="/nutrition/diary"
          title="Search Food"
          subtitle="최근 먹은 음식과 검색 결과로 빠르게 기록합니다."
          icon="search"
          cta="Search"
        />
      </div>

      <div className="quick-pills">
        <button className="pill-tag accent" type="button" onClick={() => quickAddSuggestedMeal(favoriteFood.name)}>
          + {favoriteFood.name}
        </button>
        <Link className="pill-tag" to="/nutrition/diary">
          Recent foods
        </Link>
        <Link className="pill-tag" to="/profile/me">
          Nutrition summary
        </Link>
      </div>
    </section>
  )
}

export default NutritionLauncherPage
