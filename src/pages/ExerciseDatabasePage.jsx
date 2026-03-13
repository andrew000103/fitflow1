import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { equipmentOptions, muscleGroupOptions } from '../data/fitnessData.js'

function ExerciseDatabasePage() {
  const { exerciseDatabase, sets, createCustomExercise } = useOutletContext()
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState('All')
  const [equipmentFilter, setEquipmentFilter] = useState('All')
  const [sortBy, setSortBy] = useState('recent')
  const [detailName, setDetailName] = useState(null)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('chest')
  const [customTarget, setCustomTarget] = useState('Chest')
  const [customSecondary, setCustomSecondary] = useState('Triceps')
  const [customEquipment, setCustomEquipment] = useState('Dumbbell')
  const [customNote, setCustomNote] = useState('')
  const [customVideo, setCustomVideo] = useState('')

  const usageMap = useMemo(
    () =>
      sets.reduce((acc, item) => {
        acc[item.exercise] = (acc[item.exercise] || 0) + 1
        return acc
      }, {}),
    [sets],
  )

  const filteredExercises = useMemo(() => {
    let list = exerciseDatabase.filter((exercise) => {
      const matchesSearch =
        !search ||
        exercise.name.toLowerCase().includes(search.toLowerCase()) ||
        exercise.target.toLowerCase().includes(search.toLowerCase())
      const matchesMuscle = muscleFilter === 'All' || exercise.target === muscleFilter
      const matchesEquipment = equipmentFilter === 'All' || exercise.equipment === equipmentFilter
      return matchesSearch && matchesMuscle && matchesEquipment
    })

    if (sortBy === 'frequent') {
      list = [...list].sort((left, right) => (usageMap[right.name] || 0) - (usageMap[left.name] || 0))
    } else if (sortBy === 'name') {
      list = [...list].sort((left, right) => left.name.localeCompare(right.name))
    } else {
      list = [...list].sort((left, right) => (usageMap[right.name] || 0) - (usageMap[left.name] || 0))
    }

    return list
  }, [equipmentFilter, exerciseDatabase, muscleFilter, search, sortBy, usageMap])

  const selectedDetail = filteredExercises.find((exercise) => exercise.name === detailName)

  function handleCreateExercise(event) {
    event.preventDefault()
    if (!customName) {
      return
    }
    createCustomExercise({
      name: customName,
      category: customCategory,
      target: customTarget,
      secondary: customSecondary,
      equipment: customEquipment,
      icon: customName.slice(0, 2).toUpperCase(),
      note: customNote,
      video: customVideo,
    })
    setCustomName('')
    setCustomNote('')
    setCustomVideo('')
  }

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Exercise Database"
        title="운동 검색 스트레스를 줄이고 빠르게 추가하는 데이터베이스"
        description="근육군, 장비, 검색, 정렬을 통해 원하는 운동을 빠르게 찾고, 직접 커스텀 운동도 등록할 수 있습니다."
      />

      <article className="content-card">
        <div className="stack-form">
          <label className="field-label">
            Search
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="운동명 또는 타겟 부위를 검색" />
          </label>
          <div className="compact-grid">
            <label className="field-label">
              Muscle Group
              <select value={muscleFilter} onChange={(event) => setMuscleFilter(event.target.value)}>
                {muscleGroupOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Equipment
              <select value={equipmentFilter} onChange={(event) => setEquipmentFilter(event.target.value)}>
                {equipmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="filter-row">
            {[
              ['recent', '최근'],
              ['frequent', '자주 한 운동'],
              ['name', '이름순'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={sortBy === value ? 'inline-action active-soft' : 'inline-action'}
                onClick={() => setSortBy(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </article>

      <div className="card-grid split">
        <article className="content-card">
          <span className="card-kicker">Exercise list</span>
          <div className="database-list">
            {filteredExercises.map((exercise) => (
              <div className="database-row" key={exercise.name}>
                <div className="database-icon">{exercise.icon}</div>
                <div className="database-copy">
                  <strong>{exercise.name}</strong>
                  <span>
                    {exercise.target} · {exercise.secondary}
                  </span>
                  <span>{usageMap[exercise.name] || 0} times</span>
                </div>
                <button className="inline-action" type="button" onClick={() => setDetailName(exercise.name)}>
                  Info
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <span className="card-kicker">Exercise info</span>
          {selectedDetail ? (
            <div className="stack-form">
              <h2>{selectedDetail.name}</h2>
              <span className="pill-tag">{selectedDetail.target}</span>
              <p>보조 부위: {selectedDetail.secondary}</p>
              <p>장비: {selectedDetail.equipment}</p>
              <div className="mini-panel">{selectedDetail.note || '메모 없음'}</div>
            </div>
          ) : (
            <p>리스트에서 운동을 선택하면 상세 정보가 표시됩니다.</p>
          )}
        </article>
      </div>

      <article className="content-card">
        <span className="card-kicker">Create new exercise</span>
        <form className="stack-form" onSubmit={handleCreateExercise}>
          <label className="field-label">
            Exercise name
            <input value={customName} onChange={(event) => setCustomName(event.target.value)} />
          </label>
          <div className="compact-grid">
            <label className="field-label">
              Main target
              <select value={customTarget} onChange={(event) => setCustomTarget(event.target.value)}>
                {muscleGroupOptions.filter((option) => option !== 'All').map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Secondary target
              <select value={customSecondary} onChange={(event) => setCustomSecondary(event.target.value)}>
                {muscleGroupOptions.filter((option) => option !== 'All').map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="compact-grid">
            <label className="field-label">
              Category
              <select value={customCategory} onChange={(event) => setCustomCategory(event.target.value)}>
                <option value="chest">가슴</option>
                <option value="shoulders">어깨</option>
                <option value="back">등</option>
                <option value="legs">하체</option>
                <option value="abs">복근</option>
                <option value="arms">팔</option>
              </select>
            </label>
            <label className="field-label">
              Equipment
              <select value={customEquipment} onChange={(event) => setCustomEquipment(event.target.value)}>
                {equipmentOptions.filter((option) => option !== 'All').map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field-label">
            Note
            <textarea rows="3" value={customNote} onChange={(event) => setCustomNote(event.target.value)} />
          </label>
          <label className="field-label">
            Video upload / link
            <input value={customVideo} onChange={(event) => setCustomVideo(event.target.value)} placeholder="유튜브 링크 또는 영상 경로" />
          </label>
          <button className="inline-action primary-dark" type="submit">
            Create New Exercise
          </button>
        </form>
      </article>
    </section>
  )
}

export default ExerciseDatabasePage
