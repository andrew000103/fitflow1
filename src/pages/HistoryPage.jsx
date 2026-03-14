import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import AppIcon from '../components/AppIcon.jsx'

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
  const { sessions, updateSession, deleteSession } = useOutletContext()
  const today = new Date()
  const todayIso = toIsoDate(today)
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(sessions[0]?.date || todayIso)
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || null)
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [draftSession, setDraftSession] = useState(null)

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
    ...Array.from({ length: firstDayOffset }, (_, index) => ({ id: `blank-${index}`, empty: true })),
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

  function startEditingSession(session) {
    setEditingSessionId(session.id)
    setDraftSession({
      id: session.id,
      title: session.title,
      date: session.date,
      durationMinutes: session.durationMinutes,
      note: session.note,
      exercises: session.exercises.map((exercise) => ({
        ...exercise,
        timeline: exercise.timeline.map((setItem) => ({
          previous: setItem.previous || '-',
          weight: setItem.weight,
          reps: setItem.reps,
        })),
      })),
    })
  }

  function updateDraftSession(field, value) {
    setDraftSession((current) => (current ? { ...current, [field]: value } : current))
  }

  function updateDraftSet(exerciseIndex, setIndex, field, value) {
    setDraftSession((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        exercises: current.exercises.map((exercise, currentExerciseIndex) =>
          currentExerciseIndex === exerciseIndex
            ? {
                ...exercise,
                timeline: exercise.timeline.map((setItem, currentSetIndex) =>
                  currentSetIndex === setIndex ? { ...setItem, [field]: value } : setItem,
                ),
              }
            : exercise,
        ),
      }
    })
  }

  function handleSaveSession() {
    if (!draftSession) {
      return
    }

    updateSession(draftSession.id, {
      title: draftSession.title,
      date: draftSession.date,
      durationMinutes: Number(draftSession.durationMinutes) || 1,
      note: draftSession.note,
      exercises: draftSession.exercises.map((exercise) => ({
        ...exercise,
        timeline: exercise.timeline.map((setItem) => ({
          ...setItem,
          weight: Number(setItem.weight) || 0,
          reps: Number(setItem.reps) || 0,
        })),
      })),
    })

    setSelectedDate(draftSession.date)
    setEditingSessionId(null)
    setDraftSession(null)
  }

  function handleDeleteSession(sessionId) {
    deleteSession(sessionId)
    const remainingSessions = sessions.filter((session) => session.id !== sessionId)
    const nextSelected = remainingSessions.find((session) => session.date === selectedDate) || remainingSessions[0] || null
    setEditingSessionId(null)
    setDraftSession(null)
    setSelectedSessionId(nextSelected?.id || null)
    setSelectedDate(nextSelected?.date || todayIso)
  }

  const monthlyVolume = monthSessions.reduce((sum, session) => sum + session.totalVolume, 0)
  const monthlyPRs = monthSessions.reduce((sum, session) => sum + session.prCount, 0)

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Workout / History"
        title="Workout History"
        description="운동 기록만 컴팩트하게 보고, 필요할 때만 세트 상세를 펼쳐봅니다."
      />

      <div className="card-grid three-up">
        <article className="content-card">
          <span className="card-kicker"><AppIcon name="calendar" size="sm" /> This month</span>
          <strong>{monthSessions.length} sessions</strong>
          <p>운동한 날짜를 월간 캘린더에서 바로 확인합니다.</p>
        </article>
        <article className="content-card">
          <span className="card-kicker"><AppIcon name="activity" size="sm" /> Total volume</span>
          <strong>{monthlyVolume.toLocaleString()} kg</strong>
          <p>이달 누적 볼륨을 빠르게 확인합니다.</p>
        </article>
        <article className="content-card">
          <span className="card-kicker"><AppIcon name="calories" size="sm" /> PR count</span>
          <strong>{monthlyPRs} PRs</strong>
          <p>이번 달 세운 개인 기록 수입니다.</p>
        </article>
      </div>

      <div className="card-grid split">
        <article className="content-card">
          <div className="calendar-head">
            <button className="inline-action" type="button" onClick={() => setMonthOffset((current) => current - 1)}>
              <AppIcon name="chevronLeft" size="sm" /> Prev
            </button>
            <h2>{monthLabel}</h2>
            <button className="inline-action" type="button" onClick={() => setMonthOffset((current) => current + 1)}>
              Next <AppIcon name="chevronRight" size="sm" />
            </button>
          </div>
          <div className="calendar-weekdays">
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {calendarDays.map((item) =>
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
              ),
            )}
          </div>
        </article>

        <article className="content-card">
          <span className="card-kicker"><AppIcon name="history" size="sm" /> Sessions</span>
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
                  <span>{session.durationMinutes} min · {session.totalVolume.toLocaleString()} kg</span>
                  <span>{session.calories} kcal · {session.date}</span>
                </button>
              ))
            ) : (
              <div className="mini-panel">선택한 날짜에는 운동 세션이 없습니다.</div>
            )}
          </div>
        </article>
      </div>

      {selectedSession ? (
        <article className="content-card">
          <div className="feed-head">
            <div>
              <span className="card-kicker"><AppIcon name="detail" size="sm" /> Session detail</span>
              <h2>{editingSessionId === selectedSession.id ? draftSession?.title : selectedSession.title}</h2>
            </div>
            <div className="feed-actions">
              {editingSessionId === selectedSession.id ? (
                <>
                  <button className="inline-action primary-dark" type="button" onClick={handleSaveSession}>
                    Save
                  </button>
                  <button
                    className="inline-action"
                    type="button"
                    onClick={() => {
                      setEditingSessionId(null)
                      setDraftSession(null)
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="inline-action" type="button" onClick={() => startEditingSession(selectedSession)}>
                    Edit
                  </button>
                  <button className="inline-action" type="button" onClick={() => handleDeleteSession(selectedSession.id)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="summary-grid tight">
            <div>
              <span>Date</span>
              {editingSessionId === selectedSession.id ? (
                <input value={draftSession?.date || ''} onChange={(event) => updateDraftSession('date', event.target.value)} />
              ) : (
                <strong>{selectedSession.date}</strong>
              )}
            </div>
            <div>
              <span>Workout time</span>
              {editingSessionId === selectedSession.id ? (
                <input
                  value={draftSession?.durationMinutes || ''}
                  inputMode="numeric"
                  onChange={(event) => updateDraftSession('durationMinutes', event.target.value)}
                />
              ) : (
                <strong>{selectedSession.durationMinutes} min</strong>
              )}
            </div>
            <div>
              <span>Total volume</span>
              <strong>{selectedSession.totalVolume.toLocaleString()} kg</strong>
            </div>
            <div>
              <span>PR count</span>
              <strong>{selectedSession.prCount}</strong>
            </div>
          </div>
          {editingSessionId === selectedSession.id ? (
            <label className="field-label">
              Note
              <textarea value={draftSession?.note || ''} onChange={(event) => updateDraftSession('note', event.target.value)} />
            </label>
          ) : (
            <div className="mini-panel"><AppIcon name="edit" size="sm" /> {selectedSession.note}</div>
          )}
          <div className="simple-list">
            {(editingSessionId === selectedSession.id ? draftSession?.exercises || [] : selectedSession.exercises).map((exercise, exerciseIndex) => (
              <details key={exercise.name}>
                <summary>
                  {exercise.name} · {(exercise.timeline || []).length} sets · {exercise.bestSet}
                </summary>
                <div className="simple-list">
                  {exercise.timeline.map((setItem, index) => (
                    <div className="simple-row compact" key={`${exercise.name}-${index}`}>
                      <strong>Set {index + 1}</strong>
                      {editingSessionId === selectedSession.id ? (
                        <div className="history-set-edit-row">
                          <input
                            value={setItem.weight}
                            inputMode="decimal"
                            onChange={(event) => updateDraftSet(exerciseIndex, index, 'weight', event.target.value)}
                          />
                          <input
                            value={setItem.reps}
                            inputMode="numeric"
                            onChange={(event) => updateDraftSet(exerciseIndex, index, 'reps', event.target.value)}
                          />
                        </div>
                      ) : (
                        <span>{setItem.weight}kg x {setItem.reps}</span>
                      )}
                      <span>{getPreviousDelta(setItem)}</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  )
}

export default HistoryPage
