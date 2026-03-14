import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import TrainActionCard from '../components/train/TrainActionCard.jsx'
import { useOutletContext } from 'react-router-dom'

function TrainPage() {
  const { activeWorkout, currentProgram, lastWorkoutSummary, streakDays, startWorkout } = useOutletContext()
  const navigate = useNavigate()

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Train"
        title="Train"
        description="오늘 운동을 가장 빠르게 시작하는 가벼운 엔트리 화면입니다."
      />

      <div className="launcher-stat-row">
        <article className="launcher-stat-card">
          <span className="card-kicker">Streak</span>
          <strong>{streakDays} days</strong>
          <p>기록을 끊지 않고 이어가는 중입니다.</p>
        </article>
        <article className="launcher-stat-card">
          <span className="card-kicker">Current program</span>
          <strong>{currentProgram.name}</strong>
          <p>Week {currentProgram.week} · Day {currentProgram.day}</p>
        </article>
        <article className="launcher-stat-card">
          <span className="card-kicker">Last session</span>
          <strong>{lastWorkoutSummary?.title || 'No recent workout'}</strong>
          <p>{lastWorkoutSummary ? `${lastWorkoutSummary.durationMinutes} min · ${lastWorkoutSummary.completedSets} sets` : '운동을 시작하면 최근 세션이 여기에 보입니다.'}</p>
        </article>
      </div>

      <div className="train-action-grid">
        {activeWorkout ? (
          <TrainActionCard
            to="/train/workout"
            title="Resume Workout"
            subtitle={`${activeWorkout.title}을 이어서 기록합니다.`}
            icon="⏱️"
            cta="Resume"
          />
        ) : null}
        <TrainActionCard
          to={`/train/program/${currentProgram.id}`}
          title="Continue Program"
          subtitle={`Week ${currentProgram.week} · Day ${currentProgram.day} 이어서 진행`}
          icon="🏋️"
          cta="Continue"
        />
        <TrainActionCard
          title="Start Empty Workout"
          subtitle="빈 운동을 바로 시작하거나 간단히 세팅합니다."
          icon="➕"
          cta="Start"
          onClick={() => {
            startWorkout('empty')
            navigate('/train/workout')
          }}
        />
        <TrainActionCard
          to="/train/templates"
          title="Templates"
          subtitle="자주 쓰는 루틴 템플릿 목록을 확인합니다."
          icon="🧩"
          cta="Browse"
        />
        <TrainActionCard
          to="/train/create-program"
          title="Create Program"
          subtitle="프로그램을 새로 만들고 저장합니다."
          icon="✍️"
          cta="Create"
        />
      </div>
    </section>
  )
}

export default TrainPage
