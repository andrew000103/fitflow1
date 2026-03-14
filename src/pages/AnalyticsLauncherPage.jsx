import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import TrainActionCard from '../components/train/TrainActionCard.jsx'

function AnalyticsLauncherPage() {
  const { totalVolume, fatigueLabel, weeklyStepAverage } = useOutletContext()

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Analytics"
        title="Analytics"
        description="성장 흐름과 회복 상태는 필요한 리포트 화면에서 확인합니다."
      />

      <div className="train-entry-header">
        <span className="pill-tag accent">📈 {totalVolume.toLocaleString()} kg this week</span>
        <span className="mini-panel">Recovery: {fatigueLabel} · Avg steps {weeklyStepAverage.toLocaleString()}</span>
      </div>

      <div className="train-action-grid">
        <TrainActionCard
          to="/analytics/overview"
          title="Weekly Overview"
          subtitle="주간 운동량, 운동 횟수, 칼로리 흐름을 빠르게 확인합니다."
          icon="📊"
          cta="Open"
        />
        <TrainActionCard
          to="/analytics/performance"
          title="Performance Trends"
          subtitle="체중 변화, 볼륨 추이, PR 기록을 자세히 봅니다."
          icon="📉"
          cta="View"
        />
        <TrainActionCard
          to="/analytics/recovery"
          title="Recovery & AI"
          subtitle="피로도 맵과 AI 인사이트를 기준으로 다음 운동을 결정합니다."
          icon="🧠"
          cta="Review"
        />
        <TrainActionCard
          to="/analytics/nutrition"
          title="Nutrition Summary"
          subtitle="섭취, 순칼로리, 권장 섭취 범위를 연결해서 봅니다."
          icon="🍽️"
          cta="Open"
        />
      </div>

      <div className="quick-pills">
        <Link className="inline-action" to="/history/calendar">
          Workout history
        </Link>
        <Link className="inline-action" to="/nutrition/diary">
          Nutrition diary
        </Link>
      </div>
    </section>
  )
}

export default AnalyticsLauncherPage
