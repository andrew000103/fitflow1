import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'

function TrainProgramBuilderPage() {
  const { createProgram, categoryLabels, workoutCatalog, programs } = useOutletContext()
  const navigate = useNavigate()
  const [programName, setProgramName] = useState('')
  const [programWeek, setProgramWeek] = useState('1')
  const [programDay, setProgramDay] = useState('1')
  const [programCategory, setProgramCategory] = useState('chest')
  const [programExercise, setProgramExercise] = useState(workoutCatalog.chest[0])
  const [programExercises, setProgramExercises] = useState(['Bench Press'])

  function handleProgramCategoryChange(nextCategory) {
    setProgramCategory(nextCategory)
    setProgramExercise(workoutCatalog[nextCategory][0])
  }

  function addProgramExercise() {
    if (programExercises.includes(programExercise)) {
      return
    }
    setProgramExercises((current) => [...current, programExercise])
  }

  function removeProgramExercise(exerciseName) {
    setProgramExercises((current) => current.filter((item) => item !== exerciseName))
  }

  function handleCreateProgram(event) {
    event.preventDefault()
    if (!programName || programExercises.length === 0) {
      return
    }
    createProgram({
      name: programName,
      week: Number(programWeek),
      day: Number(programDay),
      exercises: programExercises,
    })
    navigate('/train')
  }

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Train / Create Program"
        title="Create Program"
        description="필요한 정보만 입력해서 프로그램을 빠르게 만듭니다."
      />

      <div className="card-grid split">
        <article className="content-card">
          <form id="train-program-builder-form" className="stack-form" onSubmit={handleCreateProgram}>
            <label className="field-label">
              Program name
              <input value={programName} onChange={(event) => setProgramName(event.target.value)} placeholder="예: Push Pull Legs Builder" />
            </label>
            <div className="compact-grid">
              <label className="field-label">
                Week
                <input value={programWeek} onChange={(event) => setProgramWeek(event.target.value)} inputMode="numeric" />
              </label>
              <label className="field-label">
                Day
                <input value={programDay} onChange={(event) => setProgramDay(event.target.value)} inputMode="numeric" />
              </label>
            </div>
            <div className="compact-grid">
              <label className="field-label">
                Category
                <select value={programCategory} onChange={(event) => handleProgramCategoryChange(event.target.value)}>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Exercise
                <select value={programExercise} onChange={(event) => setProgramExercise(event.target.value)}>
                  {workoutCatalog[programCategory].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button className="inline-action" type="button" onClick={addProgramExercise}>
              Add exercise
            </button>
            <div className="program-chip-list">
              {programExercises.map((item) => (
                <button key={item} type="button" className="template-chip removable" onClick={() => removeProgramExercise(item)}>
                  <strong>{item}</strong>
                  <span>Tap to remove</span>
                </button>
              ))}
            </div>
            <button className="inline-action primary-dark" type="submit">
              Save program
            </button>
          </form>
        </article>

        <article className="content-card">
          <span className="card-kicker">My programs</span>
          <div className="simple-list">
            {programs.map((program) => (
              <div className="simple-row" key={program.id}>
                <strong>{program.name}</strong>
                <span>Week {program.week} · Day {program.day}</span>
                <span>{program.exercises.length} exercises</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="sticky-cta-bar">
        <button className="inline-action" type="button" onClick={() => navigate('/train')}>
          Cancel
        </button>
        <button className="inline-action primary-dark" type="submit" form="train-program-builder-form">
          Save program
        </button>
      </div>
    </section>
  )
}

export default TrainProgramBuilderPage
