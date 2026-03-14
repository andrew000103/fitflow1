import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateLabel(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`)
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

function getPreviousDelta(setItem) {
  if (!setItem.previous || setItem.previous === '-') {
    return '첫 기록'
  }

  const match = setItem.previous.match(/([\d.]+)kg x (\d+)/)
  if (!match) {
    return `이전 ${setItem.previous}`
  }

  const previousWeight = Number(match[1])
  const previousReps = Number(match[2])
  const weightDelta = setItem.weight - previousWeight
  const repDelta = setItem.reps - previousReps
  const volumeDelta = setItem.weight * setItem.reps - previousWeight * previousReps
  const weightText = weightDelta === 0 ? '중량 동일' : `중량 ${weightDelta > 0 ? '+' : ''}${weightDelta}kg`
  const repText = repDelta === 0 ? '반복 동일' : `반복 ${repDelta > 0 ? '+' : ''}${repDelta}`
  const volumeText = `볼륨 ${volumeDelta > 0 ? '+' : ''}${volumeDelta}`
  return `${weightText} · ${repText} · ${volumeText}`
}

function HistoryPage() {
  const { sessions, meals } = useOutletContext()
  const today = new Date()
  const todayIso = toIsoDate(today)
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(sessions[0]?.date || todayIso)
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || null)

  const currentMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
  }).format(currentMonth)
  const sessionDays = new Set(sessions.map((session) => session.date))
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7

  const calendarDays = [
    ...Array.from({ length: firstDayOffset }, (_, index) => ({
      id: `blank-${index}`,
      empty: true,
    })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = toIsoDate(new Date(year, month, index + 1))
      return {
        id: date,
        empty: false,
        date,
        day: index + 1,
        isToday: date === todayIso,
        hasWorkout: sessionDays.has(date),
      }
    }),
  ]

  const monthSessions = useMemo(
    () =>
      sessions.filter((session) => {
        const sessionDate = new Date(`${session.date}T00:00:00`)
        return sessionDate.getFullYear() === year && sessionDate.getMonth() === month
      }),
    [month, sessions, year],
  )

  const selectedSessions = useMemo(
    () => sessions.filter((session) => session.date === selectedDate),
    [selectedDate, sessions],
  )

  const selectedSession =
    selectedSessions.find((session) => session.id === selectedSessionId) || selectedSessions[0] || null

  const monthlyVolume = monthSessions.reduce((sum, session) => sum + session.totalVolume, 0)
  const monthlyPRs = monthSessions.reduce((sum, session) => sum + session.prCount, 0)
  const monthlyCalories = monthSessions.reduce((sum, session) => sum + session.calories, 0)
  const dateMeals = meals.filter((meal) => (meal.loggedDate || todayIso) === selectedDate)

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="History"
        title="캘린더와 세션 디테일로 운동 기록을 다시 보고 싶게 만드는 화면"
        description="월간 캘린더에서 운동한 날을 확인하고, 날짜별 세션 카드와 세트 타임라인으로 변화량까지 따라갈 수 있습니다."
      />

      <div className="card-grid three-up">
        <article className="content-card">
          <span className="card-kicker">📅 This month</span>
          <strong>{monthSessions.length} sessions</strong>
          <p>운동한 날을 달력에서 바로 확인하고 날짜별 회고 흐름으로 이어집니다.</p>
        </article>
        <article className="content-card">
          <span className="card-kicker">🏋️ Total volume</span>
          <strong>{monthlyVolume.toLocaleString()} kg</strong>
          <p>이번 달 누적 볼륨과 세션당 흐름을 한 화면에서 확인합니다.</p>
        </article>
        <article className="content-card">
          <span className="card-kicker">🔥 PR & burn</span>
          <strong>{monthlyPRs} PRs</strong>
          <p>예상 소모 칼로리 {monthlyCalories.toLocaleString()} kcal</p>
        </article>
      </div>

      <div className="card-grid split">
        <article className="content-card">
          <div className="calendar-head">
            <button className="inline-action" type="button" onClick={() => setMonthOffset((current) => current - 1)}>
              ← Prev
            </button>
            <h2>{monthLabel}</h2>
            <button className="inline-action" type="button" onClick={() => setMonthOffset((current) => current + 1)}>
              Next →
            </button>
          </div>
          <div className="calendar-weekdays">
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {calendarDays.map((item) => (
              item.empty ? (
                <div key={item.id} className="calendar-day blank" aria-hidden="true" />
              ) : (
                <button
                  key={item.id}
                  type="button"
                  className={
                    item.date === selectedDate
                      ? 'calendar-day selected'
                      : item.hasWorkout
                        ? 'calendar-day active'
                        : item.isToday
                          ? 'calendar-day today'
                          : 'calendar-day'
                  }
                  onClick={() => {
                    setSelectedDate(item.date)
                    setSelectedSessionId(sessions.find((session) => session.date === item.date)?.id || null)
                  }}
                >
                  <span>{item.day}</span>
                  {item.hasWorkout && <small>●</small>}
                </button>
              )
            ))}
          </div>
        </article>

        <article className="content-card">
          <span className="card-kicker">🧾 Workout history</span>
          <h2>{formatDateLabel(selectedDate)}</h2>
          <div className="history-session-list">
            {selectedSessions.length > 0 ? (
              selectedSessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  className={session.id === selectedSession?.id ? 'session-card selected' : 'session-card'}
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <div className="feed-head">
                    <strong>{session.title}</strong>
                    <span className="pill-tag">{session.prCount} PR</span>
                  </div>
                  <span>{session.date} · {session.durationMinutes} min</span>
                  <span>총 볼륨 {session.totalVolume.toLocaleString()} kg · 칼로리 {session.calories} kcal</span>
                  <div className="history-preview-list">
                    {session.exercises.slice(0, 3).map((exercise) => (
                      <span key={exercise.name}>
                        🏅 {exercise.name} · {exercise.setCount} sets · {exercise.bestSet}
                      </span>
                    ))}
                  </div>
                </button>
              ))
            ) : (
              <div className="mini-panel">선택한 날짜에는 운동 세션이 없습니다.</div>
            )}
          </div>
        </article>
      </div>

      {selectedSession && (
        <div className="card-grid split">
          <article className="content-card">
            <span className="card-kicker">📌 Session summary</span>
            <h2>{selectedSession.title}</h2>
            <div className="summary-grid tight">
              <div>
                <span>Date</span>
                <strong>{selectedSession.date}</strong>
              </div>
              <div>
                <span>Workout time</span>
                <strong>{selectedSession.durationMinutes} min</strong>
              </div>
              <div>
                <span>Total volume</span>
                <strong>{selectedSession.totalVolume.toLocaleString()} kg</strong>
              </div>
              <div>
                <span>PR count</span>
                <strong>{selectedSession.prCount}</strong>
              </div>
              <div>
                <span>Condition</span>
                <strong>{selectedSession.condition}</strong>
              </div>
              <div>
                <span>RPE</span>
                <strong>{selectedSession.rpe}</strong>
              </div>
            </div>
            <div className="mini-panel">📝 {selectedSession.note}</div>
            <div className="mini-panel">🔥 해당 세션 소모 칼로리 {selectedSession.calories} kcal</div>
          </article>

          <article className="content-card">
            <span className="card-kicker">🍽️ Day diary</span>
            <h2>{dateMeals.length} meals logged</h2>
            <div className="simple-list">
              {dateMeals.length > 0 ? (
                dateMeals.map((meal) => (
                  <div className="simple-row" key={meal.id}>
                    <strong>{meal.name}</strong>
                    <span>{meal.calories} kcal · P {meal.protein}g</span>
                    <span>{meal.createdAt}</span>
                  </div>
                ))
              ) : (
                <div className="mini-panel">선택한 날짜의 식단 기록이 아직 없습니다.</div>
              )}
            </div>
            <Link className="inline-action" to="/analytics/nutrition">
              Nutrition diary 열기
            </Link>
          </article>
        </div>
      )}

      {selectedSession && (
        <article className="content-card">
          <span className="card-kicker">⏱️ Full workout timeline</span>
          <div className="session-exercise-stack">
            {selectedSession.exercises.map((exercise) => (
              <div className="session-exercise-card" key={exercise.name}>
                <div className="feed-head">
                  <div>
                    <strong>{exercise.name}</strong>
                    <span>
                      {exercise.setCount} sets · Best set {exercise.bestSet}
                    </span>
                  </div>
                  <span className="pill-tag accent">{exercise.category}</span>
                </div>
                <div className="summary-grid tight">
                  <div>
                    <span>Max Weight</span>
                    <strong>{exercise.maxWeight} kg</strong>
                  </div>
                  <div>
                    <span>Max Volume</span>
                    <strong>{exercise.maxVolume} kg</strong>
                  </div>
                  <div>
                    <span>Estimated 1RM</span>
                    <strong>{exercise.estimated1RM} kg</strong>
                  </div>
                </div>
                <div className="timeline-list">
                  {exercise.timeline.map((setItem, index) => (
                    <div className="timeline-row" key={`${exercise.name}-${index}`}>
                      <div>
                        <strong>Set {index + 1}</strong>
                        <span>{setItem.weight}kg x {setItem.reps}</span>
                      </div>
                      <span>이전 기록 {setItem.previous}</span>
                      <span>{getPreviousDelta(setItem)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      )}
    </section>
  )
}

export default HistoryPage
