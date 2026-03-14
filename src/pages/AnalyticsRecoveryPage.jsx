import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import buildAnalyticsViewModel from '../components/analytics/buildAnalyticsViewModel.js'

function AnalyticsRecoveryPage() {
  const context = useOutletContext()
  const {
    aiCoach,
    fatigueRows,
    heatmapPattern,
    lastWorkoutSummary,
    totalWorkoutCalories,
    weeklyStepAverage,
  } = buildAnalyticsViewModel(context)

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Analytics"
        title="Recovery & AI"
        description="부위별 피로도와 최근 활동량을 바탕으로 다음 운동 선택을 돕는 상세 화면입니다."
      />

      <div className="card-grid split analytics-detail-grid">
        <article className="content-card">
          <span className="card-kicker">🎯 Muscle fatigue</span>
          <div className="radar-list">
            {fatigueRows.map((item) => (
              <div className="radar-row" key={item.category}>
                <strong>{item.label}</strong>
                <div className="radar-bar">
                  <span style={{ width: `${Math.max(8, item.fatigue)}%` }} />
                </div>
                <span>{item.fatigue}%</span>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <span className="card-kicker">🗓️ Frequency heatmap</span>
          <div className="heatmap-grid">
            {heatmapPattern.flatMap((week, weekIndex) =>
              week.map((value, dayIndex) => (
                <span
                  key={`${weekIndex}-${dayIndex}`}
                  className={`heat-cell level-${value}`}
                  title={`week ${weekIndex + 1} day ${dayIndex + 1}`}
                />
              )),
            )}
          </div>
          <div className="mini-panel">
            주간 평균 걸음수 {weeklyStepAverage.toLocaleString()}보 · 운동 소모 {totalWorkoutCalories} kcal
          </div>
        </article>
      </div>

      <article className="content-card">
        <span className="card-kicker">🤖 AI insights</span>
        <div className="bullet-stack">
          <div className="mini-panel">{aiCoach.trainingTitle} · {aiCoach.training}</div>
          <div className="mini-panel">{aiCoach.nutritionTitle} · {aiCoach.nutrition}</div>
          <div className="mini-panel">{aiCoach.communityTitle} · {aiCoach.community}</div>
        </div>
        {lastWorkoutSummary ? (
          <div className="mini-panel">
            최근 세션 {lastWorkoutSummary.title} · 탑셋 {lastWorkoutSummary.topSet} · PR {lastWorkoutSummary.prCount}
          </div>
        ) : null}
      </article>

      <div className="sticky-cta-bar">
        <span>섭취 기록과 순칼로리를 함께 확인하면 해석이 더 정확해집니다.</span>
        <Link className="inline-action" to="/analytics/nutrition">
          Nutrition Summary
        </Link>
      </div>
    </section>
  )
}

export default AnalyticsRecoveryPage
