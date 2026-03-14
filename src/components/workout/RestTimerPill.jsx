function RestTimerPill({ elapsedClock, isResting, restClock, elapsedLabel, restReadyLabel, restLabel }) {
  return (
    <div className="active-workout-meta-row">
      <span className="status-chip active">{elapsedLabel} {elapsedClock}</span>
      <span className={isResting ? 'status-chip active' : 'status-chip'}>
        {isResting ? `${restLabel} ${restClock}` : restReadyLabel}
      </span>
    </div>
  )
}

export default RestTimerPill
