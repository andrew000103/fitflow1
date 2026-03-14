import { Link } from 'react-router-dom'

function TrainActionCard({ to, title, subtitle, icon, cta = 'Open', onClick }) {
  if (onClick) {
    return (
      <button type="button" className="train-action-card" onClick={onClick}>
        <span className="train-action-icon" aria-hidden="true">
          {icon}
        </span>
        <div className="train-action-copy">
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
        <span className="train-action-cta">{cta}</span>
      </button>
    )
  }

  return (
    <Link className="train-action-card" to={to}>
      <span className="train-action-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="train-action-copy">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <span className="train-action-cta">{cta}</span>
    </Link>
  )
}

export default TrainActionCard
