import RestTimerPill from './RestTimerPill.jsx'

function WorkoutHeader({
  title,
  elapsedClock,
  isResting,
  restClock,
  elapsedLabel,
  restReadyLabel,
  restLabel,
  finishLabel,
  endRestLabel,
  onEndRest,
  onFinish,
}) {
  return (
    <header className="active-workout-header">
      <div className="active-workout-topline">
        <span className="active-workout-clock">{elapsedClock}</span>
        <div className="active-workout-header-actions">
          {isResting ? (
            <button className="inline-action workout-rest-stop" type="button" onClick={onEndRest}>
              {endRestLabel}
            </button>
          ) : null}
          <button className="inline-action workout-header-finish" type="button" onClick={onFinish}>
            {finishLabel}
          </button>
        </div>
      </div>

      <div className="active-workout-title-group">
        <h1>{title}</h1>
        <span>{elapsedLabel}</span>
      </div>

      <div className="active-workout-status-row">
        <RestTimerPill
          elapsedClock={elapsedClock}
          isResting={isResting}
          restClock={restClock}
          elapsedLabel={elapsedLabel}
          restReadyLabel={restReadyLabel}
          restLabel={restLabel}
        />
      </div>
    </header>
  )
}

export default WorkoutHeader
