function BottomActionBar({ addLabel, finishLabel, onAddExercise, onFinishWorkout }) {
  return (
    <div className="sticky-cta-bar workout-bottom-bar">
      <button className="inline-action workout-bottom-secondary" type="button" onClick={onAddExercise}>
        {addLabel}
      </button>
      <button className="inline-action primary-dark workout-bottom-primary" type="button" onClick={onFinishWorkout}>
        {finishLabel}
      </button>
    </div>
  )
}

export default BottomActionBar
