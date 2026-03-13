import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  categoryLabels,
  exerciseDatabaseSeed,
  foodSuggestions,
  initialMeals,
  initialPosts,
  initialSessions,
  initialSets,
  programs as initialPrograms,
  quickTemplates,
  weeklyData,
  workoutCatalog,
} from '../data/fitnessData.js'

const navigation = [
  { to: '/community', label: 'Community' },
  { to: '/history', label: 'History' },
  { to: '/train', label: 'Train' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/profile', label: 'Profile' },
]

function loadPersistedState() {
  if (typeof window === 'undefined') {
    return {}
  }

  const raw = window.localStorage.getItem('fitflow-dashboard-state')
  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function DashboardLayout() {
  const [persistedState] = useState(() => loadPersistedState())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [goal, setGoal] = useState(persistedState.goal || 'maintain')
  const [steps, setSteps] = useState(persistedState.steps || 11284)
  const [timeLeft, setTimeLeft] = useState(0)
  const [sets, setSets] = useState(persistedState.sets || initialSets)
  const [meals, setMeals] = useState(persistedState.meals || initialMeals)
  const [posts, setPosts] = useState(persistedState.posts || initialPosts)
  const [programs, setPrograms] = useState(persistedState.programs || initialPrograms)
  const [exerciseDatabase, setExerciseDatabase] = useState(
    persistedState.exerciseDatabase || exerciseDatabaseSeed,
  )
  const [sessions, setSessions] = useState(persistedState.sessions || initialSessions)
  const [activeWorkout, setActiveWorkout] = useState(null)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [lastWorkoutSummary, setLastWorkoutSummary] = useState(
    persistedState.lastWorkoutSummary || null,
  )
  const currentProgram = programs[0]

  useEffect(() => {
    window.localStorage.setItem(
      'fitflow-dashboard-state',
      JSON.stringify({
        goal,
        steps,
        sets,
        meals,
        posts,
        programs,
        exerciseDatabase,
        sessions,
        lastWorkoutSummary,
      }),
    )
  }, [exerciseDatabase, goal, lastWorkoutSummary, meals, posts, programs, sessions, sets, steps])

  useEffect(() => {
    if (timeLeft <= 0) {
      return undefined
    }
    const timer = window.setInterval(() => {
      setTimeLeft((current) => (current > 0 ? current - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [timeLeft])

  useEffect(() => {
    if (!activeWorkout) {
      return undefined
    }
    const timer = window.setInterval(() => {
      setNowTick(Date.now())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [activeWorkout])

  const totalWorkoutCalories = useMemo(
    () => sets.reduce((sum, item) => sum + item.calories, 0),
    [sets],
  )
  const totalVolume = useMemo(() => sets.reduce((sum, item) => sum + item.volume, 0), [sets])
  const consumedCalories = useMemo(() => meals.reduce((sum, item) => sum + item.calories, 0), [meals])
  const totalProtein = useMemo(() => meals.reduce((sum, item) => sum + item.protein, 0), [meals])
  const stepCalories = Math.round(steps * 0.04)
  const baseMetabolism = 1680
  const totalBurn = baseMetabolism + stepCalories + totalWorkoutCalories
  const netCalories = consumedCalories - totalBurn
  const fatigueScore = Math.min(100, Math.round(totalVolume / 18))
  const fatigueLabel = fatigueScore >= 80 ? 'High' : fatigueScore >= 55 ? 'Moderate' : 'Low'
  const recommendedCalories =
    goal === 'diet' ? totalBurn - 350 : goal === 'bulk' ? totalBurn + 280 : totalBurn
  const weeklyWorkoutMinutes = weeklyData.reduce((sum, item) => sum + item.workout, 0)
  const weeklyStepAverage = Math.round(
    weeklyData.reduce((sum, item) => sum + item.steps, 0) / weeklyData.length,
  )
  const streakDays = Math.max(3, Math.min(9, Math.ceil(sets.length / 2)))
  const dominantCategory = Object.entries(
    sets.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.volume
      return acc
    }, {}),
  ).sort(([, a], [, b]) => b - a)[0]?.[0] || 'chest'
  const aiCoach = {
    training:
      fatigueScore >= 80
        ? '오늘은 휴식 또는 상대 피로가 낮은 부위를 추천합니다.'
        : dominantCategory === 'chest'
          ? '가슴 피로가 누적되어 등 또는 하체 루틴으로 균형을 맞추는 편이 좋습니다.'
          : '현재 피로도는 관리 가능한 수준이라 계획한 루틴을 이어가도 됩니다.',
    nutrition:
      goal === 'diet'
        ? '감량 모드에서는 단백질을 유지하면서 저녁 탄수화물을 약간 줄이는 구성이 적절합니다.'
        : goal === 'bulk'
          ? '증량 모드에서는 운동 후 탄수화물과 단백질을 함께 올려 회복과 총섭취를 확보하세요.'
          : '유지 모드에서는 총 섭취를 권장 칼로리 근처로 맞추는 것이 우선입니다.',
    community:
      goal === 'diet'
        ? '감량 식단 후기와 저칼로리 고단백 피드를 우선 노출합니다.'
        : goal === 'bulk'
          ? '벌크업 식단, 고중량 탑셋 공유, 상체 볼륨 루틴 콘텐츠를 우선 노출합니다.'
          : '유지 단계에서는 회복 팁, 균형 식단, 중간 강도 루틴 콘텐츠를 우선 노출합니다.',
  }

  function logSet({ category, exercise, reps, weight, restSeconds }) {
    const volume = reps * weight
    const calories = Math.max(12, Math.round(reps * weight * 0.08))
    setSets((current) => [
      {
        id: Date.now(),
        category,
        exercise,
        reps,
        weight,
        volume,
        calories,
        createdAt: 'Just now',
      },
      ...current,
    ])
    setTimeLeft(restSeconds)
  }

  function createWorkoutExercise(name, category, previousSet) {
    return {
      id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category,
      name,
      note: '',
      sets: [
        {
          id: `${name}-set-1-${Math.random().toString(36).slice(2, 7)}`,
          previous: previousSet ? `${previousSet.weight}kg x ${previousSet.reps}` : '-',
          weight: previousSet?.weight ? String(previousSet.weight) : '',
          reps: previousSet?.reps ? String(previousSet.reps) : '',
          completed: false,
          logged: false,
        },
      ],
    }
  }

  function findCategoryByExercise(exerciseName) {
    return (
      exerciseDatabase.find((item) => item.name === exerciseName)?.category ||
      Object.entries(workoutCatalog).find(([, exercises]) => exercises.includes(exerciseName))?.[0] ||
      'chest'
    )
  }

  function latestRecordForExercise(exerciseName) {
    return sets.find((item) => item.exercise === exerciseName)
  }

  function startWorkout(mode, payload = {}) {
    let exerciseNames = []
    let title = 'Empty Workout'
    let source = mode

    if (mode === 'program') {
      title = payload.name
      exerciseNames = payload.exercises.map((item) => item.name)
    } else if (mode === 'template') {
      title = `${payload.label} Template`
      exerciseNames = payload.exercises
    } else if (mode === 'recent') {
      title = 'Recent Workout Reloaded'
      exerciseNames = sets.slice(0, 3).map((item) => item.exercise)
    }

    const exerciseList = exerciseNames.map((exerciseName) =>
      createWorkoutExercise(
        exerciseName,
        findCategoryByExercise(exerciseName),
        latestRecordForExercise(exerciseName),
      ),
    )

    setActiveWorkout({
      id: `${mode}-${Date.now()}`,
      source,
      title,
      note: '',
      startedAt: Date.now(),
      exercises: exerciseList,
    })
    setLastWorkoutSummary(null)
  }

  function addExerciseToWorkout(category) {
    const defaultExercise = workoutCatalog[category][0]
    setActiveWorkout((current) => {
      if (!current) {
        return current
      }
      return {
        ...current,
        exercises: [
          ...current.exercises,
          createWorkoutExercise(defaultExercise, category, latestRecordForExercise(defaultExercise)),
        ],
      }
    })
  }

  function moveWorkoutExercise(exerciseId, direction) {
    setActiveWorkout((current) => {
      if (!current) {
        return current
      }
      const index = current.exercises.findIndex((exercise) => exercise.id === exerciseId)
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (index < 0 || targetIndex < 0 || targetIndex >= current.exercises.length) {
        return current
      }
      const nextExercises = [...current.exercises]
      const [moved] = nextExercises.splice(index, 1)
      nextExercises.splice(targetIndex, 0, moved)
      return { ...current, exercises: nextExercises }
    })
  }

  function updateWorkoutMeta(field, value) {
    setActiveWorkout((current) => (current ? { ...current, [field]: value } : current))
  }

  function updateExerciseMeta(exerciseId, field, value) {
    setActiveWorkout((current) => {
      if (!current) {
        return current
      }
      return {
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise,
        ),
      }
    })
  }

  function swapWorkoutExercise(exerciseId) {
    setActiveWorkout((current) => {
      if (!current) {
        return current
      }
      return {
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) {
            return exercise
          }
          const pool = workoutCatalog[exercise.category]
          const currentIndex = pool.indexOf(exercise.name)
          const nextExerciseName = pool[(currentIndex + 1) % pool.length]
          const previous = latestRecordForExercise(nextExerciseName)
          return {
            ...exercise,
            name: nextExerciseName,
            note: '',
            sets: exercise.sets.map((setItem, index) =>
              index === 0
                ? {
                    ...setItem,
                    previous: previous ? `${previous.weight}kg x ${previous.reps}` : '-',
                    weight: previous?.weight ? String(previous.weight) : setItem.weight,
                    reps: previous?.reps ? String(previous.reps) : setItem.reps,
                  }
                : setItem,
            ),
          }
        }),
      }
    })
  }

  function updateExerciseName(exerciseId, nextExerciseName) {
    setActiveWorkout((current) => {
      if (!current) {
        return current
      }
      return {
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                category: findCategoryByExercise(nextExerciseName),
                name: nextExerciseName,
                sets: exercise.sets.map((setItem, index) =>
                  index === 0
                    ? {
                        ...setItem,
                        previous: latestRecordForExercise(nextExerciseName)
                          ? `${latestRecordForExercise(nextExerciseName).weight}kg x ${latestRecordForExercise(nextExerciseName).reps}`
                          : '-',
                        weight: latestRecordForExercise(nextExerciseName)?.weight
                          ? String(latestRecordForExercise(nextExerciseName).weight)
                          : setItem.weight,
                        reps: latestRecordForExercise(nextExerciseName)?.reps
                          ? String(latestRecordForExercise(nextExerciseName).reps)
                          : setItem.reps,
                      }
                    : setItem,
                ),
              }
            : exercise,
        ),
      }
    })
  }

  function updateWorkoutSet(exerciseId, setId, field, value) {
    setActiveWorkout((current) => {
      if (!current) {
        return current
      }
      return {
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: exercise.sets.map((setItem) =>
                  setItem.id === setId ? { ...setItem, [field]: value } : setItem,
                ),
              }
            : exercise,
        ),
      }
    })
  }

  function addWorkoutSet(exerciseId) {
    setActiveWorkout((current) => {
      if (!current) {
        return current
      }
      return {
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) {
            return exercise
          }
          const lastSet = exercise.sets[exercise.sets.length - 1]
          return {
            ...exercise,
            sets: [
              ...exercise.sets,
              {
                id: `${exercise.id}-set-${exercise.sets.length + 1}`,
                previous: lastSet?.weight && lastSet?.reps ? `${lastSet.weight}kg x ${lastSet.reps}` : '-',
                weight: lastSet?.weight || '',
                reps: lastSet?.reps || '',
                completed: false,
                logged: false,
              },
            ],
          }
        }),
      }
    })
  }

  function toggleSuperset(exerciseId) {
    setActiveWorkout((current) => {
      if (!current) {
        return current
      }
      const index = current.exercises.findIndex((exercise) => exercise.id === exerciseId)
      if (index < 0) {
        return current
      }
      const currentExercise = current.exercises[index]
      const nextExercise = current.exercises[index + 1]
      const nextSupersetId =
        currentExercise.supersetId || nextExercise?.supersetId || `ss-${Date.now()}-${index}`

      return {
        ...current,
        exercises: current.exercises.map((exercise, exerciseIndex) => {
          if (exercise.id === exerciseId) {
            return { ...exercise, supersetId: exercise.supersetId ? null : nextSupersetId }
          }
          if (!currentExercise.supersetId && nextExercise && exerciseIndex === index + 1) {
            return { ...exercise, supersetId: nextSupersetId }
          }
          if (currentExercise.supersetId && exercise.supersetId === currentExercise.supersetId) {
            return { ...exercise, supersetId: null }
          }
          return exercise
        }),
      }
    })
  }

  function toggleWorkoutSetComplete(exerciseId, setId) {
    setActiveWorkout((current) => {
      if (!current) {
        return current
      }
      let logPayload = null
      const nextExercises = current.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise
        }
        return {
          ...exercise,
          sets: exercise.sets.map((setItem) => {
            if (setItem.id !== setId) {
              return setItem
            }
            const nextCompleted = !setItem.completed
            if (nextCompleted && !setItem.logged) {
              const reps = Number(setItem.reps)
              const weight = Number(setItem.weight)
              if (reps > 0 && weight > 0) {
                logPayload = {
                  category: exercise.category,
                  exercise: exercise.name,
                  reps,
                  weight,
                  restSeconds: 90,
                }
              }
            }
            return {
              ...setItem,
              completed: nextCompleted,
              logged: setItem.logged || nextCompleted,
            }
          }),
        }
      })

      if (logPayload) {
        logSet(logPayload)
      }

      return {
        ...current,
        exercises: nextExercises,
      }
    })
  }

  function removeWorkoutExercise(exerciseId) {
    setActiveWorkout((current) =>
      current
        ? {
            ...current,
            exercises: current.exercises.filter((exercise) => exercise.id !== exerciseId),
          }
        : current,
    )
  }

  function finishWorkout() {
    if (!activeWorkout) {
      return
    }
    const completedSets = activeWorkout.exercises.flatMap((exercise) =>
      exercise.sets.filter((setItem) => setItem.completed).map((setItem) => ({
        exercise: exercise.name,
        volume: Number(setItem.weight || 0) * Number(setItem.reps || 0),
        weight: Number(setItem.weight || 0),
        reps: Number(setItem.reps || 0),
        category: exercise.category,
      })),
    )
    const durationMinutes = Math.max(1, Math.round((Date.now() - activeWorkout.startedAt) / 60000))
    const sessionVolume = completedSets.reduce((sum, item) => sum + item.volume, 0)
    const topSet = completedSets.sort((a, b) => b.weight - a.weight)[0]
    const prCount = completedSets.filter((item) => item.weight >= 80).length
    const muscleLoad = completedSets.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.volume
      return acc
    }, {})
    setLastWorkoutSummary({
      title: activeWorkout.title,
      durationMinutes,
      sessionVolume,
      topSet: topSet ? `${topSet.exercise} ${topSet.weight}kg x ${topSet.reps}` : 'No completed sets',
      prCount,
      calories: Math.max(80, Math.round(sessionVolume * 0.08)),
      fatigueDelta: Math.min(24, Math.round(sessionVolume / 120)),
      muscleLoad,
      completedSets: completedSets.length,
    })
    setSessions((current) => [
      {
        id: `session-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        title: activeWorkout.title,
        durationMinutes,
        totalVolume: sessionVolume,
        prCount,
        calories: Math.max(80, Math.round(sessionVolume * 0.08)),
        condition: 'Tracked',
        rpe: Math.min(10, 5 + Math.round(prCount / 2) + Math.round(durationMinutes / 30)),
        note: activeWorkout.note || '운동 종료 후 자동 저장된 세션입니다.',
        exercises: activeWorkout.exercises.map((exercise) => {
          const completed = exercise.sets.filter((setItem) => setItem.completed)
          const bestByWeight = [...completed].sort(
            (left, right) => Number(right.weight || 0) - Number(left.weight || 0),
          )[0]
          const maxVolume = completed.reduce(
            (best, setItem) =>
              Math.max(best, Number(setItem.weight || 0) * Number(setItem.reps || 0)),
            0,
          )
          const estimated1RM = completed.reduce((best, setItem) => {
            const weight = Number(setItem.weight || 0)
            const reps = Number(setItem.reps || 0)
            const estimate = reps > 0 ? Math.round(weight * (1 + reps / 30)) : 0
            return Math.max(best, estimate)
          }, 0)
          return {
            name: exercise.name,
            category: exercise.category,
            setCount: completed.length,
            bestSet: bestByWeight ? `${bestByWeight.weight}kg x ${bestByWeight.reps}` : '-',
            maxWeight: bestByWeight ? Number(bestByWeight.weight) : 0,
            maxVolume,
            estimated1RM,
            timeline: completed.map((setItem) => ({
              previous: setItem.previous,
              weight: Number(setItem.weight || 0),
              reps: Number(setItem.reps || 0),
            })),
          }
        }),
      },
      ...current,
    ])
    setActiveWorkout(null)
    setTimeLeft(0)
  }

  function addMeal({ name, calories, protein }) {
    setMeals((current) => [
      {
        id: Date.now(),
        name,
        calories,
        protein,
        createdAt: 'Just now',
      },
      ...current,
    ])
  }

  function quickAddSuggestedMeal(name) {
    const found = foodSuggestions.find((item) => item.name === name)
    if (!found) {
      return
    }
    addMeal(found)
  }

  function addPost({ title, body }) {
    setPosts((current) => [
      {
        id: Date.now(),
        category: goal,
        title,
        author: 'You',
        body,
        likes: 0,
        comments: 0,
      },
      ...current,
    ])
  }

  function createProgram({ name, week, day, exercises }) {
    setPrograms((current) => [
      {
        id: `program-${Date.now()}`,
        name,
        week,
        day,
        streakWeeks: 0,
        exercises: exercises.map((exerciseName) => {
          const previous = latestRecordForExercise(exerciseName)
          return {
            category: findCategoryByExercise(exerciseName),
            name: exerciseName,
            sets: previous ? 4 : 3,
            topSet: previous ? `${previous.weight}kg x ${previous.reps}` : 'No history',
          }
        }),
      },
      ...current,
    ])
  }

  function createCustomExercise(payload) {
    setExerciseDatabase((current) => [
      {
        id: `custom-${Date.now()}`,
        custom: true,
        ...payload,
      },
      ...current,
    ])
  }

  function likePost(postId) {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)),
    )
  }

  function resetAllData() {
    setGoal('maintain')
    setSteps(11284)
    setTimeLeft(0)
    setSets(initialSets)
    setMeals(initialMeals)
    setPosts(initialPosts)
    setPrograms(initialPrograms)
    setExerciseDatabase(exerciseDatabaseSeed)
    setSessions(initialSessions)
    setActiveWorkout(null)
    setLastWorkoutSummary(null)
    window.localStorage.removeItem('fitflow-dashboard-state')
  }

  const outletContext = {
    goal,
    setGoal,
    steps,
    setSteps,
    timeLeft,
    sets,
    meals,
    posts,
    programs,
    streakDays,
    aiCoach,
    foodSuggestions,
    exerciseDatabase,
    sessions,
    activeWorkout,
    currentProgram,
    quickTemplates,
    categoryLabels,
    workoutCatalog,
    startWorkout,
    addExerciseToWorkout,
    moveWorkoutExercise,
    updateWorkoutMeta,
    updateExerciseMeta,
    updateExerciseName,
    swapWorkoutExercise,
    updateWorkoutSet,
    addWorkoutSet,
    toggleSuperset,
    toggleWorkoutSetComplete,
    removeWorkoutExercise,
    finishWorkout,
    lastWorkoutSummary,
    nowTick,
    logSet,
    addMeal,
    quickAddSuggestedMeal,
    addPost,
    createProgram,
    createCustomExercise,
    likePost,
    resetAllData,
    totalWorkoutCalories,
    totalVolume,
    consumedCalories,
    totalProtein,
    totalBurn,
    netCalories,
    recommendedCalories,
    fatigueScore,
    fatigueLabel,
    weeklyWorkoutMinutes,
    weeklyStepAverage,
    weeklyData,
  }

  return (
    <div className="dashboard-shell">
      <aside className={sidebarOpen ? 'sidebar is-open' : 'sidebar'}>
        <div className="sidebar-brand">
          <span className="sidebar-mark">FF</span>
          <div>
            <strong>FitFlow</strong>
            <p>Community, Train, Nutrition, AI</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Sidebar">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="content-shell">
        <header className="content-topbar">
          <button
            type="button"
            className="menu-toggle"
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen((current) => !current)}
          >
            Menu
          </button>

          <div className="topbar-copy">
            <strong>FitFlow MVP IA</strong>
            <span>초기 탭은 Community / History / Train / Analytics / Profile 구조입니다.</span>
          </div>
        </header>

        <main className="content-main">
          <Outlet context={outletContext} />
        </main>
      </div>

      <nav className="mobile-tabbar" aria-label="Bottom tabs">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'mobile-tab active' : 'mobile-tab')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default DashboardLayout
