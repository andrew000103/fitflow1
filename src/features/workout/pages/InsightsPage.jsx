import { useMemo } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../../../components/PageHeader.jsx'
import BodyMapCard from '../../../components/bodymap/BodyMapCard.jsx'
import BodyRecoveryMap from '../../../components/bodymap/BodyRecoveryMap.jsx'
import MuscleLegend from '../../../components/bodymap/MuscleLegend.jsx'
import { mapLegacyScoresToBodyRecoveryData } from '../../../components/bodymap/bodyRecoveryModel.js'
import { getMuscleGroupLabel } from '../../../features/recovery/constants.ts'
import { getRecoveryToneLabel } from '../../../features/recovery/colorScale.ts'
import { buildRecoveryRows } from '../../../features/recovery/model.ts'
import { tx } from '../../../utils/appLanguage.js'

function formatSessionDate(dateString) {
  if (!dateString) {
    return 'No workout history yet'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${dateString}T00:00:00`))
}

function InsightsPage() {
  const { appLanguage, sessions, muscleFatigueScores, lastWorkoutSummary, userProfile } = useOutletContext()

  const recentWorkload = useMemo(
    () =>
      sessions.slice(0, 4).map((session) => ({
        id: session.id,
        title: session.title,
        dateLabel: formatSessionDate(session.date),
        volume: session.totalVolume,
        sets: session.exercises.reduce((sum, exercise) => sum + exercise.setCount, 0),
      })),
    [sessions],
  )

  const bodyRecoveryData = useMemo(
    () => mapLegacyScoresToBodyRecoveryData(muscleFatigueScores),
    [muscleFatigueScores],
  )

  const groupedRows = useMemo(
    () =>
      buildRecoveryRows(bodyRecoveryData).map((item) => ({
        ...item,
        label: getMuscleGroupLabel(item.muscle, appLanguage === 'ko' ? 'ko' : 'en'),
        level: getRecoveryToneLabel(item.score, appLanguage === 'ko' ? 'ko' : 'en'),
      })),
    [appLanguage, bodyRecoveryData],
  )

  const latestSession = sessions[0] || null
  const highestMuscle = groupedRows[0] || null
  const lowestMuscle = [...groupedRows].reverse()[0] || null
  const shouldRestRows = groupedRows.filter((item) => item.score >= 55).slice(0, 3)
  const trainableRows = [...groupedRows].reverse().filter((item) => item.score <= 35).slice(0, 3)
  const bodySex = userProfile?.sex === 'female' ? 'female' : 'male'

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={tx(appLanguage, '운동 / FF Trainer', 'Train / FF Trainer')}
        title="FF Trainer"
        description={tx(appLanguage, '오늘 훈련 우선순위와 회복 상태를 먼저 보여주고, 세부 데이터는 필요할 때만 펼쳐봅니다.', 'Show today priorities and recovery first, then reveal details on demand.')}
      />

      <div className="card-grid three-up">
        <article className="content-card">
          <span className="card-kicker">{tx(appLanguage, '오늘 우선순위', 'Today priority')}</span>
          <strong>{highestMuscle ? highestMuscle.label : tx(appLanguage, '데이터 없음', 'No data')}</strong>
          <p>
            {highestMuscle
              ? tx(appLanguage, `피로도 ${highestMuscle.score} · ${highestMuscle.level}`, `${highestMuscle.score} fatigue · ${highestMuscle.level}`)
              : tx(appLanguage, '세션을 완료하면 자동 계산됩니다.', 'Complete sessions to generate data.')}
          </p>
        </article>
        <article className="content-card">
          <span className="card-kicker">{tx(appLanguage, '우선 휴식', 'Rest first')}</span>
          <strong>{shouldRestRows.map((item) => item.label).join(', ') || tx(appLanguage, '없음', 'None')}</strong>
          <p>{tx(appLanguage, '오늘 쉬는 편이 좋은 부위를 먼저 확인합니다.', 'See which muscles are better rested today.')}</p>
        </article>
        <article className="content-card">
          <span className="card-kicker">{tx(appLanguage, '지금 훈련 가능', 'Trainable now')}</span>
          <strong>{lowestMuscle ? lowestMuscle.label : tx(appLanguage, '데이터 없음', 'No data')}</strong>
          <p>{trainableRows.map((item) => item.label).join(', ') || tx(appLanguage, '회복 데이터 없음', 'No recovery data')}</p>
        </article>
      </div>

      <article className="content-card">
        <div className="feed-head">
          <div>
            <span className="card-kicker">{tx(appLanguage, '바디 피로도 맵', 'Body fatigue map')}</span>
            <h2>{tx(appLanguage, '앞면 / 뒷면 회복 보기', 'Front / Back recovery view')}</h2>
          </div>
          <Link className="inline-action" to="/train/workout">
            {tx(appLanguage, '운동 열기', 'Open workout')}
          </Link>
        </div>

        <div className="bodymap-layout">
          <BodyMapCard title="Front" subtitle="앞면">
            <BodyRecoveryMap view="front" sex={bodySex} data={bodyRecoveryData} />
          </BodyMapCard>
          <BodyMapCard title="Back" subtitle="뒷면">
            <BodyRecoveryMap view="back" sex={bodySex} data={bodyRecoveryData} />
          </BodyMapCard>
        </div>

        <MuscleLegend appLanguage={appLanguage} />
      </article>

      <details className="content-card">
        <summary>{tx(appLanguage, '부위별 피로 점수 보기', 'View muscle fatigue scores')}</summary>
        <div className="muscle-detail-list">
          {groupedRows.map((item) => (
            <div className="muscle-detail-row" key={item.muscle}>
              <strong>{item.label}</strong>
              <span>{item.score}</span>
              <span>{item.level}</span>
            </div>
          ))}
        </div>
      </details>

      <details className="content-card">
        <summary>{tx(appLanguage, '최근 반영 세션 보기', 'View recent sessions')}</summary>
        <div className="simple-list">
          {recentWorkload.length > 0 ? (
            recentWorkload.map((session) => (
              <div className="simple-row compact" key={session.id}>
                <strong>{session.title}</strong>
                <span>{session.dateLabel}</span>
                <span>{session.sets} {tx(appLanguage, '세트', 'sets')} · {session.volume.toLocaleString()} kg</span>
              </div>
            ))
          ) : (
            <div className="mini-panel">{tx(appLanguage, '아직 완료된 세션이 없어 FF Trainer 데이터가 비어 있습니다.', 'FF Trainer is empty because there are no completed sessions yet.')}</div>
          )}
        </div>
      </details>

      <article className="content-card">
        <span className="card-kicker">{tx(appLanguage, '최근 운동', 'Latest workout')}</span>
        <strong>{lastWorkoutSummary?.title || latestSession?.title || tx(appLanguage, '아직 운동 없음', 'No workout yet')}</strong>
        <p>{formatSessionDate(lastWorkoutSummary?.date || latestSession?.date)}</p>
      </article>
    </section>
  )
}

export default InsightsPage
