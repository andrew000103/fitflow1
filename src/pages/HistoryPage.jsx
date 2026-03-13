import PageHeader from '../components/PageHeader.jsx'
import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

function HistoryPage() {
  const { sessions, meals } = useOutletContext()
  const today = new Date('2026-03-14')
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState('2026-03-13')
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || null)

  const currentMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = `${year}.${String(month + 1).padStart(2, '0')}`
  const sessionDays = new Set(sessions.map((session) => session.date))

  const calendarDays = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1).toISOString().slice(0, 10)
    return {
      date,
      day: index + 1,
      isToday: date === '2026-03-14',
      hasWorkout: sessionDays.has(date),
    }
  })

  const selectedSessions = useMemo(
    () => sessions.filter((session) => session.date === selectedDate),
    [selectedDate, sessions],
  )

  const selectedSession =
    selectedSessions.find((session) => session.id === selectedSessionId) || selectedSessions[0] || null

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="History"
        title="기록을 보는 재미가 생기는 월간 회고 화면"
        description="캘린더에서 운동한 날을 확인하고, 선택한 날짜의 세션 카드와 운동별 상세 로그를 탐색하는 히스토리 탭입니다."
      />

      <div className="card-grid split">
        <article className="content-card">
          <div className="calendar-head">
            <button className="inline-action" type="button" onClick={() => setMonthOffset((current) => current - 1)}>
              이전 달
            </button>
            <h2>{monthLabel}</h2>
            <button className="inline-action" type="button" onClick={() => setMonthOffset((current) => current + 1)}>
              다음 달
            </button>
          </div>
          <div className="calendar-grid">
            {calendarDays.map((item) => (
              <button
                key={item.date}
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
                {item.day}
              </button>
            ))}
          </div>
        </article>

        <article className="content-card">
          <span className="card-kicker">Workout history</span>
          <div className="history-session-list">
            {selectedSessions.length > 0 ? (
              selectedSessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  className={session.id === selectedSession?.id ? 'session-card selected' : 'session-card'}
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <strong>{session.title}</strong>
                  <span>{session.durationMinutes} min</span>
                  <span>{session.totalVolume.toLocaleString()} kg</span>
                  <span>PR {session.prCount}</span>
                  <span>{session.exercises.slice(0, 2).map((exercise) => exercise.name).join(' · ')}</span>
                </button>
              ))
            ) : (
              <p>선택한 날짜에는 운동 세션이 없습니다.</p>
            )}
          </div>
        </article>
      </div>

      {selectedSession && (
        <div className="card-grid split">
          <article className="content-card">
            <span className="card-kicker">Session detail</span>
            <h2>{selectedSession.title}</h2>
            <div className="summary-grid tight">
              <div>
                <span>운동 시간</span>
                <strong>{selectedSession.durationMinutes} min</strong>
              </div>
              <div>
                <span>총 볼륨</span>
                <strong>{selectedSession.totalVolume.toLocaleString()} kg</strong>
              </div>
              <div>
                <span>PR 개수</span>
                <strong>{selectedSession.prCount}</strong>
              </div>
              <div>
                <span>칼로리 소모</span>
                <strong>{selectedSession.calories} kcal</strong>
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
            <div className="mini-panel">{selectedSession.note}</div>
          </article>

          <article className="content-card">
            <span className="card-kicker">Nutrition log</span>
            <div className="simple-list">
              {meals.slice(0, 6).map((meal) => (
                <div className="simple-row" key={meal.id}>
                  <strong>{meal.name}</strong>
                  <span>{meal.calories} kcal · {meal.protein}g protein</span>
                  <span>{meal.createdAt}</span>
                </div>
              ))}
            </div>
            <Link className="inline-action" to="/analytics/nutrition">
              Nutrition 로그 보기
            </Link>
          </article>
        </div>
      )}

      {selectedSession && (
        <article className="content-card">
          <span className="card-kicker">Exercise timeline</span>
          <div className="session-exercise-stack">
            {selectedSession.exercises.map((exercise) => (
              <div className="session-exercise-card" key={exercise.name}>
                <div className="feed-head">
                  <div>
                    <strong>{exercise.name}</strong>
                    <span>
                      {exercise.setCount} sets · Best {exercise.bestSet}
                    </span>
                  </div>
                  <span className="pill-tag">{exercise.category}</span>
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
                <div className="simple-list">
                  {exercise.timeline.map((setItem, index) => (
                    <div className="simple-row" key={`${exercise.name}-${index}`}>
                      <strong>Set {index + 1}</strong>
                      <span>{setItem.weight}kg x {setItem.reps}</span>
                      <span>Prev {setItem.previous}</span>
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
