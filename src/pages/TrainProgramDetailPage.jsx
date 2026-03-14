import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'

function TrainProgramDetailPage() {
  const { programId } = useParams()
  const { programs, startWorkout } = useOutletContext()
  const navigate = useNavigate()
  const program = programs.find((item) => item.id === programId) || programs[0]

  if (!program) {
    return null
  }

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Train / Program"
        title={program.name}
        description="프로그램 상세, week/day 정보, 운동 목록과 시작 액션을 확인합니다."
      />

      <div className="card-grid split">
        <article className="content-card">
          <span className="card-kicker">Program detail</span>
          <div className="summary-grid tight">
            <div>
              <span>Week</span>
              <strong>{program.week}</strong>
            </div>
            <div>
              <span>Day</span>
              <strong>{program.day}</strong>
            </div>
            <div>
              <span>Exercises</span>
              <strong>{program.exercises.length}</strong>
            </div>
            <div>
              <span>Streak</span>
              <strong>{program.streakWeeks}주</strong>
            </div>
          </div>
          <div className="program-chip-list">
            <button
              className="inline-action primary-dark"
              type="button"
              onClick={() => {
                startWorkout('program', program)
                navigate('/train/workout')
              }}
            >
              Start workout
            </button>
            <Link className="inline-action" to="/train/create-program">
              Edit / Manage
            </Link>
          </div>
        </article>

        <article className="content-card">
          <span className="card-kicker">Exercise preview</span>
          <div className="simple-list">
            {program.exercises.map((exercise) => (
              <div className="simple-row" key={exercise.name}>
                <strong>{exercise.name}</strong>
                <span>{exercise.sets} sets</span>
                <span>{exercise.topSet}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="sticky-cta-bar">
        <Link className="inline-action" to="/train/create-program">
          Manage
        </Link>
        <button
          className="inline-action primary-dark"
          type="button"
          onClick={() => {
            startWorkout('program', program)
            navigate('/train/workout')
          }}
        >
          Start workout
        </button>
      </div>
    </section>
  )
}

export default TrainProgramDetailPage
