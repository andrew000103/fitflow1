import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import AppIcon from './AppIcon.jsx'
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
import {
  EXAMPLE_MUSCLE_DISTRIBUTIONS,
  calculateDailyBurn,
  calculateEstimated1RM,
  calculateMuscleFatigue,
  calculateNetCalories,
  calculateRecommendedCalories,
  resolveRestSeconds,
  summarizeExercisePerformance,
} from '../utils/fitnessMetrics.ts'
import {
  recommendCommunityContent,
  recommendMeal,
  recommendTodayWorkout,
} from '../utils/recommendationEngine.ts'
import {
  clearDashboardState,
  createCommentRecord,
  createMealRecord,
  createPostRecord,
  createReplyRecord,
  createShareEvent,
  loadDashboardState,
  saveDashboardState,
} from '../api/fitflowApi.ts'

const navigation = [
  { to: '/community', label: 'Community', icon: 'community' },
  { to: '/history', label: 'History', icon: 'history' },
  { to: '/train', label: 'Train', icon: 'train' },
  { to: '/nutrition', label: 'Nutrition', icon: 'nutrition' },
  { to: '/shop', label: 'Shop', icon: 'shop' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
]

function getSectionMeta(pathname) {
  if (pathname.startsWith('/train/workout')) {
    return { title: 'Active workout', subtitle: '기록을 멈추지 않고 바로 이어갑니다.' }
  }
  if (pathname.startsWith('/train')) {
    return { title: 'Train', subtitle: '오늘 운동을 가장 빠르게 시작합니다.' }
  }
  if (pathname.startsWith('/nutrition')) {
    return { title: 'Nutrition', subtitle: '반복 입력을 줄이고 빠르게 기록합니다.' }
  }
  if (pathname.startsWith('/shop')) {
    return { title: 'Shop', subtitle: '프로그램 마켓과 구매 흐름이 들어올 공간입니다.' }
  }
  if (pathname.startsWith('/history')) {
    return { title: 'History', subtitle: '날짜를 고르고 필요한 기록만 다시 봅니다.' }
  }
  if (pathname.startsWith('/analytics')) {
    return { title: 'Analytics', subtitle: '요약부터 보고 필요한 리포트로 내려갑니다.' }
  }
  if (pathname.startsWith('/community')) {
    return { title: 'Community', subtitle: '피드와 반응은 필요한 화면에서 확인합니다.' }
  }
  if (pathname.startsWith('/profile')) {
    return { title: 'Profile', subtitle: '내 정보와 관리 메뉴를 모아둔 공간입니다.' }
  }

  return { title: 'FitFlow', subtitle: '운동, 식단, 분석을 한 흐름으로 연결합니다.' }
}

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function daysBetween(dateString, baseDate = new Date()) {
  const [year, month, day] = dateString.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())
  return Math.round((base.getTime() - target.getTime()) / 86400000)
}

function inferMuscleDistribution(exerciseName, category) {
  const normalizedName = exerciseName.toLowerCase().replace(/\s+/g, '_')
  if (EXAMPLE_MUSCLE_DISTRIBUTIONS[normalizedName]) {
    return EXAMPLE_MUSCLE_DISTRIBUTIONS[normalizedName]
  }

  const categoryMap = {
    chest: { chest: 0.7, triceps: 0.2, front_delts: 0.1 },
    shoulders: { front_delts: 0.3, middle_delts: 0.4, rear_delts: 0.2, triceps: 0.1 },
    back: { lats: 0.45, upper_back: 0.35, biceps: 0.2 },
    legs: { quadriceps: 0.4, glutes: 0.3, hamstrings: 0.2, lower_back: 0.1 },
    abs: { abs: 0.85, lower_back: 0.15 },
    arms: { biceps: 0.35, triceps: 0.45, forearms: 0.2 },
  }

  return categoryMap[category] || { abs: 1 }
}

function mapCategoryToMuscles(category) {
  const categoryMap = {
    chest: ['chest', 'triceps', 'front_delts'],
    shoulders: ['front_delts', 'middle_delts', 'rear_delts'],
    back: ['lats', 'upper_back', 'biceps'],
    legs: ['quadriceps', 'glutes', 'hamstrings', 'lower_back'],
    abs: ['abs'],
    arms: ['biceps', 'triceps', 'forearms'],
  }

  return categoryMap[category] || []
}

const defaultCommentsByPost = {
  1: [
    {
      id: '1-a',
      author: 'Hana',
      content: '벤치 탑셋 좋네요. 셋업 팁도 궁금합니다.',
      replies: [{ id: '1-a-1', author: 'Mina', content: '다음엔 셋업 영상도 같이 올려볼게요.' }],
    },
  ],
  2: [
    {
      id: '2-a',
      author: 'Jisoo',
      content: '벌크 저녁 메뉴 참고했습니다.',
      replies: [],
    },
  ],
}

function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [persistedState] = useState(() => loadDashboardState())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
  const [savedPostIds, setSavedPostIds] = useState(persistedState.savedPostIds || [])
  const [likedPostIds, setLikedPostIds] = useState(persistedState.likedPostIds || [])
  const [hiddenPostIds, setHiddenPostIds] = useState(persistedState.hiddenPostIds || [])
  const [reportedPostIds, setReportedPostIds] = useState(persistedState.reportedPostIds || [])
  const [followedAuthors, setFollowedAuthors] = useState(persistedState.followedAuthors || ['Mina'])
  const [commentsByPost, setCommentsByPost] = useState(
    persistedState.commentsByPost || defaultCommentsByPost,
  )
  const [shareEvents, setShareEvents] = useState(persistedState.shareEvents || [])
  const [activeWorkout, setActiveWorkout] = useState(null)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [lastWorkoutSummary, setLastWorkoutSummary] = useState(
    persistedState.lastWorkoutSummary || null,
  )
  const currentProgram = programs[0]

  useEffect(() => {
    saveDashboardState({
      goal,
      steps,
      sets,
      meals,
      posts,
      programs,
      exerciseDatabase,
      sessions,
      savedPostIds,
      likedPostIds,
      hiddenPostIds,
      reportedPostIds,
      followedAuthors,
      commentsByPost,
      shareEvents,
      lastWorkoutSummary,
    })
  }, [
    commentsByPost,
    exerciseDatabase,
    followedAuthors,
    goal,
    lastWorkoutSummary,
    likedPostIds,
    meals,
    posts,
    programs,
    hiddenPostIds,
    reportedPostIds,
    savedPostIds,
    sessions,
    sets,
    shareEvents,
    steps,
  ])

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

  const totalWorkoutCalories = useMemo(() => sets.reduce((sum, item) => sum + item.calories, 0), [sets])
  const totalVolume = useMemo(() => sets.reduce((sum, item) => sum + item.volume, 0), [sets])
  const consumedCalories = useMemo(() => meals.reduce((sum, item) => sum + item.calories, 0), [meals])
  const totalProtein = useMemo(() => meals.reduce((sum, item) => sum + item.protein, 0), [meals])
  const stepCalories = Math.round(steps * 0.04)
  const baseMetabolism = 1680
  const totalBurn = calculateDailyBurn({
    bmrCalories: baseMetabolism,
    stepCalories,
    exerciseCalories: totalWorkoutCalories,
  })
  const netCalories = calculateNetCalories(consumedCalories, totalBurn)
  const recommendedCaloriesRange = calculateRecommendedCalories(totalBurn, goal === 'diet' ? 'cut' : goal)
  const fatigueByMuscle = useMemo(
    () =>
      calculateMuscleFatigue(
        sessions.map((session) => ({
          daysAgo: Math.max(0, daysBetween(session.date)),
          exercises: session.exercises.map((exercise) => ({
            muscleDistribution: inferMuscleDistribution(exercise.name, exercise.category),
            sets: exercise.timeline.map((setItem) => ({
              weightKg: Number(setItem.weight || 0),
              reps: Number(setItem.reps || 0),
              isCompleted: true,
            })),
          })),
        })),
      ),
    [sessions],
  )
  const fatigueScore = Math.max(
    ...Object.values(fatigueByMuscle).map((value) => Number(value || 0)),
    Math.min(100, Math.round(totalVolume / 18)),
  )
  const fatigueLabel = fatigueScore >= 80 ? 'High' : fatigueScore >= 55 ? 'Moderate' : 'Low'
  const recommendedCalories = recommendedCaloriesRange.target
  const weeklyWorkoutMinutes = weeklyData.reduce((sum, item) => sum + item.workout, 0)
  const weeklyStepAverage = Math.round(
    weeklyData.reduce((sum, item) => sum + item.steps, 0) / weeklyData.length,
  )
  const streakDays = Math.max(3, Math.min(9, Math.ceil(sets.length / 2)))
  const recentCategories = sessions
    .slice(0, 3)
    .flatMap((session) => session.exercises.map((exercise) => exercise.category))
  const recentMuscles = recentCategories.flatMap((category) => mapCategoryToMuscles(category))
  const interactionTags = posts
    .filter((post) => savedPostIds.includes(post.id) || followedAuthors.includes(post.author))
    .slice(0, 5)
    .flatMap((post) => [post.category, post.title.toLowerCase().includes('식단') ? '식단' : '운동 팁'])
  const todayMealTotals = meals
    .filter((meal) => meal.loggedDate === formatLocalDate(new Date()))
    .reduce(
      (acc, meal) => {
        acc.calories += meal.calories || 0
        acc.carbs += meal.carbs || 0
        acc.protein += meal.protein || 0
        acc.fat += meal.fat || 0
        return acc
      },
      { calories: 0, carbs: 0, protein: 0, fat: 0 },
    )
  const workoutRecommendation = recommendTodayWorkout({
    recentMuscles,
    fatigueByMuscle,
    availableMinutes: activeWorkout ? 60 : 45,
    programMuscles: currentProgram?.exercises.flatMap((item) => mapCategoryToMuscles(item.category)) || [],
    consecutiveTrainingDays: Math.min(3, sessions.slice(0, 3).length),
  })
  const mealRecommendation = recommendMeal({
    remainingCalories: recommendedCalories - todayMealTotals.calories,
    remainingCarbs: Math.max(0, 220 - todayMealTotals.carbs),
    remainingProtein: Math.max(0, 150 - todayMealTotals.protein),
    remainingFat: Math.max(0, 60 - todayMealTotals.fat),
    goalType: goal === 'diet' ? 'cut' : goal,
    timeOfDay: todayMealTotals.calories < 400 ? 'lunch' : 'dinner',
  })
  const communityRecommendation = recommendCommunityContent({
    goalType: goal === 'diet' ? 'cut' : goal,
    interactionTags,
    recentMuscles,
  })
  const aiCoach = {
    training: workoutRecommendation.message,
    trainingTitle: workoutRecommendation.title,
    nutrition: mealRecommendation.message,
    nutritionTitle: mealRecommendation.title,
    community: communityRecommendation.message,
    communityTitle: communityRecommendation.title,
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
                  restSeconds: resolveRestSeconds({
                    movementType: ['chest', 'back', 'legs'].includes(exercise.category)
                      ? 'compound'
                      : 'isolation',
                  }),
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
    const prCount = activeWorkout.exercises.reduce((count, exercise) => {
      const summary = summarizeExercisePerformance({
        name: exercise.name,
        sets: exercise.sets.map((setItem) => ({
          weightKg: Number(setItem.weight || 0),
          reps: Number(setItem.reps || 0),
          isCompleted: setItem.completed,
        })),
      })
      const previousBest = sessions
        .flatMap((session) => session.exercises)
        .filter((item) => item.name === exercise.name)
        .reduce(
          (best, item) => ({
            maxWeightKg: Math.max(best.maxWeightKg, item.maxWeight || 0),
            maxSetVolumeKg: Math.max(best.maxSetVolumeKg, item.maxVolume || 0),
            maxEstimated1RMKg: Math.max(best.maxEstimated1RMKg, item.estimated1RM || 0),
            maxExerciseVolumeKg: Math.max(
              best.maxExerciseVolumeKg,
              item.timeline.reduce((sum, setItem) => sum + Number(setItem.weight || 0) * Number(setItem.reps || 0), 0),
            ),
          }),
          { maxWeightKg: 0, maxSetVolumeKg: 0, maxEstimated1RMKg: 0, maxExerciseVolumeKg: 0 },
        )

      const hasPR =
        summary.maxWeightKg > previousBest.maxWeightKg ||
        summary.maxSetVolumeKg > previousBest.maxSetVolumeKg ||
        summary.maxEstimated1RMKg > previousBest.maxEstimated1RMKg ||
        summary.maxExerciseVolumeKg > previousBest.maxExerciseVolumeKg

      return count + (hasPR ? 1 : 0)
    }, 0)
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
        date: formatLocalDate(new Date()),
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
          const maxVolume = completed.reduce((best, setItem) => Math.max(best, Number(setItem.weight || 0) * Number(setItem.reps || 0)), 0)
          const estimated1RM = completed.reduce((best, setItem) => {
            const estimate = calculateEstimated1RM(Number(setItem.weight || 0), Number(setItem.reps || 0))
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

  function addMeal({
    name,
    calories,
    protein,
    carbs = 0,
    fat = 0,
    mealType = 'lunch',
    serving = 1,
    favorite = false,
    loggedDate,
  }) {
    setMeals((current) => [
      createMealRecord({
        name,
        calories,
        protein,
        carbs,
        fat,
        mealType,
        serving,
        favorite,
        loggedDate: loggedDate || formatLocalDate(new Date()),
      }),
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

  function addPost({
    title,
    body,
    type = 'tip',
    goalTag = goal,
    hashtags = [],
    photoCount = 0,
    hasVideo = false,
    attachWorkoutCard = false,
    attachDietCard = false,
  }) {
    setPosts((current) => [
      createPostRecord({
        title,
        body,
        category: goal,
        type,
        goalTag,
        hashtags,
        photoCount,
        hasVideo,
        attachWorkoutCard,
        attachDietCard,
      }),
      ...current,
    ])
  }

  function toggleSavePost(postId) {
    setSavedPostIds((current) =>
      current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId],
    )
  }

  function toggleHidePost(postId) {
    setHiddenPostIds((current) =>
      current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId],
    )
  }

  function updatePost(postId, payload) {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, ...payload } : post)),
    )
  }

  function deletePost(postId) {
    setPosts((current) => current.filter((post) => post.id !== postId))
    setSavedPostIds((current) => current.filter((id) => id !== postId))
    setLikedPostIds((current) => current.filter((id) => id !== postId))
    setHiddenPostIds((current) => current.filter((id) => id !== postId))
    setReportedPostIds((current) => current.filter((id) => id !== postId))
    setCommentsByPost((current) => {
      const next = { ...current }
      delete next[postId]
      return next
    })
  }

  function reportPost(postId) {
    setReportedPostIds((current) => (current.includes(postId) ? current : [...current, postId]))
  }

  function toggleFollowAuthor(author) {
    setFollowedAuthors((current) =>
      current.includes(author) ? current.filter((item) => item !== author) : [...current, author],
    )
  }

  function addComment(postId, content) {
    if (!content.trim()) {
      return
    }

    setCommentsByPost((current) => ({
      ...current,
      [postId]: [createCommentRecord(content), ...(current[postId] || [])],
    }))
  }

  function addReply(postId, commentId, content) {
    if (!content.trim()) {
      return
    }

    setCommentsByPost((current) => ({
      ...current,
      [postId]: (current[postId] || []).map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              replies: [
                ...comment.replies,
                createReplyRecord(content),
              ],
            }
          : comment,
      ),
    }))
  }

  function sharePost(postId) {
    setShareEvents((current) => [...current, createShareEvent(postId)])
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
    const isLiked = likedPostIds.includes(postId)
    setLikedPostIds((current) =>
      isLiked ? current.filter((id) => id !== postId) : [...current, postId],
    )
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, likes: Math.max(0, post.likes + (isLiked ? -1 : 1)) }
          : post,
      ),
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
    setSavedPostIds([])
    setLikedPostIds([])
    setHiddenPostIds([])
    setReportedPostIds([])
    setFollowedAuthors(['Mina'])
    setCommentsByPost(defaultCommentsByPost)
    setShareEvents([])
    setActiveWorkout(null)
    setLastWorkoutSummary(null)
    clearDashboardState()
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
    savedPostIds,
    likedPostIds,
    hiddenPostIds,
    reportedPostIds,
    followedAuthors,
    commentsByPost,
    shareEvents,
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
    toggleSavePost,
    toggleHidePost,
    updatePost,
    deletePost,
    reportPost,
    toggleFollowAuthor,
    addComment,
    addReply,
    sharePost,
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
    recommendedCaloriesRange,
    fatigueScore,
    fatigueLabel,
    fatigueByMuscle,
    weeklyWorkoutMinutes,
    weeklyStepAverage,
    weeklyData,
  }

  const currentSection = getSectionMeta(location.pathname)
  const activeWorkoutMinutes = activeWorkout
    ? Math.max(1, Math.floor((nowTick - activeWorkout.startedAt) / 60000))
    : 0

  return (
    <div className="dashboard-shell">
      <aside className={sidebarOpen ? `sidebar is-open${sidebarCollapsed ? ' is-collapsed' : ''}` : `sidebar${sidebarCollapsed ? ' is-collapsed' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-mark">FF</span>
          <div className="sidebar-brand-copy">
            <strong>FitFlow</strong>
            <p>Community, Train, Nutrition, AI</p>
          </div>
          <button
            type="button"
            className="sidebar-collapse"
            aria-label="Collapse sidebar"
            onClick={() => setSidebarCollapsed((current) => !current)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Sidebar">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon" aria-hidden="true">
                <AppIcon name={item.icon} size="sm" />
              </span>
              <span className="nav-label">{item.label}</span>
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

      <div className={sidebarCollapsed ? 'content-shell is-collapsed' : 'content-shell'}>
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
            <strong>{currentSection.title}</strong>
            <span>{currentSection.subtitle}</span>
          </div>

          {activeWorkout ? (
            <button
              type="button"
              className="topbar-workout-pill"
              onClick={() => navigate('/train/workout')}
            >
              <span><AppIcon name="workout" size="sm" /> {activeWorkout.title}</span>
              <strong>{activeWorkoutMinutes}m</strong>
            </button>
          ) : null}
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
            <span className="nav-icon" aria-hidden="true">
              <AppIcon name={item.icon} size="sm" />
            </span>
            <span className="mobile-tab-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default DashboardLayout
