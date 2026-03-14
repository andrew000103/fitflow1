import { useRef, useState } from 'react'

function SetRow({
  exerciseId,
  setItem,
  index,
  prResult,
  setLabel,
  weightLabel,
  repsLabel,
  doneLabel,
  onWeightChange,
  onRepsChange,
  onToggleDone,
  onMoveUp,
  onMoveDown,
  onRemove,
  moveUpLabel,
  moveDownLabel,
  removeLabel,
}) {
  const hasPR = Boolean(prResult?.isWeightPR || prResult?.isVolumePR)
  const [offset, setOffset] = useState(0)
  const touchStartX = useRef(null)
  const ACTION_WIDTH = 152

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

    setOffset(offset <= -72 ? -ACTION_WIDTH : 0)
    touchStartX.current = null
  }

  function closeActions() {
    setOffset(0)
  }

  return (
    <div className="swipe-reveal-row">
      <div className={offset !== 0 ? 'swipe-reveal-actions visible' : 'swipe-reveal-actions'}>
        <button className="swipe-action" type="button" onClick={() => { closeActions(); onMoveUp() }}>
          {moveUpLabel}
        </button>
        <button className="swipe-action" type="button" onClick={() => { closeActions(); onMoveDown() }}>
          {moveDownLabel}
        </button>
        <button className="swipe-action danger" type="button" onClick={() => { closeActions(); onRemove() }}>
          {removeLabel}
        </button>
      </div>
      <div
        className="swipe-reveal-content"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={setItem.completed ? 'set-row minimal completed' : 'set-row minimal'}>
          <div className={hasPR ? 'set-row-index pr' : 'set-row-index'}>
            {hasPR ? 'PR' : index + 1}
          </div>
          <div className="set-row-previous">{setItem.previous || '-'}</div>
          <div className="set-row-input-wrap">
            <input
              aria-label={`${weightLabel} ${index + 1}`}
              value={setItem.weight}
              inputMode="decimal"
              onChange={onWeightChange}
            />
          </div>
          <div className="set-row-input-wrap">
            <input
              aria-label={`${repsLabel} ${index + 1}`}
              value={setItem.reps}
              inputMode="numeric"
              onChange={onRepsChange}
            />
          </div>
          <button
            className={setItem.completed ? 'set-row-check completed' : 'set-row-check'}
            type="button"
            onClick={onToggleDone}
            aria-label={doneLabel}
          >
            {setItem.completed ? '✓' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SetRow
