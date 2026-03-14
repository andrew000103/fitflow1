import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/PageHeader.jsx'
import TrainActionCard from '../components/TrainActionCard.jsx'
import useWorkout from '../hooks/useWorkout.js'
import { tx } from '../../../utils/appLanguage.js'

function TrainPage() {
  const { activeWorkout, activeProgram, currentProgram, currentProgramDay, lastWorkoutSummary, streakDays, startWorkout, appLanguage } =
    useWorkout()
  const navigate = useNavigate()

  const hasActiveProgram = Boolean(activeProgram && currentProgram && currentProgramDay)
  const lastSessionMeta = lastWorkoutSummary
    ? `${lastWorkoutSummary.durationMinutes} ${tx(appLanguage, '분', 'min')} · ${lastWorkoutSummary.completedSets} ${tx(appLanguage, '세트', 'sets')}`
    : tx(appLanguage, '최근 완료한 세션 없음', 'No recent completed session')

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={tx(appLanguage, '운동', 'Train')}
        title={tx(appLanguage, '운동', 'Train')}
        description={tx(appLanguage, '프로그램을 이어가거나, 빈 운동을 바로 시작하고, 기록과 FF Trainer로 이어지는 생산성 중심 화면입니다.', 'Resume your program, start an empty workout, and move into history or FF Trainer.')}
      />

      {hasActiveProgram ? (
        <article className="content-card train-home-hero">
          <div className="train-home-hero-copy">
            <span className="card-kicker">{tx(appLanguage, '진행 중 프로그램', 'Active Program')}</span>
            <h2>{tx(appLanguage, '프로그램 이어서 하기', 'Continue Program')}</h2>
            <p>
              {currentProgram.title} · {tx(appLanguage, '주차', 'Week')} {activeProgram.currentWeek} · {tx(appLanguage, '요일', 'Day')} {activeProgram.currentDay}
            </p>
            <strong>{currentProgramDay.title}</strong>
            <div className="train-home-meta">
              <span className="pill-tag accent">{currentProgram.category}</span>
              <span className="pill-tag">{currentProgram.durationWeeks} {tx(appLanguage, '주', 'weeks')}</span>
              <span className="pill-tag">{streakDays} {tx(appLanguage, '일 연속', 'day streak')}</span>
              <span className="pill-tag">{tx(appLanguage, '최근 세션', 'Last session')} {lastSessionMeta}</span>
            </div>
          </div>

          <div className="train-home-hero-actions">
            <button
              className="inline-action primary-dark train-home-primary"
              type="button"
              onClick={() => navigate(`/train/program/${currentProgram.id}`)}
            >
              {tx(appLanguage, '프로그램 이어서 하기', 'Continue Program')}
            </button>
            <button
              className="train-home-secondary-cta"
              type="button"
              onClick={() => {
                startWorkout('empty')
                navigate('/train/workout')
              }}
            >
              <strong>{tx(appLanguage, '빈 운동 시작', 'Start Empty Workout')}</strong>
              <span>{tx(appLanguage, '프로그램과 무관하게 지금 바로 기록을 시작합니다.', 'Start logging right now without a program.')}</span>
            </button>
            <Link className="inline-action" to="/train/programs">
              {tx(appLanguage, '프로그램 둘러보기', 'Browse Programs')}
            </Link>
          </div>
        </article>
      ) : (
        <article className="content-card train-home-hero">
          <div className="train-home-hero-copy">
            <span className="card-kicker">{tx(appLanguage, '진행 중 프로그램 없음', 'No Active Program')}</span>
            <h2>{tx(appLanguage, '빈 운동 시작', 'Start Empty Workout')}</h2>
            <p>{tx(appLanguage, '진행 중인 프로그램이 없으면 빈 운동으로 바로 기록하거나, Program을 탐색해서 시작할 수 있습니다.', 'If you do not have an active program, start an empty workout or browse a program.')}</p>
            <div className="train-home-meta">
              <span className="pill-tag accent">{tx(appLanguage, '프로그램 선택 사항', 'Program optional')}</span>
              <span className="pill-tag">{tx(appLanguage, '공개 프로그램 둘러보기', 'Browse public programs')}</span>
            </div>
          </div>

          <div className="train-home-hero-actions">
            <button
              className="inline-action primary-dark train-home-primary"
              type="button"
              onClick={() => {
                startWorkout('empty')
                navigate('/train/workout')
              }}
            >
              {tx(appLanguage, '빈 운동 시작', 'Start Empty Workout')}
            </button>
            <Link className="train-home-secondary-cta" to="/train/programs">
              <strong>{tx(appLanguage, '프로그램 둘러보기', 'Browse Programs')}</strong>
              <span>{tx(appLanguage, '공개 프로그램을 탐색하고 진행할 프로그램을 선택합니다.', 'Browse public programs and choose one to follow.')}</span>
            </Link>
          </div>
        </article>
      )}

      <section className="train-home-secondary">
        <div className="feed-head">
          <div>
            <span className="card-kicker">{tx(appLanguage, '주요 액션', 'Primary Actions')}</span>
            <h2>{tx(appLanguage, '빈 운동 시작과 프로그램 탐색은 항상 빠르게 접근할 수 있습니다.', 'Start Empty Workout and Browse Programs stay easy to reach.')}</h2>
          </div>
        </div>

        <div className="train-home-secondary-grid">
          <TrainActionCard
            to="/train/programs"
            title={tx(appLanguage, '프로그램 둘러보기', 'Browse Programs')}
            subtitle={tx(appLanguage, '공개 프로그램을 탐색하고 현재 프로그램으로 설정합니다.', 'Browse public programs and set your current program.')}
            icon="program"
            cta={tx(appLanguage, '열기', 'Browse')}
          />
          <TrainActionCard
            to="/train/history"
            title={tx(appLanguage, '기록', 'History')}
            subtitle={tx(appLanguage, '운동 기록만 컴팩트하게 확인합니다.', 'Review workout history in a compact view.')}
            icon="history"
            cta={tx(appLanguage, '보기', 'Review')}
          />
          <TrainActionCard
            to="/train/insights"
            title="FF Trainer"
            subtitle={tx(appLanguage, '오늘 훈련 우선순위와 회복 상태를 봅니다.', 'See today priorities and recovery status.')}
            icon="analytics"
            cta={tx(appLanguage, '열기', 'Open')}
          />
        </div>
      </section>
    </section>
  )
}

export default TrainPage
