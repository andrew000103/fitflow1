function BodyMapCard({ title, subtitle, children }) {
  return (
    <div className="bodymap-card">
      <div className="feed-head">
        <strong>{title}</strong>
        <span className="mini-caption">{subtitle}</span>
      </div>
      <div className="bodymap-frame">{children}</div>
    </div>
  )
}

export default BodyMapCard
