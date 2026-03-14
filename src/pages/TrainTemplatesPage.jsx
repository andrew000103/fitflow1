import { useNavigate, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'

function TrainTemplatesPage() {
  const { quickTemplates, startWorkout } = useOutletContext()
  const navigate = useNavigate()

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Train / Templates"
        title="Templates"
        description="템플릿을 고르고 바로 운동을 시작할 수 있습니다."
      />

      <div className="train-action-grid">
        {quickTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            className="train-action-card"
            onClick={() => {
              startWorkout('template', template)
              navigate('/train/workout')
            }}
          >
            <span className="train-action-icon" aria-hidden="true">
              🧩
            </span>
            <div className="train-action-copy">
              <strong>{template.label}</strong>
              <span>{template.exercises.slice(0, 3).join(' · ')}</span>
            </div>
            <span className="train-action-cta">Use</span>
          </button>
        ))}
      </div>

      <div className="sticky-cta-bar">
        <button className="inline-action" type="button" onClick={() => navigate('/train')}>
          Back
        </button>
        <button
          className="inline-action primary-dark"
          type="button"
          onClick={() => {
            startWorkout('template', quickTemplates[0])
            navigate('/train/workout')
          }}
        >
          Quick start
        </button>
      </div>
    </section>
  )
}

export default TrainTemplatesPage
