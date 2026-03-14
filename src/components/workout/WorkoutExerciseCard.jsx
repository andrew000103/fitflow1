import { useRef, useState } from 'react'

import SetRow from './SetRow.jsx'

function WorkoutExerciseCard({
  exercise,
  displayOrder,
  previousLabel,
  addSetLabel,
  weightPrLabel,
  volumePrLabel,
  setLabel,
  weightLabel,
  repsLabel,
  doneLabel,
  moreLabel,
  unsetSupersetLabel,
  makeSupersetLabel,
  swapLabel,
  upLabel,
  downLabel,
  removeLabel,
  noteLabel,
  notePlaceholder,
  previousRecord,
  prResult,
  setPrResults,
  workoutCatalog,
  updateExerciseName,
  addWorkoutSet,
  updateWorkoutSet,
  toggleWorkoutSetComplete,
  toggleSuperset,
  swapWorkoutExercise,
  moveWorkoutExercise,
  moveWorkoutSet,
  removeWorkoutSet,
  removeWorkoutExercise,
  updateExerciseMeta,
  detail,
}) {
  const [offset, setOffset] = useState(0)
  const touchStartX = useRef(null)
  const ACTION_WIDTH = 168

  function handleTouchStart(event) {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  function handleTouchMove(event) {
    if (touchStartX.current === null) {
      return
    }

    const currentX = event.touches[0]?.clientX ?? touchStartX.current
    const deltaX = currentX - touchStartX.current
    if (deltaX > 18) {
      setOffset(0)
      return
    }

    setOffset(Math.max(-ACTION_WIDTH, deltaX))
  }

  function handleTouchEnd() {
    if (touchStartX.current === null) {
      return
    }

    setOffset(offset <= -84 ? -ACTION_WIDTH : 0)
    touchStartX.current = null
  }

  function closeActions() {
    setOffset(0)
  }

  return (
    <div className="swipe-reveal-row exercise-swipe-row">
      <div className={offset !== 0 ? 'swipe-reveal-actions visible exercise-actions' : 'swipe-reveal-actions exercise-actions'}>
        <button className="swipe-action" type="button" onClick={() => { closeActions(); moveWorkoutExercise(exercise.id, 'up') }}>
          {upLabel}
        </button>
        <button className="swipe-action" type="button" onClick={() => { closeActions(); moveWorkoutExercise(exercise.id, 'down') }}>
          {downLabel}
        </button>
        <button className="swipe-action danger" type="button" onClick={() => { closeActions(); removeWorkoutExercise(exercise.id) }}>
          {removeLabel}
        </button>
      </div>
      <article
        className="workout-exercise-card swipe-reveal-content"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="exercise-card-head">
          <div>
            <div className="exercise-title-row">
              <span className="exercise-order">{displayOrder}</span>
              <select className="exercise-name-select minimal" value={exercise.name} onChange={(event) => updateExerciseName(exercise.id, event.target.value)}>
                {workoutCatalog[exercise.category].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="inline-action workout-add-set-button" type="button" onClick={() => addWorkoutSet(exercise.id)}>
            {addSetLabel}
          </button>
        </div>

        {prResult.isMaxWeightPR || prResult.isExerciseVolumePR ? (
          <div className="exercise-pr-row">
            {prResult.isMaxWeightPR ? <span className="pill-tag accent">{weightPrLabel}</span> : null}
            {prResult.isExerciseVolumePR ? <span className="pill-tag accent">{volumePrLabel}</span> : null}
          </div>
        ) : null}

        <div className="workout-set-header">
          <span>{setLabel}</span>
          <span>{previousLabel}</span>
          <span>{weightLabel}</span>
          <span>{repsLabel}</span>
          <span>{doneLabel}</span>
        </div>

        <div className="set-list">
          {exercise.sets.map((setItem, index) => (
            <SetRow
              key={setItem.id}
              exerciseId={exercise.id}
              setItem={setItem}
              index={index}
              prResult={setPrResults?.[index]}
              setLabel={setLabel}
              previousLabel={previousLabel}
              weightLabel={weightLabel}
              repsLabel={repsLabel}
              doneLabel={doneLabel}
              moveUpLabel={upLabel}
              moveDownLabel={downLabel}
              removeLabel={removeLabel}
              onWeightChange={(event) => updateWorkoutSet(exercise.id, setItem.id, 'weight', event.target.value)}
              onRepsChange={(event) => updateWorkoutSet(exercise.id, setItem.id, 'reps', event.target.value)}
              onToggleDone={() => toggleWorkoutSetComplete(exercise.id, setItem.id)}
              onMoveUp={() => moveWorkoutSet(exercise.id, setItem.id, 'up')}
              onMoveDown={() => moveWorkoutSet(exercise.id, setItem.id, 'down')}
              onRemove={() => removeWorkoutSet(exercise.id, setItem.id)}
            />
          ))}
        </div>

        <details className="workout-advanced">
          <summary>{moreLabel}</summary>
          <div className="workout-advanced-body">
            <div className="exercise-card-tools">
              <button className="inline-action" type="button" onClick={() => toggleSuperset(exercise.id)}>
                {exercise.supersetId ? unsetSupersetLabel : makeSupersetLabel}
              </button>
              <button className="inline-action" type="button" onClick={() => swapWorkoutExercise(exercise.id)}>
                {swapLabel}
              </button>
              <button className="inline-action" type="button" onClick={() => moveWorkoutExercise(exercise.id, 'up')}>
                {upLabel}
              </button>
              <button className="inline-action" type="button" onClick={() => moveWorkoutExercise(exercise.id, 'down')}>
                {downLabel}
              </button>
              <button className="inline-action" type="button" onClick={() => removeWorkoutExercise(exercise.id)}>
                {removeLabel}
              </button>
            </div>

            <label className="field-label">
              {noteLabel}
              <textarea
                rows="2"
                value={exercise.note}
                onChange={(event) => updateExerciseMeta(exercise.id, 'note', event.target.value)}
                placeholder={detail?.description || notePlaceholder}
              />
            </label>
          </div>
        </details>
      </article>
    </div>
  )
}

export default WorkoutExerciseCard
