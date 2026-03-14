import { Link, useOutletContext } from 'react-router-dom'
import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { equipmentOptions, exerciseDetails, muscleGroupOptions } from '../data/fitnessData.js'
import { calculateEstimated1RM, calculateExerciseVolume, detectExercisePRs, summarizeExercisePerformance } from '../utils/fitnessMetrics.ts'

function TrainWorkoutPage() {
  const {
    activeWorkout,
    programs,
    categoryLabels,
    workoutCatalog,
    exerciseDatabase,
    sessions,
    sets,
    isResting,
    currentRestElapsed,
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
    stopRest,
    finishWorkout,
  } = useOutletContext()

  const [metaOpen, setMetaOpen] = useState(false)
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All')
  const [selectedEquipment, setSelectedEquipment] = useState('All')
  const [targetWeight, setTargetWeight] = useState('100')
  const [barWeight, setBarWeight] = useState('20')

  const restClock = `${String(Math.floor(currentRestElapsed / 60)).padStart(2, '0')}:${String(currentRestElapsed % 60).padStart(2, '0')}`
  const elapsedSeconds = activeWorkout ? Math.max(0, Math.floor((nowTick - activeWorkout.startedAt) / 1000)) : 0
  const elapsedClock = `${String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0')}:${String(
    Math.floor((elapsedSeconds % 3600) / 60),
  ).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`
  const usageMap = useMemo(
    () =>
      sets.reduce((acc, item) => {
        acc[item.exercise] = (acc[item.exercise] || 0) + 1
        return acc
      }, {}),
    [sets],
  )
  const recentExercises = useMemo(
    () => Array.from(new Map(sets.map((item) => [item.exercise, item])).values()).slice(0, 4),
    [sets],
  )
  const filteredExercises = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return exerciseDatabase
      .filter((exercise) => {
        const matchesSearch =
          !normalizedQuery ||
          exercise.name.toLowerCase().includes(normalizedQuery) ||
          exercise.target.toLowerCase().includes(normalizedQuery) ||
          exercise.secondary.toLowerCase().includes(normalizedQuery)
        const matchesMuscle =
          selectedMuscleGroup === 'All' ||
          exercise.target === selectedMuscleGroup ||
          exercise.secondary === selectedMuscleGroup
        const matchesEquipment =
          selectedEquipment === 'All' || exercise.equipment === selectedEquipment

        return matchesSearch && matchesMuscle && matchesEquipment
      })
      .sort((left, right) => {
        const usageDelta = (usageMap[right.name] || 0) - (usageMap[left.name] || 0)
        return usageDelta !== 0 ? usageDelta : left.name.localeCompare(right.name)
      })
  }, [exerciseDatabase, searchQuery, selectedEquipment, selectedMuscleGroup, usageMap])

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

  function handleAddExercise(exerciseName) {
    addExerciseToWorkout(exerciseName)
    setExercisePickerOpen(false)
  }

  function clearExerciseFilters() {
    setSearchQuery('')
    setSelectedMuscleGroup('All')
    setSelectedEquipment('All')
  }

  if (!activeWorkout) {
    return (
      <section className="page-section">
        <PageHeader
          eyebrow="Train / Workout"
          title="Start Workout"
          description="빈 운동을 바로 시작하거나, 현재 사용할 Program을 선택해서 진입할 수 있습니다."
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
          {programs.slice(0, 2).map((program) => (
            <button
              key={program.id}
              type="button"
              className="train-action-card"
              onClick={() => startWorkout('program', program)}
            >
              <span className="train-action-icon">📚</span>
              <div className="train-action-copy">
                <strong>{program.title}</strong>
                <span>{program.category} · {program.durationWeeks} weeks</span>
              </div>
              <span className="train-action-cta">Start</span>
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
            <span className={isResting ? 'status-chip active' : 'status-chip'}>
              Rest {isResting ? restClock : 'Ready'}
            </span>
          </div>
        </div>
        <div className="train-hero-actions">
          <button className="icon-chip" type="button" onClick={() => setMetaOpen((current) => !current)}>
            Details
          </button>
          {isResting ? (
            <button className="icon-chip" type="button" onClick={stopRest}>
              End Rest
            </button>
          ) : null}
          <button className="inline-action primary-dark" type="button" onClick={finishWorkout}>
            Finish
          </button>
        </div>
      </div>

      <article className="content-card workout-focus-card">
        <div className="feed-head">
          <div>
            <span className="card-kicker">Add exercise</span>
            <h2>전체 목록에서 검색하고 필요할 때만 필터링합니다.</h2>
          </div>
          <button className="inline-action" type="button" onClick={() => setExercisePickerOpen((current) => !current)}>
            {exercisePickerOpen ? 'Close' : 'Browse exercises'}
          </button>
        </div>
        {recentExercises.length > 0 ? (
          <div className="quick-pills">
            {recentExercises.map((exercise) => (
              <button
                key={exercise.exercise}
                className="pill-tag"
                type="button"
                onClick={() => handleAddExercise(exercise.exercise)}
              >
                + {exercise.exercise}
              </button>
            ))}
          </div>
        ) : null}

        {exercisePickerOpen ? (
          <div className="workout-add-sheet">
            <div className="stack-form">
              <label className="field-label">
                Search
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="운동명 또는 타겟 부위를 검색"
                />
              </label>
              <div className="compact-grid">
                <label className="field-label">
                  Muscle Group
                  <select value={selectedMuscleGroup} onChange={(event) => setSelectedMuscleGroup(event.target.value)}>
                    {muscleGroupOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  Equipment
                  <select value={selectedEquipment} onChange={(event) => setSelectedEquipment(event.target.value)}>
                    {equipmentOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="filter-row">
                <button className="inline-action" type="button" onClick={clearExerciseFilters}>
                  Clear filters
                </button>
                <Link className="inline-action" to="/train/exercises">
                  Open DB
                </Link>
              </div>
            </div>

            <div className="database-list">
              {filteredExercises.length > 0 ? (
                filteredExercises.map((exercise) => (
                  <button
                    className="database-row workout-database-row"
                    key={exercise.name}
                    type="button"
                    onClick={() => handleAddExercise(exercise.name)}
                  >
                    <div className="database-icon">{exercise.icon}</div>
                    <div className="database-copy">
                      <strong>{exercise.name}</strong>
                      <span>
                        {exercise.target} · {exercise.secondary}
                      </span>
                      <span>{exercise.equipment} · {usageMap[exercise.name] || 0} times</span>
                    </div>
                    <span className="inline-action">Add</span>
                  </button>
                ))
              ) : (
                <div className="mini-panel">조건에 맞는 운동이 없습니다. 검색어나 필터를 조정해보세요.</div>
              )}
            </div>
          </div>
        ) : null}
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
        <span className="card-kicker">Rest stopwatch</span>
        <strong>{isResting ? restClock : 'Rest Ready'}</strong>
        <p>{isResting ? '현재 쉬는 시간을 누적해서 표시합니다.' : '세트를 완료하면 휴식 스톱워치가 자동으로 시작됩니다.'}</p>
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
          const previousBest = sessions
            .flatMap((session) => session.exercises)
            .filter((item) => item.name === exercise.name)
            .reduce(
              (best, item) => ({
                maxWeightKg: Math.max(best.maxWeightKg, item.maxWeight || 0),
                maxSetVolumeKg: Math.max(best.maxSetVolumeKg, item.maxVolume || 0),
                maxEstimated1RMKg: Math.max(best.maxEstimated1RMKg, item.estimated1RM || 0),
                maxExerciseVolumeKg: Math.max(
                  best.maxExerciseVolumeKg,
                  item.timeline.reduce((sum, setItem) => sum + Number(setItem.weight || 0) * Number(setItem.reps || 0), 0),
                ),
              }),
              { maxWeightKg: 0, maxSetVolumeKg: 0, maxEstimated1RMKg: 0, maxExerciseVolumeKg: 0 },
            )
          const prResult = detectExercisePRs(
            {
              name: exercise.name,
              sets: exercise.sets.map((setItem) => ({
                weightKg: Number(setItem.weight || 0),
                reps: Number(setItem.reps || 0),
                isCompleted: setItem.completed,
              })),
            },
            previousBest,
          )

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

              {prResult.isMaxWeightPR || prResult.isExerciseVolumePR ? (
                <div className="exercise-pr-row">
                  {prResult.isMaxWeightPR ? <span className="pill-tag accent">Weight PR</span> : null}
                  {prResult.isExerciseVolumePR ? <span className="pill-tag accent">Volume PR</span> : null}
                </div>
              ) : null}

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
        <button className="inline-action" type="button" onClick={() => setExercisePickerOpen(true)}>
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
