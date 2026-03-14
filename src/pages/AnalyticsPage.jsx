import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { calculateDailyBurn, calculateNetCalories } from '../utils/fitnessMetrics.ts'

const bodyWeightTrend = [
  { day: 'Mon', weight: 78.4 },
  { day: 'Tue', weight: 78.2 },
  { day: 'Wed', weight: 78.1 },
  { day: 'Thu', weight: 78.0 },
  { day: 'Fri', weight: 77.9 },
  { day: 'Sat', weight: 77.8 },
  { day: 'Sun', weight: 77.7 },
]

const heatmapPattern = [
  [1, 0, 2, 1, 3, 2, 0],
  [0, 2, 2, 1, 0, 3, 1],
  [2, 1, 0, 3, 2, 1, 0],
  [3, 2, 1, 0, 2, 2, 1],
]

function categoryDisplay(category) {
  const labels = {
    chest: 'Chest',
    shoulders: 'Shoulders',
    back: 'Back',
    legs: 'Legs',
    abs: 'Abs',
    arms: 'Arms',
  }
  return labels[category] || category
}

function AnalyticsPage() {
  const {
    weeklyData,
    sessions,
    meals,
    totalVolume,
    netCalories,
    fatigueLabel,
    recommendedCalories,
    weeklyStepAverage,
    fatigueScore,
    fatigueByMuscle,
    recommendedCaloriesRange,
    lastWorkoutSummary,
    totalWorkoutCalories,
    aiCoach,
  } = useOutletContext()

  const weeklyWorkoutCount = weeklyData.filter((item) => item.workout > 0).length

  const calorieTrend = weeklyData.map((item) => ({
    day: item.day,
    intake: item.intake,
    burn: calculateDailyBurn({
      bmrCalories: 1680,
      stepCalories: Math.round(item.steps * 0.04),
      exerciseCalories: Math.round(item.workout * 7.2),
    }),
  }))

  const fatigueRows = Object.entries(fatigueByMuscle || {})
    .map(([category, volume]) => ({
      category,
      label: categoryDisplay(category),
      volume,
      fatigue: Math.min(100, Math.round(Number(volume) || 0)),
    }))
    .sort((a, b) => b.volume - a.volume)

  const routineAdherence = Math.min(
    100,
    Math.round((weeklyWorkoutCount / Math.max(1, weeklyData.filter((item) => item.workout > 0).length)) * 100),
  )

  const currentMacros = meals.reduce(
    (acc, meal) => {
      acc.carbs += meal.carbs || 0
      acc.protein += meal.protein || 0
      acc.fat += meal.fat || 0
      return acc
    },
    { carbs: 0, protein: 0, fat: 0 },
  )
  const macroTotal = Math.max(1, currentMacros.carbs * 4 + currentMacros.protein * 4 + currentMacros.fat * 9)
  const macroBars = [
    { label: 'Carbs', value: Math.round(((currentMacros.carbs * 4) / macroTotal) * 100), className: '' },
    { label: 'Protein', value: Math.round(((currentMacros.protein * 4) / macroTotal) * 100), className: 'protein' },
    { label: 'Fat', value: Math.round(((currentMacros.fat * 9) / macroTotal) * 100), className: 'fat' },
  ]

  const topPRs = [...sessions]
    .flatMap((session) =>
      session.exercises.map((exercise) => ({
        session: session.title,
        name: exercise.name,
        estimated1RM: exercise.estimated1RM,
        maxWeight: exercise.maxWeight,
      })),
    )
    .sort((a, b) => b.estimated1RM - a.estimated1RM)
    .slice(0, 5)

  const weightMin = Math.min(...bodyWeightTrend.map((item) => item.weight))
  const weightMax = Math.max(...bodyWeightTrend.map((item) => item.weight))

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Analytics"
        title="기록이 쌓이고 성장하고 있다는 감각을 주는 시각화 탭"
        description="주간 볼륨, 체중 변화, 칼로리 흐름, 피로도, PR, 루틴 이행률을 한 화면에서 읽고 AI 인사이트까지 연결합니다."
      />

      <div className="card-grid four-up analytics-summary-grid">
        <article className="content-card">
          <span className="card-kicker">🏋️ Weekly volume</span>
          <strong>{totalVolume.toLocaleString()} kg</strong>
          <p>이번 주 누적 볼륨</p>
        </article>
        <article className="content-card">
          <span className="card-kicker">📆 Workout count</span>
          <strong>{weeklyWorkoutCount} sessions</strong>
          <p>최근 7일 기준 운동 횟수</p>
        </article>
        <article className="content-card">
          <span className="card-kicker">♻️ Recovery</span>
          <strong>{fatigueLabel} {fatigueScore}</strong>
          <p>현재 누적 피로도 상태</p>
        </article>
        <article className="content-card">
          <span className="card-kicker">✅ Adherence</span>
          <strong>{routineAdherence}%</strong>
          <p>루틴 이행률</p>
        </article>
      </div>

      <div className="card-grid split analytics-detail-grid">
        <article className="content-card">
          <span className="card-kicker">📉 Line chart · 체중 변화</span>
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
          <span className="card-kicker">📦 Bar chart · 주간 볼륨</span>
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

      <div className="card-grid split analytics-detail-grid">
        <article className="content-card">
          <span className="card-kicker">🍱 Stacked bar · 탄단지 비율</span>
          <div className="stacked-macro">
            {macroBars.map((item) => (
              <div className="stacked-segment" key={item.label}>
                <div className={`macro-bar ${item.className}`}>
                  <span style={{ width: `${item.value}%` }} />
                </div>
                <div className="feed-head">
                  <strong>{item.label}</strong>
                  <span>{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <span className="card-kicker">🔥 Intake vs burn</span>
          <div className="calorie-compare-list">
            {calorieTrend.map((item) => (
              <div className="compare-row" key={item.day}>
                <strong>{item.day}</strong>
                <span>섭취 {item.intake} kcal</span>
                <span>소모 {item.burn} kcal</span>
                <span>Net {calculateNetCalories(item.intake, item.burn)} kcal</span>
              </div>
            ))}
          </div>
          <div className="mini-panel">권장 섭취량 {recommendedCalories} kcal · 범위 {recommendedCaloriesRange.min}-{recommendedCaloriesRange.max} kcal · 현재 net {netCalories} kcal</div>
        </article>
      </div>

      <div className="card-grid split analytics-detail-grid">
        <article className="content-card">
          <span className="card-kicker">🎯 Radar chart · 부위별 주간 자극량</span>
          <div className="radar-list">
            {fatigueRows.map((item) => (
              <div className="radar-row" key={item.category}>
                <strong>{item.label}</strong>
                <div className="radar-bar">
                  <span style={{ width: `${Math.max(8, item.fatigue)}%` }} />
                </div>
                <span>{item.fatigue}%</span>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <span className="card-kicker">🗓️ Calendar heatmap · 운동 빈도</span>
          <div className="heatmap-grid">
            {heatmapPattern.flatMap((week, weekIndex) =>
              week.map((value, dayIndex) => (
                <span
                  key={`${weekIndex}-${dayIndex}`}
                  className={`heat-cell level-${value}`}
                  title={`week ${weekIndex + 1} day ${dayIndex + 1}`}
                />
              )),
            )}
          </div>
          <div className="mini-panel">주간 평균 걸음수 {weeklyStepAverage.toLocaleString()}보 · 운동 소모 {totalWorkoutCalories} kcal</div>
        </article>
      </div>

      <div className="card-grid split">
        <article className="content-card">
          <span className="card-kicker">🏅 PR trend</span>
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

        <article className="content-card">
          <span className="card-kicker">🤖 AI insights</span>
          <div className="bullet-stack">
            <div className="mini-panel">이번 주는 등 볼륨이 지난주보다 18% 증가했습니다.</div>
            <div className="mini-panel">하체 피로도가 높아 내일은 상체 또는 휴식을 추천합니다.</div>
            <div className="mini-panel">현재 순칼로리가 감량 목표 범위보다 높습니다.</div>
            <div className="mini-panel">{aiCoach.trainingTitle} · {aiCoach.training}</div>
          </div>
          {lastWorkoutSummary ? (
            <div className="mini-panel">
              최근 세션 {lastWorkoutSummary.title} · 탑셋 {lastWorkoutSummary.topSet} · PR {lastWorkoutSummary.prCount}
            </div>
          ) : null}
          <Link className="inline-action" to="/analytics/nutrition">
            Nutrition hub 열기
          </Link>
        </article>
      </div>
    </section>
  )
}

export default AnalyticsPage
