import { Link, useOutletContext } from 'react-router-dom'
import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { exerciseDetails } from '../data/fitnessData.js'
import { calculateEstimated1RM, calculateExerciseVolume, summarizeExercisePerformance } from '../utils/fitnessMetrics.ts'

function TrainPage() {
  const {
    activeWorkout,
    currentProgram,
    programs,
    quickTemplates,
    categoryLabels,
    workoutCatalog,
    sets,
    timeLeft,
    lastWorkoutSummary,
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
    createProgram,
    aiCoach,
  } = useOutletContext()
  const [plateOpen, setPlateOpen] = useState(false)
  const [targetWeight, setTargetWeight] = useState('100')
  const [barWeight, setBarWeight] = useState('20')
  const [programName, setProgramName] = useState('')
  const [programWeek, setProgramWeek] = useState('1')
  const [programDay, setProgramDay] = useState('1')
  const [programCategory, setProgramCategory] = useState('chest')
  const [programExercise, setProgramExercise] = useState(workoutCatalog.chest[0])
  const [programExercises, setProgramExercises] = useState(['Bench Press', 'Seated Cable Row'])
  const [programCreatorOpen, setProgramCreatorOpen] = useState(false)

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
    if (perSide < 0) {
      return { valid: false, message: '유효한 중량을 입력하세요.' }
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

  function handleProgramCategoryChange(nextCategory) {
    setProgramCategory(nextCategory)
    setProgramExercise(workoutCatalog[nextCategory][0])
  }

  function addProgramExercise() {
    if (programExercises.includes(programExercise)) {
      return
    }
    setProgramExercises((current) => [...current, programExercise])
  }

  function removeProgramExercise(exerciseName) {
    setProgramExercises((current) => current.filter((item) => item !== exerciseName))
  }

  function handleCreateProgram(event) {
    event.preventDefault()
    if (!programName || programExercises.length === 0) {
      return
    }
    createProgram({
      name: programName,
      week: Number(programWeek),
      day: Number(programDay),
      exercises: programExercises,
    })
    setProgramName('')
    setProgramWeek('1')
    setProgramDay('1')
    setProgramExercises([])
  }

  if (activeWorkout) {
    return (
      <section className="page-section">
        <div className="train-hero">
          <div className="train-hero-main">
            <span className="page-eyebrow">Train / Active workout</span>
            <h1>{activeWorkout.title}</h1>
            <div className="train-meta-row">
              <span className="status-chip active">Started now</span>
              <span className="status-chip">Elapsed {elapsedClock}</span>
              <span className={timeLeft > 0 ? 'status-chip active' : 'status-chip'}>
                Rest Timer {timeLeft > 0 ? restClock : 'Ready'}
              </span>
            </div>
          </div>
          <div className="train-hero-actions">
            <button className="icon-chip" type="button">
              Camera
            </button>
            <button className="icon-chip" type="button" onClick={() => setPlateOpen((current) => !current)}>
              Plate Calculator
            </button>
            <button className="inline-action primary-dark" type="button" onClick={finishWorkout}>
              Finish
            </button>
          </div>
        </div>

        {plateOpen && (
          <article className="content-card">
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
          </article>
        )}

        <div className="card-grid split">
          <article className="content-card">
            <span className="card-kicker">Workout meta</span>
            <div className="stack-form">
              <label className="field-label">
                Workout name
                <input
                  value={activeWorkout.title}
                  onChange={(event) => updateWorkoutMeta('title', event.target.value)}
                />
              </label>
              <label className="field-label">
                Workout note
                <textarea
                  rows="3"
                  value={activeWorkout.note}
                  onChange={(event) => updateWorkoutMeta('note', event.target.value)}
                  placeholder="오늘 운동 메모를 남겨보세요"
                />
              </label>
            </div>
          </article>

          <article className="content-card">
            <span className="card-kicker">Quick templates</span>
            <div className="template-row">
              {quickTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="template-chip"
                  onClick={() => startWorkout('template', template)}
                >
                  <strong>{template.label}</strong>
                  <span>{template.exercises.slice(0, 2).join(' · ')}</span>
                </button>
              ))}
            </div>
            <div className="quick-action-row">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <button key={key} className="inline-action" type="button" onClick={() => addExerciseToWorkout(key)}>
                  Add {label}
                </button>
              ))}
              <Link className="inline-action" to="/train/exercises">
                Exercise Database
              </Link>
            </div>
          </article>
        </div>

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
                  </div>
                  <div className="exercise-card-tools">
                    <button className="inline-action" type="button" onClick={() => toggleSuperset(exercise.id)}>
                      {exercise.supersetId ? 'Unset Superset' : 'Superset'}
                    </button>
                    <button className="inline-action" type="button" onClick={() => swapWorkoutExercise(exercise.id)}>
                      Swap
                    </button>
                    <button className="inline-action" type="button" onClick={() => moveWorkoutExercise(exercise.id, 'up')}>
                      Up
                    </button>
                    <button className="inline-action" type="button" onClick={() => moveWorkoutExercise(exercise.id, 'down')}>
                      Down
                    </button>
                    <button className="inline-action" type="button" onClick={() => removeWorkoutExercise(exercise.id)}>
                      Delete
                    </button>
                  </div>
                </div>

                <div className="exercise-stats">
                  <span>Previous {previousRecord ? `${previousRecord.weight}kg x ${previousRecord.reps}` : '-'}</span>
                  <span>Est. 1RM {liveEstimated1RM || '-'} kg</span>
                  <span>Best Weight {performance.maxWeightKg || '-'} kg</span>
                  <span>Best Volume {performance.maxSetVolumeKg || '-'} kg</span>
                  <span>Total Volume {exerciseVolume || '-'} kg</span>
                </div>

                <div className="set-grid-header">
                  <span>Prev</span>
                  <span>Weight</span>
                  <span>Reps</span>
                  <span>Done</span>
                </div>

                <div className="set-list">
                  {exercise.sets.map((setItem) => (
                    <div className="set-row" key={setItem.id}>
                      <span className="set-prev">{setItem.previous}</span>
                      <input
                        value={setItem.weight}
                        inputMode="decimal"
                        onChange={(event) =>
                          updateWorkoutSet(exercise.id, setItem.id, 'weight', event.target.value)
                        }
                      />
                      <input
                        value={setItem.reps}
                        inputMode="numeric"
                        onChange={(event) =>
                          updateWorkoutSet(exercise.id, setItem.id, 'reps', event.target.value)
                        }
                      />
                      <label className="check-wrap">
                        <input
                          type="checkbox"
                          checked={setItem.completed}
                          onChange={() => toggleWorkoutSetComplete(exercise.id, setItem.id)}
                        />
                        <span>{setItem.completed ? 'Done' : 'Check'}</span>
                      </label>
                    </div>
                  ))}
                </div>

                <button className="inline-action" type="button" onClick={() => addWorkoutSet(exercise.id)}>
                  Add Set
                </button>

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
              </article>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="train-home-top">
        <div>
          <span className="page-eyebrow">Train</span>
          <h1>오늘 운동을 가장 빠르게 시작하는 중심 화면</h1>
          <p>진행 중인 프로그램을 이어 하거나, 빈 운동 시작, 템플릿 시작, 프로그램 생성까지 한 탭 안에서 연결합니다.</p>
        </div>
        <div className="train-home-actions">
          <button className="icon-chip" type="button">
            Camera
          </button>
          <button className="icon-chip" type="button">
            Settings
          </button>
          <span className="pro-chip">Pro</span>
        </div>
      </div>

      <div className="card-grid split">
        <article className="content-card continue-card">
          <span className="card-kicker">Continue program</span>
          <h2>{currentProgram.name}</h2>
          <div className="continue-meta">
            <span>Week {currentProgram.week}</span>
            <span>Day {currentProgram.day}</span>
            <span>{currentProgram.exercises.length} exercises</span>
          </div>
          <div className="simple-list">
            {currentProgram.exercises.map((item) => (
              <div className="simple-row" key={item.name}>
                <strong>{item.name}</strong>
                <span>{item.sets} sets</span>
                <span>{item.topSet}</span>
              </div>
            ))}
          </div>
          <button className="inline-action primary-dark" type="button" onClick={() => startWorkout('program', currentProgram)}>
            Start Week {currentProgram.week} · Day {currentProgram.day}
          </button>
        </article>

        <div className="train-side-stack">
          <article className="content-card">
            <span className="card-kicker">AI coach</span>
            <h2>{aiCoach.trainingTitle}</h2>
            <div className="mini-panel">{aiCoach.training}</div>
          </article>

          <article className="content-card">
            <span className="card-kicker">Workout streak</span>
            <h2>{currentProgram.streakWeeks}주 연속 운동 중</h2>
            <p>오운완 챌린지와 연결해 주차별 루틴 유지율을 높일 수 있습니다.</p>
          </article>

          <article className="content-card">
            <span className="card-kicker">Workout tracker</span>
            <div className="quick-action-col">
              <button className="inline-action primary-dark" type="button" onClick={() => startWorkout('empty')}>
                Start Empty Workout
              </button>
              <button className="inline-action" type="button" onClick={() => startWorkout('recent')}>
                최근 운동 불러오기
              </button>
              <button className="inline-action" type="button" onClick={() => startWorkout('template', quickTemplates[0])}>
                템플릿으로 시작
              </button>
            </div>
          </article>
        </div>
      </div>

      <article className="content-card">
        <span className="card-kicker">Quick templates</span>
        <div className="template-row compact">
          {quickTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="template-chip"
              onClick={() => startWorkout('template', template)}
            >
              <strong>{template.label}</strong>
              <span>{template.exercises.join(' · ')}</span>
            </button>
          ))}
        </div>
      </article>

      <div className="card-grid split">
        <article className="content-card">
          <div className="feed-head">
            <div>
              <span className="card-kicker">Program creator</span>
              <h2>Create Program</h2>
            </div>
            <button className="inline-action" type="button" onClick={() => setProgramCreatorOpen((current) => !current)}>
              {programCreatorOpen ? 'Hide' : 'Open'}
            </button>
          </div>
          {programCreatorOpen ? (
            <form className="stack-form" onSubmit={handleCreateProgram}>
              <label className="field-label">
                Program name
                <input value={programName} onChange={(event) => setProgramName(event.target.value)} placeholder="예: Push Pull Legs Builder" />
              </label>
              <div className="compact-grid">
                <label className="field-label">
                  Week
                  <input value={programWeek} onChange={(event) => setProgramWeek(event.target.value)} inputMode="numeric" />
                </label>
                <label className="field-label">
                  Day
                  <input value={programDay} onChange={(event) => setProgramDay(event.target.value)} inputMode="numeric" />
                </label>
              </div>
              <div className="compact-grid">
                <label className="field-label">
                  Category
                  <select value={programCategory} onChange={(event) => handleProgramCategoryChange(event.target.value)}>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  Exercise
                  <select value={programExercise} onChange={(event) => setProgramExercise(event.target.value)}>
                    {workoutCatalog[programCategory].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button className="inline-action" type="button" onClick={addProgramExercise}>
                운동 추가
              </button>
              <div className="program-chip-list">
                {programExercises.map((item) => (
                  <button key={item} type="button" className="template-chip removable" onClick={() => removeProgramExercise(item)}>
                    <strong>{item}</strong>
                    <span>제거하려면 탭</span>
                  </button>
                ))}
              </div>
              <button className="inline-action primary-dark" type="submit">
                Create Program
              </button>
            </form>
          ) : (
            <div className="mini-panel">프로그램 생성은 필요할 때만 펼쳐서 사용합니다.</div>
          )}
        </article>

        {lastWorkoutSummary ? (
          <article className="content-card">
            <span className="card-kicker">Workout summary</span>
            <h2>{lastWorkoutSummary.title}</h2>
            <div className="summary-grid">
              <div><span>총 시간</span><strong>{lastWorkoutSummary.durationMinutes} min</strong></div>
              <div><span>총 볼륨</span><strong>{lastWorkoutSummary.sessionVolume.toLocaleString()} kg</strong></div>
              <div><span>탑셋</span><strong>{lastWorkoutSummary.topSet}</strong></div>
              <div><span>PR 개수</span><strong>{lastWorkoutSummary.prCount}</strong></div>
              <div><span>추정 칼로리</span><strong>{lastWorkoutSummary.calories} kcal</strong></div>
              <div><span>피로도 변화</span><strong>+{lastWorkoutSummary.fatigueDelta}</strong></div>
              <div><span>완료 세트</span><strong>{lastWorkoutSummary.completedSets}</strong></div>
            </div>
            <Link className="inline-action" to="/analytics/nutrition">
              운동 종료 후 식단 기록하기
            </Link>
          </article>
        ) : (
          <article className="content-card">
            <span className="card-kicker">My programs</span>
            <h2>내 프로그램 목록</h2>
            <div className="simple-list">
              {programs.map((program) => (
                <div className="simple-row" key={program.id}>
                  <strong>{program.name}</strong>
                  <span>Week {program.week} · Day {program.day}</span>
                  <button className="inline-action" type="button" onClick={() => startWorkout('program', program)}>
                    Start
                  </button>
                </div>
              ))}
            </div>
          </article>
        )}
      </div>
    </section>
  )
}

export default TrainPage
