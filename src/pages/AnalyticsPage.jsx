import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'

function AnalyticsPage() {
  const {
    weeklyData,
    sets,
    totalVolume,
    netCalories,
    fatigueLabel,
    recommendedCalories,
    weeklyWorkoutMinutes,
    weeklyStepAverage,
    fatigueScore,
    lastWorkoutSummary,
    totalWorkoutCalories,
    aiCoach,
  } = useOutletContext()

  const topSets = [...sets].sort((a, b) => b.weight - a.weight).slice(0, 5)
  const categoryVolume = sets.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.volume
    return acc
  }, {})
  const fatigueRows = Object.entries(categoryVolume).sort(([, a], [, b]) => b - a).slice(0, 4)

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Analytics"
        title="주간 성장, 피로도, 칼로리 정산을 읽는 분석 탭"
        description="기록이 단순 저장으로 끝나지 않고 추천과 동기부여로 이어지도록 PR, 볼륨, 피로도, 섭취/소모/net 칼로리를 해석하는 영역입니다."
      />

      <div className="card-grid four-up">
        <article className="content-card">
          <span className="card-kicker">Weekly volume</span>
          <strong>{totalVolume.toLocaleString()} kg</strong>
        </article>
        <article className="content-card">
          <span className="card-kicker">Net calories</span>
          <strong>{netCalories} kcal</strong>
        </article>
        <article className="content-card">
          <span className="card-kicker">Recovery</span>
          <strong>{fatigueLabel} ({fatigueScore})</strong>
        </article>
        <article className="content-card">
          <span className="card-kicker">Weekly minutes</span>
          <strong>{weeklyWorkoutMinutes} min</strong>
        </article>
      </div>

      <div className="card-grid split">
        <article className="content-card">
          <span className="card-kicker">Progress trend</span>
          <div className="bar-strip">
            {weeklyData.map((item) => (
              <div className="bar-item" key={item.day}>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${item.workout}%` }} />
                </div>
                <strong>{item.day}</strong>
                <span>{item.workout}m</span>
              </div>
            ))}
          </div>
        </article>
        <article className="content-card">
          <span className="card-kicker">Nutrition summary</span>
          <h2>권장 섭취량 {recommendedCalories} kcal</h2>
          <p>평균 걸음수는 {weeklyStepAverage.toLocaleString()}보이며, 오늘 운동 소모는 {totalWorkoutCalories} kcal입니다.</p>
          <div className="mini-panel">{aiCoach.training}</div>
          <Link className="inline-action" to="/analytics/nutrition">
            Nutrition hub 열기
          </Link>
        </article>
      </div>

      <div className="card-grid split">
        <article className="content-card">
          <span className="card-kicker">Top sets</span>
          <div className="simple-list">
            {topSets.map((item) => (
              <div className="simple-row" key={item.id}>
                <strong>{item.exercise}</strong>
                <span>{item.weight} kg x {item.reps}</span>
                <span>{item.volume} volume</span>
              </div>
            ))}
          </div>
        </article>
        <article className="content-card">
          <span className="card-kicker">Muscle fatigue map</span>
          <div className="summary-grid tight">
            {fatigueRows.map(([category, volume]) => (
              <div key={category}>
                <span>{category}</span>
                <strong>{Math.min(100, Math.round(volume / 18))}%</strong>
              </div>
            ))}
          </div>
          {lastWorkoutSummary ? (
            <p>최근 세션 {lastWorkoutSummary.title}의 탑셋은 {lastWorkoutSummary.topSet}, PR은 {lastWorkoutSummary.prCount}개였습니다.</p>
          ) : (
            <p>최근 세션을 마치면 이 영역에 부위별 피로와 PR 분석이 추가됩니다.</p>
          )}
        </article>
      </div>
    </section>
  )
}

export default AnalyticsPage
