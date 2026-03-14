function QuickAddExerciseBar({
  title,
  searchPlaceholder,
  browseLabel,
  recentLabel,
  frequentLabel,
  routineLabel,
  routineActionLabel,
  searchQuery,
  onSearchChange,
  onOpenSheet,
  recentExercises,
  frequentExercises,
  canAddProgramDay,
  onAddProgramDay,
  onQuickAdd,
}) {
  return (
    <article className="content-card quick-add-workout-card">
      <div className="quick-add-workout-head">
        <div>
          <h2>{title}</h2>
        </div>
        <button className="inline-action" type="button" onClick={onOpenSheet}>
          {browseLabel}
        </button>
      </div>

      <label className="quick-add-search">
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          onFocus={onOpenSheet}
          placeholder={searchPlaceholder}
        />
      </label>

      {recentExercises.length > 0 ? (
        <div className="quick-add-section">
          <strong>{recentLabel}</strong>
          <div className="quick-add-chip-row">
            {recentExercises.map((exercise) => (
              <button key={exercise.exercise} className="pill-tag" type="button" onClick={() => onQuickAdd(exercise.exercise)}>
                {exercise.exercise}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {frequentExercises.length > 0 ? (
        <div className="quick-add-section">
          <strong>{frequentLabel}</strong>
          <div className="quick-add-chip-row">
            {frequentExercises.map((exercise) => (
              <button key={exercise.name} className="pill-tag" type="button" onClick={() => onQuickAdd(exercise.name)}>
                {exercise.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {canAddProgramDay ? (
        <div className="quick-add-section">
          <strong>{routineLabel}</strong>
          <div className="quick-add-chip-row">
            <button className="pill-tag accent" type="button" onClick={onAddProgramDay}>
              {routineActionLabel}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
}

export default QuickAddExerciseBar
