import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'

function createInitialWeeks(sessionsPerWeek) {
  return [
    {
      weekIndex: 1,
      title: 'Week 1',
      days: Array.from({ length: sessionsPerWeek }, (_, index) => ({
        dayIndex: index + 1,
        title: `Day ${index + 1}`,
        focus: '',
        exercises: index === 0 ? ['Bench Press', 'Seated Cable Row'] : [],
      })),
    },
  ]
}

function TrainProgramBuilderPage() {
  const { createProgram, workoutCatalog, programs } = useOutletContext()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Bodybuilding')
  const [difficulty, setDifficulty] = useState('Beginner')
  const [durationWeeks, setDurationWeeks] = useState('4')
  const [sessionsPerWeek, setSessionsPerWeek] = useState('3')
  const [goal, setGoal] = useState('General strength')
  const [visibility, setVisibility] = useState('private')
  const [exerciseInput, setExerciseInput] = useState(workoutCatalog.chest[0])
  const [weeks, setWeeks] = useState(() => createInitialWeeks(3))

  function updateSessionsPerWeek(nextValue) {
    const parsed = Math.max(1, Number(nextValue) || 1)
    setSessionsPerWeek(String(parsed))
    setWeeks(createInitialWeeks(parsed))
  }

  function addExerciseToDay(weekIndex, dayIndex) {
    setWeeks((current) =>
      current.map((week) =>
        week.weekIndex !== weekIndex
          ? week
          : {
              ...week,
              days: week.days.map((day) =>
                day.dayIndex !== dayIndex || day.exercises.includes(exerciseInput)
                  ? day
                  : { ...day, exercises: [...day.exercises, exerciseInput] },
              ),
            },
      ),
    )
  }

  function removeExerciseFromDay(weekIndex, dayIndex, exerciseName) {
    setWeeks((current) =>
      current.map((week) =>
        week.weekIndex !== weekIndex
          ? week
          : {
              ...week,
              days: week.days.map((day) =>
                day.dayIndex !== dayIndex
                  ? day
                  : { ...day, exercises: day.exercises.filter((item) => item !== exerciseName) },
              ),
            },
      ),
    )
  }

  function handleCreateProgram(event) {
    event.preventDefault()
    if (!title.trim()) {
      return
    }

    createProgram({
      title: title.trim(),
      description: description.trim() || '사용자가 직접 만든 프로그램입니다.',
      category,
      difficulty,
      durationWeeks: Number(durationWeeks),
      sessionsPerWeek: Number(sessionsPerWeek),
      goal,
      visibility,
      weeks,
      tags: [category.toLowerCase(), difficulty.toLowerCase()],
    })
    navigate('/train')
  }

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Train / Program Builder"
        title="Create Program"
        description="몇 주짜리 Program을 만들고 공개/비공개를 선택합니다."
      />

      <div className="card-grid split">
        <article className="content-card">
          <form id="train-program-builder-form" className="stack-form" onSubmit={handleCreateProgram}>
            <label className="field-label">
              Program title
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 6-Week Upper Builder" />
            </label>
            <label className="field-label">
              Description
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
            </label>
            <div className="compact-grid">
              <label className="field-label">
                Category
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option>Bodybuilding</option>
                  <option>Powerbuilding</option>
                  <option>Athletic</option>
                  <option>Diet / Cutting</option>
                  <option>General Strength</option>
                  <option>Beginner</option>
                  <option>Home Training</option>
                </select>
              </label>
              <label className="field-label">
                Difficulty
                <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </label>
            </div>
            <div className="compact-grid">
              <label className="field-label">
                Duration weeks
                <input value={durationWeeks} onChange={(event) => setDurationWeeks(event.target.value)} inputMode="numeric" />
              </label>
              <label className="field-label">
                Sessions per week
                <input value={sessionsPerWeek} onChange={(event) => updateSessionsPerWeek(event.target.value)} inputMode="numeric" />
              </label>
            </div>
            <label className="field-label">
              Goal
              <input value={goal} onChange={(event) => setGoal(event.target.value)} />
            </label>
            <label className="field-label">
              Visibility
              <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </label>
          </form>
        </article>

        <article className="content-card">
          <span className="card-kicker">Week 1 builder</span>
          <label className="field-label">
            Exercise pool
            <select value={exerciseInput} onChange={(event) => setExerciseInput(event.target.value)}>
              {Object.values(workoutCatalog).flat().map((exercise) => (
                <option key={exercise} value={exercise}>
                  {exercise}
                </option>
              ))}
            </select>
          </label>
          <div className="simple-list">
            {weeks[0].days.map((day) => (
              <div className="simple-row" key={day.dayIndex}>
                <strong>{day.title}</strong>
                <span>{day.exercises.join(' · ') || 'No exercises yet'}</span>
                <div className="program-chip-list">
                  <button className="inline-action" type="button" onClick={() => addExerciseToDay(1, day.dayIndex)}>
                    Add exercise
                  </button>
                  {day.exercises.map((exercise) => (
                    <button
                      key={exercise}
                      className="template-chip removable"
                      type="button"
                      onClick={() => removeExerciseFromDay(1, day.dayIndex, exercise)}
                    >
                      <strong>{exercise}</strong>
                      <span>Remove</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="content-card">
        <span className="card-kicker">My programs</span>
        <div className="simple-list">
          {programs.map((program) => (
            <div className="simple-row" key={program.id}>
              <strong>{program.title}</strong>
              <span>{program.category} · {program.durationWeeks} weeks · {program.sessionsPerWeek}/week</span>
              <span>{program.visibility}</span>
            </div>
          ))}
        </div>
      </article>

      <div className="sticky-cta-bar">
        <button className="inline-action" type="button" onClick={() => navigate('/train')}>
          Cancel
        </button>
        <button className="inline-action primary-dark" type="submit" form="train-program-builder-form">
          Save Program
        </button>
      </div>
    </section>
  )
}

export default TrainProgramBuilderPage
