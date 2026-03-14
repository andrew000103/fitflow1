import { Link } from 'react-router-dom'
import AppIcon from '../../../components/AppIcon.jsx'

function TrainActionCard({ to, title, subtitle, icon, cta = 'Open', onClick }) {
  if (onClick) {
    return (
      <button type="button" className="train-action-card" onClick={onClick}>
        <span className="train-action-icon" aria-hidden="true">
          <AppIcon name={icon} />
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
        <AppIcon name={icon} />
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
