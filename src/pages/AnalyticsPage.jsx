import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import buildAnalyticsViewModel from '../components/analytics/buildAnalyticsViewModel.js'

function AnalyticsPage() {
  const context = useOutletContext()
  const {
    calorieTrend,
    calculateNetCalories,
    fatigueLabel,
    fatigueScore,
    macroBars,
    netCalories,
    recommendedCalories,
    recommendedCaloriesRange,
    routineAdherence,
    totalVolume,
    weeklyWorkoutCount,
  } = buildAnalyticsViewModel(context)

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Analytics"
        title="Weekly Overview"
        description="이번 주 운동량과 칼로리 흐름을 빠르게 읽는 요약 화면입니다."
      />

      <div className="card-grid four-up analytics-summary-grid">
        <article className="content-card">
          <span className="card-kicker">🏋️ Weekly volume</span>
          <strong>{totalVolume.toLocaleString()} kg</strong>
          <p>이번 주 누적 볼륨</p>
        </article>
        <article className="content-card">
          <span className="card-kicker">📆 Workout count</span>
          <strong>{weeklyWorkoutCount} sessions</strong>
          <p>최근 7일 기준 운동 횟수</p>
        </article>
        <article className="content-card">
          <span className="card-kicker">♻️ Recovery</span>
          <strong>{fatigueLabel} {fatigueScore}</strong>
          <p>현재 누적 피로도 상태</p>
        </article>
        <article className="content-card">
          <span className="card-kicker">✅ Adherence</span>
          <strong>{routineAdherence}%</strong>
          <p>루틴 이행률</p>
        </article>
      </div>

      <div className="card-grid split analytics-detail-grid">
        <article className="content-card">
          <span className="card-kicker">🍱 Stacked bar · 탄단지 비율</span>
          <div className="stacked-macro">
            {macroBars.map((item) => (
              <div className="stacked-segment" key={item.label}>
                <div className={`macro-bar ${item.className}`}>
                  <span style={{ width: `${item.value}%` }} />
                </div>
                <div className="feed-head">
                  <strong>{item.label}</strong>
                  <span>{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <span className="card-kicker">🔥 Intake vs burn</span>
          <div className="calorie-compare-list">
            {calorieTrend.map((item) => (
              <div className="compare-row" key={item.day}>
                <strong>{item.day}</strong>
                <span>섭취 {item.intake} kcal</span>
                <span>소모 {item.burn} kcal</span>
                <span>Net {calculateNetCalories(item.intake, item.burn)} kcal</span>
              </div>
            ))}
          </div>
          <div className="mini-panel">
            권장 섭취량 {recommendedCalories} kcal · 범위 {recommendedCaloriesRange.min}-{recommendedCaloriesRange.max} kcal · 현재 net {netCalories} kcal
          </div>
        </article>
      </div>

      <div className="sticky-cta-bar">
        <span>더 자세한 성장 흐름과 회복 분석은 세부 리포트에서 확인합니다.</span>
        <div className="program-chip-list">
          <Link className="inline-action" to="/profile/me">
            Performance Trends
          </Link>
          <Link className="inline-action" to="/profile/me">
            Recovery & AI
          </Link>
        </div>
      </div>
    </section>
  )
}

export default AnalyticsPage
