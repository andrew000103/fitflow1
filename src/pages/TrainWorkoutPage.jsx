import { Link, useOutletContext } from 'react-router-dom'
import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { exerciseDetails } from '../data/fitnessData.js'
import { calculateEstimated1RM, calculateExerciseVolume, summarizeExercisePerformance } from '../utils/fitnessMetrics.ts'

function TrainWorkoutPage() {
  const {
    activeWorkout,
    quickTemplates,
    categoryLabels,
    workoutCatalog,
    sets,
    timeLeft,
    nowTick,
    startWorkout,
    addExerciseToWorkout,
    moveWorkoutExercise,
    updateWorkoutMeta,
    updateExerciseMeta,
    updateExerciseName,
    swapWorkoutExercise,
    updateWorkoutSet,
    addWorkoutSet,
    toggleSuperset,
    toggleWorkoutSetComplete,
    removeWorkoutExercise,
    finishWorkout,
  } = useOutletContext()

  const [metaOpen, setMetaOpen] = useState(false)
  const [quickAddCategory, setQuickAddCategory] = useState('chest')
  const [targetWeight, setTargetWeight] = useState('100')
  const [barWeight, setBarWeight] = useState('20')

  const restClock = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`
  const elapsedSeconds = activeWorkout ? Math.max(0, Math.floor((nowTick - activeWorkout.startedAt) / 1000)) : 0
  const elapsedClock = `${String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0')}:${String(
    Math.floor((elapsedSeconds % 3600) / 60),
  ).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`

  const plateResult = useMemo(() => {
    const target = Number(targetWeight)
    const bar = Number(barWeight)
    const perSide = (target - bar) / 2
    if (!Number.isFinite(target) || !Number.isFinite(bar) || target <= bar) {
      return { valid: false, message: '목표 중량은 바 무게보다 커야 합니다.' }
    }
    const plates = [25, 20, 15, 10, 5, 2.5, 1.25]
    let remaining = Math.round(perSide * 100) / 100
    const breakdown = []
    plates.forEach((plate) => {
      const count = Math.floor((remaining + 1e-9) / plate)
      if (count > 0) {
        breakdown.push({ plate, count })
        remaining = Math.round((remaining - count * plate) * 100) / 100
      }
    })
    return {
      valid: remaining === 0,
      perSide,
      breakdown,
      message: remaining === 0 ? null : `${remaining}kg per side를 현재 플레이트 조합으로 맞출 수 없습니다.`,
    }
  }, [barWeight, targetWeight])

  if (!activeWorkout) {
    return (
      <section className="page-section">
        <PageHeader
          eyebrow="Train / Workout"
          title="Start Workout"
          description="빈 운동을 바로 시작하거나 템플릿으로 진입할 수 있습니다."
        />

        <div className="train-action-grid">
          <button type="button" className="train-action-card" onClick={() => startWorkout('empty')}>
            <span className="train-action-icon">➕</span>
            <div className="train-action-copy">
              <strong>Start Empty Workout</strong>
              <span>가볍게 시작하고 운동을 추가합니다.</span>
            </div>
            <span className="train-action-cta">Start</span>
          </button>
          {quickTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="train-action-card"
              onClick={() => startWorkout('template', template)}
            >
              <span className="train-action-icon">🧩</span>
              <div className="train-action-copy">
                <strong>{template.label}</strong>
                <span>{template.exercises.slice(0, 2).join(' · ')}</span>
              </div>
              <span className="train-action-cta">Use</span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="train-hero">
        <div className="train-hero-main">
          <span className="page-eyebrow">Train / Active workout</span>
          <h1>{activeWorkout.title}</h1>
          <div className="train-meta-row">
            <span className="status-chip active">Elapsed {elapsedClock}</span>
            <span className={timeLeft > 0 ? 'status-chip active' : 'status-chip'}>
              Rest {timeLeft > 0 ? restClock : 'Ready'}
            </span>
            {timeLeft > 0 && timeLeft <= 10 ? <span className="pill-tag accent">곧 시작</span> : null}
          </div>
        </div>
        <div className="train-hero-actions">
          <button className="icon-chip" type="button" onClick={() => setMetaOpen((current) => !current)}>
            Details
          </button>
          <button className="inline-action primary-dark" type="button" onClick={finishWorkout}>
            Finish
          </button>
        </div>
      </div>

      <article className="content-card workout-focus-card">
        <div className="feed-head">
          <div>
            <span className="card-kicker">Quick actions</span>
            <h2>지금 필요한 것만 보이게 정리했습니다.</h2>
          </div>
          <button className="inline-action" type="button" onClick={() => addExerciseToWorkout(quickAddCategory)}>
            Add {categoryLabels[quickAddCategory]}
          </button>
        </div>
        <div className="quick-pills">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              className={quickAddCategory === key ? 'pill-tag accent' : 'pill-tag'}
              type="button"
              onClick={() => setQuickAddCategory(key)}
            >
              {label}
            </button>
          ))}
          <Link className="pill-tag" to="/train/exercises">
            Exercise DB
          </Link>
        </div>
      </article>

      {metaOpen ? (
        <article className="content-card">
          <div className="card-grid split">
            <div className="stack-form">
              <span className="card-kicker">Workout details</span>
              <label className="field-label">
                Workout name
                <input value={activeWorkout.title} onChange={(event) => updateWorkoutMeta('title', event.target.value)} />
              </label>
              <label className="field-label">
                Workout note
                <textarea rows="3" value={activeWorkout.note} onChange={(event) => updateWorkoutMeta('note', event.target.value)} />
              </label>
            </div>

            <div className="stack-form">
              <span className="card-kicker">Plate calculator</span>
              <div className="compact-grid">
                <label className="field-label">
                  Target weight
                  <input value={targetWeight} onChange={(event) => setTargetWeight(event.target.value)} inputMode="decimal" />
                </label>
                <label className="field-label">
                  Bar weight
                  <input value={barWeight} onChange={(event) => setBarWeight(event.target.value)} inputMode="decimal" />
                </label>
              </div>
              {plateResult.valid ? (
                <div className="plate-result">
                  <strong>{plateResult.perSide}kg per side</strong>
                  <div className="plate-row">
                    {plateResult.breakdown.map((item) => (
                      <span className="pill-tag" key={item.plate}>
                        {item.plate}kg x {item.count}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p>{plateResult.message}</p>
              )}
            </div>
          </div>
        </article>
      ) : null}

      <article className="content-card rest-focus-card">
        <span className="card-kicker">Rest timer</span>
        <strong>{timeLeft > 0 ? restClock : 'Ready for next set'}</strong>
        <p>{timeLeft > 0 ? '세트 완료 후 자동으로 시작됩니다.' : '세트를 체크하면 다음 휴식이 자동으로 시작됩니다.'}</p>
      </article>

      <div className="exercise-stack">
        {activeWorkout.exercises.map((exercise) => {
          const previousRecord = sets.find((item) => item.exercise === exercise.name)
          const detail = exerciseDetails[exercise.name]
          const performance = summarizeExercisePerformance({
            name: exercise.name,
            sets: exercise.sets.map((setItem) => ({
              weightKg: Number(setItem.weight || 0),
              reps: Number(setItem.reps || 0),
              isCompleted: setItem.completed,
            })),
          })
          const liveEstimated1RM = exercise.sets.reduce((best, setItem) => {
            const estimate = calculateEstimated1RM(Number(setItem.weight || 0), Number(setItem.reps || 0))
            return estimate > best ? estimate : best
          }, 0)
          const exerciseVolume = calculateExerciseVolume({
            name: exercise.name,
            sets: exercise.sets.map((setItem) => ({
              weightKg: Number(setItem.weight || 0),
              reps: Number(setItem.reps || 0),
              isCompleted: setItem.completed,
            })),
          })

          return (
            <article className="content-card exercise-card" key={exercise.id}>
              <div className="exercise-card-head">
                <div>
                  <span className="card-kicker">{categoryLabels[exercise.category]}</span>
                  {exercise.supersetId ? <span className="pill-tag accent">Superset</span> : null}
                  <div className="exercise-name-row">
                    <select
                      className="exercise-name-select"
                      value={exercise.name}
                      onChange={(event) => updateExerciseName(exercise.id, event.target.value)}
                    >
                      {workoutCatalog[exercise.category].map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <span className="mini-caption">
                      Previous {previousRecord ? `${previousRecord.weight}kg x ${previousRecord.reps}` : '-'}
                    </span>
                  </div>
                </div>
                <button className="inline-action" type="button" onClick={() => addWorkoutSet(exercise.id)}>
                  Add set
                </button>
              </div>

              <div className="exercise-stats compact">
                <span>1RM {liveEstimated1RM || '-'} kg</span>
                <span>Best {performance.maxWeightKg || '-'} kg</span>
                <span>Set Vol {performance.maxSetVolumeKg || '-'} kg</span>
                <span>Total {exerciseVolume || '-'} kg</span>
              </div>

              <div className="set-list">
                {exercise.sets.map((setItem, index) => (
                  <div className="set-row mobile" key={setItem.id}>
                    <div className="set-row-main">
                      <div className="set-index-block">
                        <strong>Set {index + 1}</strong>
                        <span>{setItem.previous}</span>
                      </div>
                      <div className="set-entry-grid">
                        <label className="set-input">
                          <span>kg</span>
                          <input
                            value={setItem.weight}
                            inputMode="decimal"
                            onChange={(event) => updateWorkoutSet(exercise.id, setItem.id, 'weight', event.target.value)}
                          />
                        </label>
                        <label className="set-input">
                          <span>reps</span>
                          <input
                            value={setItem.reps}
                            inputMode="numeric"
                            onChange={(event) => updateWorkoutSet(exercise.id, setItem.id, 'reps', event.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                    <button
                      className={setItem.completed ? 'inline-action primary-dark' : 'inline-action'}
                      type="button"
                      onClick={() => toggleWorkoutSetComplete(exercise.id, setItem.id)}
                    >
                      {setItem.completed ? 'Done' : 'Complete'}
                    </button>
                  </div>
                ))}
              </div>

              <details className="workout-advanced">
                <summary>Advanced options</summary>
                <div className="workout-advanced-body">
                  <div className="exercise-card-tools">
                    <button className="inline-action" type="button" onClick={() => toggleSuperset(exercise.id)}>
                      {exercise.supersetId ? 'Unset superset' : 'Make superset'}
                    </button>
                    <button className="inline-action" type="button" onClick={() => swapWorkoutExercise(exercise.id)}>
                      Swap exercise
                    </button>
                    <button className="inline-action" type="button" onClick={() => moveWorkoutExercise(exercise.id, 'up')}>
                      Move up
                    </button>
                    <button className="inline-action" type="button" onClick={() => moveWorkoutExercise(exercise.id, 'down')}>
                      Move down
                    </button>
                    <button className="inline-action" type="button" onClick={() => removeWorkoutExercise(exercise.id)}>
                      Remove
                    </button>
                  </div>

                  <label className="field-label">
                    Exercise note
                    <textarea
                      rows="2"
                      value={exercise.note}
                      onChange={(event) => updateExerciseMeta(exercise.id, 'note', event.target.value)}
                      placeholder={detail?.description || '메모를 입력하세요'}
                    />
                  </label>

                  <a
                    className="inline-action"
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} exercise tutorial`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    자세 설명 / 유튜브 보기
                  </a>
                </div>
              </details>
            </article>
          )
        })}
      </div>

      <div className="sticky-cta-bar">
        <button className="inline-action" type="button" onClick={() => addExerciseToWorkout(quickAddCategory)}>
          Add exercise
        </button>
        <button className="inline-action primary-dark" type="button" onClick={finishWorkout}>
          Finish workout
        </button>
      </div>
    </section>
  )
}

export default TrainWorkoutPage
