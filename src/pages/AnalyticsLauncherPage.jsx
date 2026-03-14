import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import AppIcon from '../components/AppIcon.jsx'
import TrainActionCard from '../components/train/TrainActionCard.jsx'

function AnalyticsLauncherPage() {
  const { totalVolume, fatigueLabel, weeklyStepAverage } = useOutletContext()

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Train / Insights"
        title="Insights"
        description="성장 흐름과 회복 상태는 Train 안에서 필요한 화면으로 이어집니다."
      />

      <div className="train-entry-header">
        <span className="pill-tag accent"><AppIcon name="trend" size="sm" /> {totalVolume.toLocaleString()} kg this week</span>
        <span className="mini-panel">Recovery: {fatigueLabel} · Avg steps {weeklyStepAverage.toLocaleString()}</span>
      </div>

      <div className="train-action-grid">
        <TrainActionCard
          to="/train/history"
          title="Workout History"
          subtitle="주간 운동량, 운동 횟수, 칼로리 흐름을 빠르게 확인합니다."
          icon="history"
          cta="Open"
        />
        <TrainActionCard
          to="/profile/me"
          title="Performance Trends"
          subtitle="체중 변화, 볼륨 추이, PR 기록을 자세히 봅니다."
          icon="chart"
          cta="View"
        />
        <TrainActionCard
          to="/profile/me"
          title="Recovery & AI"
          subtitle="피로도 맵과 AI 인사이트를 기준으로 다음 운동을 결정합니다."
          icon="ai"
          cta="Review"
        />
        <TrainActionCard
          to="/profile/nutrition"
          title="Nutrition Summary"
          subtitle="섭취, 순칼로리, 권장 섭취 범위를 연결해서 봅니다."
          icon="nutrition"
          cta="Open"
        />
      </div>

      <div className="quick-pills">
        <Link className="inline-action" to="/train/history">
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
