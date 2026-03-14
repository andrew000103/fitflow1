import { Link } from 'react-router-dom'

function ExercisePickerSheet({
  open,
  onClose,
  title,
  searchResultsTitle,
  closeLabel,
  searchPlaceholder,
  tabLabels,
  filtersLabel,
  clearLabel,
  openDbLabel,
  emptyLabel,
  addLabel,
  muscleGroupLabel,
  equipmentLabel,
  searchQuery,
  onSearchChange,
  pickerTab,
  onTabChange,
  recentItems,
  frequentItems,
  recommendedItems,
  filteredItems,
  selectedMuscleGroup,
  selectedEquipment,
  onMuscleChange,
  onEquipmentChange,
  onClearFilters,
  muscleGroupOptions,
  equipmentOptions,
  onSelectExercise,
}) {
  if (!open) {
    return null
  }

  const items = searchQuery.trim()
    ? filteredItems
    : pickerTab === 'recent'
      ? recentItems
      : pickerTab === 'frequent'
        ? frequentItems
        : pickerTab === 'recommended'
          ? recommendedItems
          : filteredItems

  return (
    <>
      <button className="workout-sheet-backdrop" type="button" aria-label="Close exercise picker" onClick={onClose} />
      <section className="workout-sheet" aria-label="Exercise picker">
        <div className="workout-sheet-handle" />
        <div className="workout-sheet-head">
          <div>
            <h2>{searchQuery.trim() ? searchResultsTitle : title}</h2>
          </div>
          <button className="inline-action" type="button" onClick={onClose}>
            {closeLabel}
          </button>
        </div>

        <label className="quick-add-search">
          <input
            autoFocus
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>

        <div className="workout-picker-tabs">
          {tabLabels.map(([key, label]) => (
            <button
              key={key}
              className={pickerTab === key && !searchQuery.trim() ? 'inline-action active-soft' : 'inline-action'}
              type="button"
              onClick={() => onTabChange(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <details className="drawer-card workout-picker-filters">
          <summary>{filtersLabel}</summary>
          <div className="drawer-card-body">
            <div className="compact-grid">
              <label className="field-label">
                {muscleGroupLabel}
                <select value={selectedMuscleGroup} onChange={(event) => onMuscleChange(event.target.value)}>
                  {muscleGroupOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                {equipmentLabel}
                <select value={selectedEquipment} onChange={(event) => onEquipmentChange(event.target.value)}>
                  {equipmentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="filter-row">
              <button className="inline-action" type="button" onClick={onClearFilters}>
                {clearLabel}
              </button>
              <Link className="inline-action" to="/train/exercises">
                {openDbLabel}
              </Link>
            </div>
          </div>
        </details>

        <div className="workout-sheet-list">
          {items.length > 0 ? (
            items.map((exercise) => (
              <button
                className="database-row workout-database-row"
                key={exercise.name}
                type="button"
                onClick={() => onSelectExercise(exercise.name)}
              >
                <div className="database-icon">{exercise.icon}</div>
                <div className="database-copy">
                  <strong>{exercise.name}</strong>
                  <span>
                    {exercise.target} · {exercise.secondary}
                  </span>
                  <span>{exercise.equipment}</span>
                </div>
                <span className="workout-picker-add">{addLabel}</span>
              </button>
            ))
          ) : (
            <div className="mini-panel">{emptyLabel}</div>
          )}
        </div>
      </section>
    </>
  )
}

export default ExercisePickerSheet
