import { useEffect, useMemo, useRef, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import QuickAddExerciseBar from '../components/workout/QuickAddExerciseBar.jsx'
import ExercisePickerSheet from '../components/workout/ExercisePickerSheet.jsx'
import WorkoutExerciseCard from '../components/workout/WorkoutExerciseCard.jsx'
import BottomActionBar from '../components/workout/BottomActionBar.jsx'
import WorkoutHeader from '../components/workout/WorkoutHeader.jsx'
import { useOutletContext } from 'react-router-dom'
import { equipmentOptions, exerciseDetails, muscleGroupOptions } from '../data/fitnessData.js'
import { tx } from '../utils/appLanguage.js'
import { detectExercisePRs, detectSetPRs } from '../utils/fitnessMetrics.ts'

function uniqueByName(items) {
  const seen = new Set()

  return items.filter((item) => {
    if (!item?.name || seen.has(item.name)) {
      return false
    }
    seen.add(item.name)
    return true
  })
}

function TrainWorkoutPage() {
  const {
    appLanguage,
    activeWorkout,
    activeProgram,
    programs,
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
    updateExerciseMeta,
    updateExerciseName,
    swapWorkoutExercise,
    updateWorkoutSet,
    addWorkoutSet,
    moveWorkoutSet,
    removeWorkoutSet,
    toggleSuperset,
    toggleWorkoutSetComplete,
    removeWorkoutExercise,
    stopRest,
    finishWorkout,
    saveWorkoutTemplate,
  } = useOutletContext()

  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)
  const [pickerTab, setPickerTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All')
  const [selectedEquipment, setSelectedEquipment] = useState('All')
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false)
  const [workoutSummaryOpen, setWorkoutSummaryOpen] = useState(false)
  const [templatePromptOpen, setTemplatePromptOpen] = useState(false)
  const [completedWorkoutSnapshot, setCompletedWorkoutSnapshot] = useState(null)
  const [completedWorkoutSummary, setCompletedWorkoutSummary] = useState(null)
  const exerciseCardRefs = useRef({})
  const pendingAutoScrollRef = useRef(false)
  const previousExerciseCountRef = useRef(activeWorkout?.exercises.length || 0)

  useEffect(() => {
    const currentExerciseCount = activeWorkout?.exercises.length || 0
    const previousExerciseCount = previousExerciseCountRef.current

    if (!pendingAutoScrollRef.current || currentExerciseCount <= previousExerciseCount) {
      previousExerciseCountRef.current = currentExerciseCount
      return
    }

    const newestExercise = activeWorkout?.exercises?.[currentExerciseCount - 1]
    const newestExerciseNode = newestExercise ? exerciseCardRefs.current[newestExercise.id] : null

    if (newestExerciseNode) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          newestExerciseNode.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          })
        })
      })
    }

    pendingAutoScrollRef.current = false
    previousExerciseCountRef.current = currentExerciseCount
  }, [activeWorkout])

  function queueExerciseAutoScroll() {
    pendingAutoScrollRef.current = true
  }

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
    () => Array.from(new Map(sets.map((item) => [item.exercise, item])).values()).slice(0, 5),
    [sets],
  )

  const recentItems = useMemo(
    () =>
      uniqueByName(
        recentExercises
          .map((item) => exerciseDatabase.find((exercise) => exercise.name === item.exercise))
          .filter(Boolean),
      ),
    [exerciseDatabase, recentExercises],
  )

  const frequentItems = useMemo(
    () =>
      exerciseDatabase
        .filter((exercise) => usageMap[exercise.name] > 0)
        .sort((left, right) => {
          const usageDelta = (usageMap[right.name] || 0) - (usageMap[left.name] || 0)
          return usageDelta !== 0 ? usageDelta : left.name.localeCompare(right.name)
        })
        .slice(0, 6),
    [exerciseDatabase, usageMap],
  )

  const currentProgramDay = useMemo(() => {
    if (!activeWorkout?.programId) {
      return null
    }

    const activeProgramSource = programs.find((program) => program.id === activeWorkout.programId)
    const week = activeProgramSource?.weeks?.find((item) => item.weekIndex === (activeWorkout.currentWeek || activeProgram?.currentWeek || 1))

    return week?.days?.find((item) => item.dayIndex === (activeWorkout.currentDay || activeProgram?.currentDay || 1)) || null
  }, [activeProgram, activeWorkout, programs])

  const recommendedItems = useMemo(() => {
    // TODO: Replace this with persisted personalization once workout recommendations move to a shared store.
    const programItems = (currentProgramDay?.exercises || [])
      .map((item) => item.exerciseName || item.name)
      .map((name) => exerciseDatabase.find((exercise) => exercise.name === name))
      .filter(Boolean)

    if (programItems.length > 0) {
      return uniqueByName(programItems).slice(0, 8)
    }

    return uniqueByName([...frequentItems, ...recentItems, ...exerciseDatabase]).slice(0, 8)
  }, [currentProgramDay, exerciseDatabase, frequentItems, recentItems])

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
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [exerciseDatabase, searchQuery, selectedEquipment, selectedMuscleGroup])

  const workoutExerciseNames = useMemo(
    () => new Set((activeWorkout?.exercises || []).map((exercise) => exercise.name)),
    [activeWorkout],
  )

  const canAddProgramDay = Boolean(
    currentProgramDay?.exercises?.some((item) => !workoutExerciseNames.has(item.exerciseName || item.name)),
  )

  function handleAddExercise(exerciseName) {
    queueExerciseAutoScroll()
    addExerciseToWorkout(exerciseName)
    setExercisePickerOpen(false)
    setSearchQuery('')
  }

  function handleProgramDayAdd() {
    if (!currentProgramDay?.exercises?.length) {
      return
    }

    let hasExerciseToAdd = false

    currentProgramDay.exercises.forEach((item) => {
      const exerciseName = item.exerciseName || item.name
      if (!workoutExerciseNames.has(exerciseName)) {
        hasExerciseToAdd = true
        addExerciseToWorkout(exerciseName)
      }
    })

    if (hasExerciseToAdd) {
      queueExerciseAutoScroll()
    }

    setExercisePickerOpen(false)
    setSearchQuery('')
  }

  function clearExerciseFilters() {
    setSearchQuery('')
    setSelectedMuscleGroup('All')
    setSelectedEquipment('All')
    setPickerTab('all')
  }

  function openExercisePicker(nextTab = 'all') {
    setPickerTab(nextTab)
    setExercisePickerOpen(true)
  }

  function closeSummaryFlow() {
    if (completedWorkoutSnapshot?.source === 'empty') {
      setTemplatePromptOpen(true)
      return
    }

    setWorkoutSummaryOpen(false)
    setCompletedWorkoutSnapshot(null)
    setCompletedWorkoutSummary(null)
  }

  function finishSummaryFlow() {
    setWorkoutSummaryOpen(false)
    setTemplatePromptOpen(false)
    setCompletedWorkoutSnapshot(null)
    setCompletedWorkoutSummary(null)
  }

  function handleSaveTemplate() {
    if (completedWorkoutSnapshot) {
      saveWorkoutTemplate({
        title: `${completedWorkoutSnapshot.title} 템플릿`,
        description: '즉시 운동 기록에서 저장한 템플릿입니다.',
        dayTitle: completedWorkoutSnapshot.title,
        exercises: completedWorkoutSnapshot.exercises,
      })
    }

    finishSummaryFlow()
  }

  if (!activeWorkout && !workoutSummaryOpen) {
    return (
      <section className="page-section">
        <PageHeader
          eyebrow="Workout / Workout"
          title={tx(appLanguage, '운동 시작', 'Start Workout')}
          description={tx(
            appLanguage,
            '바로 운동을 시작하거나 프로그램 운동으로 들어갈 수 있습니다.',
            'Start a workout right away or jump into your current program.',
          )}
        />

        <div className="train-action-grid">
          <button type="button" className="train-action-card" onClick={() => startWorkout('empty')}>
            <span className="train-action-icon">+</span>
            <div className="train-action-copy">
              <strong>{tx(appLanguage, '바로 운동 시작', 'Quick Workout')}</strong>
              <span>{tx(appLanguage, '빈 운동을 시작하고 바로 종목을 추가합니다.', 'Start empty and add exercises on the fly.')}</span>
            </div>
            <span className="train-action-cta">{tx(appLanguage, '시작', 'Start')}</span>
          </button>
          {programs.slice(0, 2).map((program) => (
            <button
              key={program.id}
              type="button"
              className="train-action-card"
              onClick={() => startWorkout('program', program)}
            >
              <span className="train-action-icon">+</span>
              <div className="train-action-copy">
                <strong>{program.title}</strong>
                <span>{program.category} · {program.durationWeeks} weeks</span>
              </div>
              <span className="train-action-cta">{tx(appLanguage, '시작', 'Start')}</span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="page-section active-workout-page">
      {activeWorkout ? (
        <>
          <WorkoutHeader
            title={activeWorkout.title}
            elapsedClock={elapsedClock}
            isResting={isResting}
            restClock={restClock}
            elapsedLabel={tx(appLanguage, '경과', 'Elapsed')}
            restReadyLabel={tx(appLanguage, '휴식 대기', 'Rest ready')}
            restLabel={tx(appLanguage, '휴식', 'Rest')}
            endRestLabel={tx(appLanguage, '휴식 종료', 'End rest')}
            finishLabel={tx(appLanguage, '운동 종료', 'Finish')}
            onEndRest={stopRest}
            onFinish={() => setFinishConfirmOpen(true)}
          />

          <QuickAddExerciseBar
            title={tx(appLanguage, '운동 추가', 'Add Exercise')}
            searchPlaceholder={tx(appLanguage, '운동 검색', 'Search exercise')}
            browseLabel={tx(appLanguage, '더 보기', 'More')}
            recentLabel={tx(appLanguage, '최근', 'Recent')}
            frequentLabel={tx(appLanguage, '자주 함', 'Frequent')}
            routineLabel={tx(appLanguage, '루틴', 'Routine')}
            routineActionLabel={tx(appLanguage, '오늘 루틴 추가', 'Add routine')}
            searchQuery={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value)
              setExercisePickerOpen(true)
            }}
            onOpenSheet={() => openExercisePicker(searchQuery.trim() ? 'recommended' : 'all')}
            recentExercises={recentExercises}
            frequentExercises={frequentItems}
            canAddProgramDay={canAddProgramDay}
            onAddProgramDay={handleProgramDayAdd}
            onQuickAdd={handleAddExercise}
          />

          {activeWorkout.exercises.length === 0 ? (
            <article className="content-card workout-empty-state">
              <strong>{tx(appLanguage, '운동을 추가하세요', 'Add an exercise')}</strong>
              <button className="inline-action" type="button" onClick={() => openExercisePicker('all')}>
                {tx(appLanguage, '추천 운동', 'Recommended')}
              </button>
            </article>
          ) : null}

          <div className="exercise-stack active-workout-stack">
            {activeWorkout.exercises.map((exercise) => {
          const previousRecord = sets.find((item) => item.exercise === exercise.name)
          const detail = exerciseDetails[exercise.name]
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
          const setPrResults = detectSetPRs(
            exercise.sets.map((setItem) => ({
              weightKg: Number(setItem.weight || 0),
              reps: Number(setItem.reps || 0),
              isCompleted: setItem.completed,
            })),
            previousBest,
          )

          return (
            <div
              key={exercise.id}
              ref={(node) => {
                if (node) {
                  exerciseCardRefs.current[exercise.id] = node
                  return
                }

                delete exerciseCardRefs.current[exercise.id]
              }}
            >
              <WorkoutExerciseCard
                exercise={exercise}
                displayOrder={activeWorkout.exercises.findIndex((item) => item.id === exercise.id) + 1}
                previousLabel={tx(appLanguage, '이전', 'Last')}
                addSetLabel={tx(appLanguage, '세트 추가', 'Add Set')}
                weightPrLabel={tx(appLanguage, '중량 PR', 'Weight PR')}
                volumePrLabel={tx(appLanguage, '볼륨 PR', 'Volume PR')}
                setLabel={tx(appLanguage, '세트', 'Set')}
                weightLabel="kg"
                repsLabel={tx(appLanguage, '횟수', 'Reps')}
                doneLabel={tx(appLanguage, '완료', 'Done')}
                moreLabel={tx(appLanguage, '더보기', 'More')}
                unsetSupersetLabel={tx(appLanguage, '슈퍼세트 해제', 'Unset superset')}
                makeSupersetLabel={tx(appLanguage, '슈퍼세트 지정', 'Make superset')}
                swapLabel={tx(appLanguage, '운동 교체', 'Swap')}
                upLabel={tx(appLanguage, '위로', 'Up')}
                downLabel={tx(appLanguage, '아래로', 'Down')}
                removeLabel={tx(appLanguage, '삭제', 'Remove')}
                noteLabel={tx(appLanguage, '메모', 'Note')}
                notePlaceholder={tx(appLanguage, '메모를 남기세요', 'Add a note')}
                previousRecord={previousRecord}
                prResult={prResult}
                setPrResults={setPrResults}
                workoutCatalog={workoutCatalog}
                updateExerciseName={updateExerciseName}
                addWorkoutSet={addWorkoutSet}
                moveWorkoutSet={moveWorkoutSet}
                removeWorkoutSet={removeWorkoutSet}
                updateWorkoutSet={updateWorkoutSet}
                toggleWorkoutSetComplete={toggleWorkoutSetComplete}
                toggleSuperset={toggleSuperset}
                swapWorkoutExercise={swapWorkoutExercise}
                moveWorkoutExercise={moveWorkoutExercise}
                removeWorkoutExercise={removeWorkoutExercise}
                updateExerciseMeta={updateExerciseMeta}
                detail={detail}
              />
            </div>
          )
            })}
          </div>

          <BottomActionBar
            addLabel={tx(appLanguage, '+ 운동 추가', '+ Add Exercise')}
            finishLabel={tx(appLanguage, '운동 종료', 'Finish Workout')}
            onAddExercise={() => openExercisePicker(searchQuery.trim() ? 'recommended' : 'all')}
            onFinishWorkout={() => setFinishConfirmOpen(true)}
          />

          <ExercisePickerSheet
            open={exercisePickerOpen}
            onClose={() => setExercisePickerOpen(false)}
            title={tx(appLanguage, '운동 선택', 'Pick an exercise')}
            searchResultsTitle={tx(appLanguage, '검색 결과', 'Search results')}
            closeLabel={tx(appLanguage, '닫기', 'Close')}
            searchPlaceholder={tx(appLanguage, '운동명 또는 부위 검색', 'Search by exercise or muscle')}
            tabLabels={[
              ['recent', tx(appLanguage, '최근', 'Recent')],
              ['frequent', tx(appLanguage, '자주 함', 'Frequent')],
              ['recommended', tx(appLanguage, '추천', 'Recommended')],
            ]}
            filtersLabel={tx(appLanguage, '필터', 'Filters')}
            clearLabel={tx(appLanguage, '초기화', 'Clear')}
            openDbLabel={tx(appLanguage, 'DB 열기', 'Open DB')}
            emptyLabel={tx(appLanguage, '운동 없음', 'No exercises')}
            addLabel={tx(appLanguage, '추가', 'Add')}
            muscleGroupLabel={tx(appLanguage, '부위', 'Muscle Group')}
            equipmentLabel={tx(appLanguage, '장비', 'Equipment')}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            pickerTab={pickerTab}
            onTabChange={setPickerTab}
            recentItems={recentItems}
            frequentItems={frequentItems}
            recommendedItems={recommendedItems}
            filteredItems={filteredExercises}
            selectedMuscleGroup={selectedMuscleGroup}
            selectedEquipment={selectedEquipment}
            onMuscleChange={setSelectedMuscleGroup}
            onEquipmentChange={setSelectedEquipment}
            onClearFilters={clearExerciseFilters}
            muscleGroupOptions={muscleGroupOptions}
            equipmentOptions={equipmentOptions}
            onSelectExercise={handleAddExercise}
          />
        </>
      ) : null}

      {finishConfirmOpen ? (
        <>
          <button
            className="workout-finish-backdrop"
            type="button"
            aria-label={tx(appLanguage, '운동 종료 확인 닫기', 'Close finish confirmation')}
            onClick={() => setFinishConfirmOpen(false)}
          />
          <section className="content-card workout-finish-modal" aria-label={tx(appLanguage, '운동 완료 확인', 'Complete workout confirmation')}>
            <div className="workout-finish-copy">
              <h2>{tx(appLanguage, '운동을 완료할까요?', 'Confirm complete?')}</h2>
              <p>{tx(appLanguage, '완료하면 오늘 기록이 저장되고 요약이 바로 보여요.', 'We will save today workout and show your summary right away.')}</p>
            </div>
            <div className="workout-finish-actions">
              <button className="inline-action" type="button" onClick={() => setFinishConfirmOpen(false)}>
                {tx(appLanguage, '취소', 'Cancel')}
              </button>
              <button
                className="inline-action primary-dark"
                type="button"
                onClick={() => {
                  setFinishConfirmOpen(false)
                  const result = finishWorkout()
                  if (!result) {
                    return
                  }
                  setCompletedWorkoutSnapshot(result.finishedWorkout)
                  setCompletedWorkoutSummary(result.summary)
                  setWorkoutSummaryOpen(true)
                }}
              >
                {tx(appLanguage, '완료하기', 'Confirm')}
              </button>
            </div>
          </section>
        </>
      ) : null}

      {workoutSummaryOpen && completedWorkoutSummary ? (
        <>
          <button
            className="workout-finish-backdrop"
            type="button"
            aria-label={tx(appLanguage, '운동 요약 닫기', 'Close workout summary')}
            onClick={closeSummaryFlow}
          />
          <section className="workout-summary-sheet" aria-label={tx(appLanguage, '운동 요약', 'Workout summary')}>
            <div className="workout-summary-fanfare" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="workout-summary-head">
              <span className="card-kicker">{tx(appLanguage, '오늘 운동 완료', 'Workout complete')}</span>
              <h2>{tx(appLanguage, '잘했어요. 오늘 기록이 깔끔하게 저장됐어요.', 'Nice work. Today workout is saved cleanly.')}</h2>
              <p>{completedWorkoutSummary.title}</p>
            </div>

            <div className="workout-summary-stats">
              <div className="summary-grid-block">
                <span>{tx(appLanguage, '운동 시간', 'Duration')}</span>
                <strong>{completedWorkoutSummary.durationMinutes}{tx(appLanguage, '분', ' min')}</strong>
              </div>
              <div className="summary-grid-block">
                <span>{tx(appLanguage, '완료 세트', 'Completed sets')}</span>
                <strong>{completedWorkoutSummary.completedSets}</strong>
              </div>
              <div className="summary-grid-block">
                <span>{tx(appLanguage, '총 볼륨', 'Total volume')}</span>
                <strong>{completedWorkoutSummary.sessionVolume.toLocaleString()} kg</strong>
              </div>
              <div className="summary-grid-block">
                <span>{tx(appLanguage, '오늘 PR', 'Today PR')}</span>
                <strong>{completedWorkoutSummary.prCount}</strong>
              </div>
            </div>

            <div className="workout-summary-highlight">
              <span>{tx(appLanguage, '최고 세트', 'Top set')}</span>
              <strong>{completedWorkoutSummary.topSet}</strong>
            </div>

            <div className="workout-summary-exercises">
              {(completedWorkoutSnapshot?.exercises || []).map((exercise) => {
                const completedSetCount = exercise.sets.filter((setItem) => setItem.completed).length

                if (completedSetCount === 0) {
                  return null
                }

                return (
                  <div key={exercise.id} className="workout-summary-exercise-row">
                    <strong>{exercise.name}</strong>
                    <span>{tx(appLanguage, `${completedSetCount}세트 완료`, `${completedSetCount} sets complete`)}</span>
                  </div>
                )
              })}
            </div>

            <div className="workout-summary-actions">
              <button className="inline-action primary-dark" type="button" onClick={closeSummaryFlow}>
                {tx(appLanguage, '닫기', 'Close')}
              </button>
            </div>
          </section>
        </>
      ) : null}

      {templatePromptOpen ? (
        <>
          <button
            className="workout-finish-backdrop"
            type="button"
            aria-label={tx(appLanguage, '템플릿 저장 확인 닫기', 'Close template save prompt')}
            onClick={finishSummaryFlow}
          />
          <section className="content-card workout-finish-modal" aria-label={tx(appLanguage, '템플릿 저장 확인', 'Template save confirmation')}>
            <div className="workout-finish-copy">
              <h2>{tx(appLanguage, '오늘 운동을 템플릿으로 저장할까요?', 'Save today workout as a template?')}</h2>
              <p>{tx(appLanguage, '즉시 운동 기록으로 시작한 루틴을 다음에도 빠르게 꺼내 쓸 수 있어요.', 'You can reuse this instant workout later with one tap.')}</p>
            </div>
            <div className="workout-finish-actions">
              <button className="inline-action" type="button" onClick={finishSummaryFlow}>
                {tx(appLanguage, '괜찮아요', 'No thanks')}
              </button>
              <button className="inline-action primary-dark" type="button" onClick={handleSaveTemplate}>
                {tx(appLanguage, '템플릿 저장', 'Save template')}
              </button>
            </div>
          </section>
        </>
      ) : null}
    </section>
  )
}

export default TrainWorkoutPage
