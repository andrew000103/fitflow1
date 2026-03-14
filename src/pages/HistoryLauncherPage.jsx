import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import TrainActionCard from '../components/train/TrainActionCard.jsx'

function HistoryLauncherPage() {
  const { sessions, lastWorkoutSummary } = useOutletContext()

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="History"
        title="History"
        description="운동 기록과 날짜별 회고는 상세 히스토리 화면에서 확인합니다."
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
          to="/history/calendar"
          title="Calendar"
          subtitle="월간 캘린더와 날짜별 세션 기록을 봅니다."
          icon="📅"
          cta="Open"
        />
        <TrainActionCard
          to="/history/calendar"
          title="Workout Logs"
          subtitle="세트 변화, PR, 식단 기록을 같이 회고합니다."
          icon="🧾"
          cta="Review"
        />
      </div>

      <div className="quick-pills">
        <Link className="pill-tag" to="/history/calendar">
          Today
        </Link>
        <Link className="pill-tag" to="/analytics/overview">
          Weekly overview
        </Link>
      </div>
    </section>
  )
}

export default HistoryLauncherPage
