import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/PageHeader.jsx'
import TrainActionCard from '../components/TrainActionCard.jsx'
import useWorkout from '../hooks/useWorkout.js'
import { tx } from '../../../utils/appLanguage.js'

const dailyMotivationMessages = [
  ['오늘 한 세트가 흐름을 바꿔요.', 'One set can change the whole day.'],
  ['가볍게 시작하면 끝까지 갑니다.', 'Start light and keep it going.'],
  ['완벽함보다 시작이 먼저예요.', 'Starting matters more than perfect.'],
  ['짧게라도 움직이면 충분해요.', 'Even a short workout counts.'],
  ['오늘 기록이 내일의 기준이 돼요.', 'Today log becomes tomorrow benchmark.'],
  ['몸이 깨어나는 시간이에요.', 'Time to wake your body up.'],
  ['조금만 해도 리듬이 살아나요.', 'A little effort brings your rhythm back.'],
  ['지금 시작하면 이미 절반이에요.', 'If you start now, you are halfway there.'],
  ['운동은 길이보다 꾸준함이에요.', 'Consistency beats duration.'],
  ['오늘도 몸이 답을 기억해요.', 'Your body remembers the work today.'],
  ['한 번 열면 다음은 쉬워져요.', 'Once you begin, the next step gets easier.'],
  ['지금 움직이면 마음도 가벼워져요.', 'Move now and your mind feels lighter too.'],
]

function getDailyMotivation(language) {
  const today = new Date()
  const daySeed = Number(
    `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`,
  )
  const messageIndex = daySeed % dailyMotivationMessages.length

  return dailyMotivationMessages[messageIndex][language === 'en' ? 1 : 0]
}

function TrainPage() {
  const {
    activeProgram,
    currentProgram,
    currentProgramDay,
    lastWorkoutSummary,
    streakDays,
    startWorkout,
    appLanguage,
  } = useWorkout()
  const navigate = useNavigate()

  const hasActiveProgram = Boolean(activeProgram && currentProgram && currentProgramDay)
  const lastSessionMeta = lastWorkoutSummary
    ? `${lastWorkoutSummary.durationMinutes}${tx(appLanguage, '분', ' min')} · ${lastWorkoutSummary.completedSets}${tx(appLanguage, '세트', ' sets')}`
    : tx(appLanguage, '최근 완료한 세션 없음', 'No recent completed session')
  const workoutSummary = currentProgramDay?.exercises?.length
    ? currentProgramDay.exercises
        .slice(0, 3)
        .map((exercise) => `${exercise.exerciseName} · ${exercise.sets}${tx(appLanguage, '세트', ' sets')}`)
        .join('  /  ')
    : tx(appLanguage, '오늘 할 운동이 아직 없습니다.', 'No workout is scheduled for today.')
  const dailyMotivation = getDailyMotivation(appLanguage)

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={tx(appLanguage, '운동', 'Workout')}
        title={tx(appLanguage, '운동', 'Workout')}
        description={tx(
          appLanguage,
          '지금 바로 운동을 시작하거나, 진행 중인 프로그램을 자연스럽게 이어갈 수 있는 첫 화면입니다.',
          'This is the fastest place to start a workout now or continue your current program.',
        )}
      />

      <article className="content-card train-launch-hero">
        <div className="train-launch-copy">
          <span className="card-kicker">{hasActiveProgram ? tx(appLanguage, '오늘의 워크아웃', "Today's workout") : tx(appLanguage, '빠르게 시작', 'Start fast')}</span>
          <h2>{hasActiveProgram ? currentProgram.title : dailyMotivation}</h2>
          <p>
            {hasActiveProgram
              ? tx(
                  appLanguage,
                  `${currentProgramDay.title} 기준으로 바로 이어서 시작할 수 있어요.`,
                  `You can jump right in with ${currentProgramDay.title}.`,
                )
              : tx(
                  appLanguage,
                  '종목을 그때그때 추가하는 자유 운동부터 가볍게 시작해도 충분해요.',
                  'A simple open workout is enough when you just want to get moving.',
                )}
          </p>

          {hasActiveProgram ? (
            <div className="train-launch-meta">
              <span className="pill-tag accent">{currentProgram.category}</span>
              <span className="pill-tag">{tx(appLanguage, `주 ${activeProgram.currentWeek} · Day ${activeProgram.currentDay}`, `Week ${activeProgram.currentWeek} · Day ${activeProgram.currentDay}`)}</span>
              <span className="pill-tag">{streakDays} {tx(appLanguage, '일 연속', 'day streak')}</span>
            </div>
          ) : null}

          <div className="train-launch-footnote">
            {hasActiveProgram ? workoutSummary : tx(appLanguage, '빈 운동으로 시작한 뒤 필요한 종목만 빠르게 추가할 수 있어요.', 'Start empty and add only the exercises you need.')}
          </div>
          <div className="train-launch-footnote subtle">
            {tx(appLanguage, '최근 세션', 'Last session')} · {lastSessionMeta}
          </div>
        </div>

        <div className="train-launch-actions">
          <button
            className="train-launch-primary"
            type="button"
            onClick={() => {
              if (hasActiveProgram) {
                navigate(`/train/program/${currentProgram.id}`)
                return
              }

              startWorkout('empty')
              navigate('/train/workout')
            }}
          >
            <strong>{hasActiveProgram ? tx(appLanguage, '프로그램 이어서 하기', 'Continue program') : tx(appLanguage, '즉시 운동 기록', 'Log workout now')}</strong>
            <span>
              {hasActiveProgram
                ? tx(appLanguage, '오늘 루틴으로 곧바로 들어갑니다.', 'Open today routine instantly.')
                : tx(appLanguage, '가장 빠르게 운동을 시작합니다.', 'The fastest way to start your workout.')}
            </span>
          </button>

          <Link className="train-launch-secondary" to="/train/programs">
            <strong>{tx(appLanguage, '프로그램 둘러보기', 'Browse programs')}</strong>
          </Link>
        </div>
      </article>

      <section className="train-home-secondary">
        <div className="feed-head">
          <div>
            <span className="card-kicker">{tx(appLanguage, '주요 메뉴', 'Key actions')}</span>
            <h2>{tx(appLanguage, '필요한 화면만 간단하게 바로 열 수 있어요.', 'Open only the screens you need, quickly and simply.')}</h2>
          </div>
        </div>

        <div className="train-home-secondary-grid">
          <TrainActionCard
            to="/train/programs"
            title={tx(appLanguage, '프로그램 둘러보기', 'Browse programs')}
            subtitle={tx(appLanguage, '내 페이스에 맞는 프로그램을 찾아 시작합니다.', 'Find a program that matches your pace and start from there.')}
            icon="program"
            cta={tx(appLanguage, '열기', 'Open')}
          />
          <TrainActionCard
            to="/train/history"
            title={tx(appLanguage, '운동 기록', 'Workout history')}
            subtitle={tx(appLanguage, '최근 세션과 운동 흐름을 한눈에 확인합니다.', 'See your recent sessions and workout flow at a glance.')}
            icon="history"
            cta={tx(appLanguage, '보기', 'View')}
          />
          <TrainActionCard
            to="/train/insights"
            title="FF Trainer"
            subtitle={tx(appLanguage, '회복 상태와 오늘 훈련 우선순위를 봅니다.', 'Review recovery status and today training priorities.')}
            icon="analytics"
            cta={tx(appLanguage, '열기', 'Open')}
          />
        </div>
      </section>
    </section>
  )
}

export default TrainPage
