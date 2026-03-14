function MuscleLegend() {
  return (
    <div className="muscle-legend">
      <span className="card-kicker">Fatigue scale</span>
      <div className="muscle-legend-bar">
        <span style={{ background: '#e5e7eb' }} />
        <span style={{ background: '#fde68a' }} />
        <span style={{ background: '#facc15' }} />
        <span style={{ background: '#f59e0b' }} />
        <span style={{ background: '#d97706' }} />
      </div>
      <div className="muscle-legend-labels">
        <span>낮음</span>
        <span>높음</span>
      </div>
    </div>
  )
}

export default MuscleLegend

