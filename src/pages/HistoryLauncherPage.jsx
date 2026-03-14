import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import TrainActionCard from '../components/train/TrainActionCard.jsx'

function HistoryLauncherPage() {
  const { sessions, lastWorkoutSummary } = useOutletContext()

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Train / Insights"
        title="Insights"
        description="Train 안에서 운동 기록과 성과 요약을 보고, 필요하면 상세 기록과 프로필 분석으로 내려갑니다."
      />

      <div className="launcher-stat-row">
        <article className="launcher-stat-card">
          <span className="card-kicker">Recent sessions</span>
          <strong>{sessions.length}</strong>
          <p>최근 저장된 운동 세션 수입니다.</p>
        </article>
        <article className="launcher-stat-card">
          <span className="card-kicker">Last workout</span>
          <strong>{lastWorkoutSummary?.title || 'No recent workout'}</strong>
          <p>{lastWorkoutSummary ? `${lastWorkoutSummary.sessionVolume.toLocaleString()} kg · PR ${lastWorkoutSummary.prCount}` : '세션을 완료하면 여기서 바로 회고할 수 있습니다.'}</p>
        </article>
      </div>

      <div className="train-action-grid">
        <TrainActionCard
          to="/train/history"
          title="Workout History"
          subtitle="월간 캘린더와 날짜별 세션 기록을 봅니다."
          icon="calendar"
          cta="Open"
        />
        <TrainActionCard
          to="/profile/me"
          title="Recovery & Progress"
          subtitle="프로필 안의 분석과 근육 피로도 맵을 확인합니다."
          icon="analytics"
          cta="Review"
        />
      </div>

      <div className="quick-pills">
        <Link className="pill-tag" to="/train/history">
          Today
        </Link>
        <Link className="pill-tag" to="/profile/me">
          Profile insights
        </Link>
      </div>
    </section>
  )
}

export default HistoryLauncherPage
