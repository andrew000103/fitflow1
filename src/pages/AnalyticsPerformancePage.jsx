import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import AppIcon from '../components/AppIcon.jsx'
import buildAnalyticsViewModel from '../components/analytics/buildAnalyticsViewModel.js'

function AnalyticsPerformancePage() {
  const context = useOutletContext()
  const { bodyWeightTrend, topPRs, weightMax, weightMin, weeklyData } = buildAnalyticsViewModel(context)

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Analytics"
        title="Performance Trends"
        description="체중 변화와 주간 볼륨, PR 흐름을 한 묶음으로 확인하는 상세 화면입니다."
      />

      <div className="card-grid split analytics-detail-grid">
        <article className="content-card">
          <span className="card-kicker"><AppIcon name="trend" size="sm" /> Line chart · 체중 변화</span>
          <div className="line-chart">
            {bodyWeightTrend.map((item) => {
              const ratio = ((item.weight - weightMin) / Math.max(0.1, weightMax - weightMin)) * 100
              return (
                <div className="line-point" key={item.day}>
                  <div className="line-track">
                    <span style={{ bottom: `${ratio}%` }} />
                  </div>
                  <strong>{item.day}</strong>
                  <small>{item.weight}kg</small>
                </div>
              )
            })}
          </div>
        </article>

        <article className="content-card">
          <span className="card-kicker"><AppIcon name="chart" size="sm" /> Bar chart · 주간 볼륨</span>
          <div className="bar-strip">
            {weeklyData.map((item) => (
              <div className="bar-item" key={item.day}>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${Math.min(100, item.workout)}%` }} />
                </div>
                <strong>{item.day}</strong>
                <span>{item.workout}m</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="content-card">
        <span className="card-kicker"><AppIcon name="stats" size="sm" /> PR trend</span>
        <div className="simple-list">
          {topPRs.map((item) => (
            <div className="simple-row" key={`${item.session}-${item.name}`}>
              <strong>{item.name}</strong>
              <span>Est. 1RM {item.estimated1RM} kg</span>
              <span>Max {item.maxWeight} kg</span>
            </div>
          ))}
        </div>
      </article>

      <div className="sticky-cta-bar">
        <span>다음으로 회복 상태와 AI 추천을 확인합니다.</span>
        <Link className="inline-action" to="/profile/me">
          Recovery & AI
        </Link>
      </div>
    </section>
  )
}

export default AnalyticsPerformancePage
