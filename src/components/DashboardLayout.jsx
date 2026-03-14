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
import { foodSeed } from '../data/foodSeed.js'
import {
  EXAMPLE_MUSCLE_DISTRIBUTIONS,
  calculateDailyBurn,
  calculateEstimated1RM,
  calculateMuscleFatigue as calculateLegacyMuscleFatigue,
  calculateNetCalories,
  calculateRecommendedCalories,
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
import {
  calculateMuscleFatigue,
  getRecoveryRecommendation,
  normalizeMuscleScores,
} from '../utils/muscleFatigue.js'
import { findFoodMergeCandidate } from '../utils/foodDeduplication.js'
import { getFoodAllNames } from '../utils/foodNaming.js'
import { tx } from '../utils/appLanguage.js'

function getNavigation(language) {
  return [
    { to: '/train', label: tx(language, '운동', 'Train'), icon: 'train' },
    { to: '/nutrition', label: tx(language, '식단', 'Nutrition'), icon: 'nutrition' },
    { to: '/connect', label: tx(language, '커넥트', 'Connect'), icon: 'connect' },
    { to: '/shop', label: tx(language, '스토어', 'Shop'), icon: 'shop' },
    { to: '/profile', label: tx(language, '프로필', 'Profile'), icon: 'profile' },
  ]
}

function getSectionMeta(pathname, language) {
  if (pathname.startsWith('/train/workout')) {
    return {
      title: tx(language, '진행 중 운동', 'Active Workout'),
      subtitle: tx(language, '기록을 멈추지 않고 바로 이어갑니다.', 'Keep logging without breaking flow.'),
    }
  }
  if (pathname.startsWith('/train/history')) {
    return {
      title: tx(language, '운동 기록', 'Train History'),
      subtitle: tx(language, '운동 기록과 세션 회고를 Train 안에서 바로 봅니다.', 'Review sessions and workout history inside Train.'),
    }
  }
  if (pathname.startsWith('/train/insights')) {
    return {
      title: 'FF Trainer',
      subtitle: tx(language, '회복 상태와 오늘 훈련 우선순위를 먼저 보여줍니다.', 'Recovery status and today priorities come first.'),
    }
  }
  if (pathname.startsWith('/train/programs') || pathname.startsWith('/train/templates')) {
    return {
      title: tx(language, '프로그램', 'Programs'),
      subtitle: tx(language, '몇 주짜리 훈련 계획을 탐색하고 선택합니다.', 'Browse and choose structured multi-week programs.'),
    }
  }
  if (pathname.startsWith('/train')) {
    return {
      title: tx(language, '운동', 'Train'),
      subtitle: tx(language, '오늘 운동을 가장 빠르게 시작합니다.', 'Start today workout as fast as possible.'),
    }
  }
  if (pathname.startsWith('/nutrition')) {
    return {
      title: tx(language, '식단', 'Nutrition'),
      subtitle: tx(language, '반복 입력을 줄이고 빠르게 기록합니다.', 'Log meals quickly with less repeated input.'),
    }
  }
  if (pathname.startsWith('/connect')) {
    return {
      title: tx(language, '커넥트', 'Connect'),
      subtitle: tx(language, '피드와 반응은 필요한 화면에서 확인합니다.', 'Explore the feed and actions in one place.'),
    }
  }
  if (pathname.startsWith('/shop')) {
    return {
      title: tx(language, '스토어', 'Shop'),
      subtitle: tx(language, '프로그램 마켓과 구매 흐름이 들어올 공간입니다.', 'Reserved for marketplace and purchase flows.'),
    }
  }
  if (pathname.startsWith('/profile')) {
    return {
      title: tx(language, '프로필', 'Profile'),
      subtitle: tx(language, '내 정보와 관리 메뉴를 모아둔 공간입니다.', 'Your personal settings and health controls live here.'),
    }
  }

  return {
    title: 'FitFlow',
    subtitle: tx(language, '운동, 식단, 분석을 한 흐름으로 연결합니다.', 'Train, nutrition, and analytics in one flow.'),
  }
}

function isPrimaryTabRoute(pathname) {
  return ['/train', '/nutrition', '/connect', '/shop', '/profile'].includes(pathname)
}

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatWorkoutTitleDate(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}${day}`
}

function addDays(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  target.setDate(target.getDate() + days)
  return formatLocalDate(target)
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

function mergeFoodCatalog(seedFoods, persistedFoods = []) {
  const safePersistedFoods = Array.isArray(persistedFoods) ? persistedFoods : []
  const persistedFoodMap = new Map(safePersistedFoods.map((food) => [food.id, food]))

  return seedFoods.map((seedFood) => {
    const persistedFood = persistedFoodMap.get(seedFood.id)

    if (!persistedFood) {
      return seedFood
    }

    return {
      ...seedFood,
      ...persistedFood,
      localNames: {
        ...seedFood.localNames,
        ...(persistedFood.localNames || {}),
      },
      keywords: Array.from(new Set([...(seedFood.keywords || []), ...(persistedFood.keywords || [])])),
      servingUnits:
        persistedFood.servingUnits && persistedFood.servingUnits.length > 0
          ? persistedFood.servingUnits
          : seedFood.servingUnits,
    }
  })
}

function normalizePrograms(persistedPrograms, fallbackPrograms) {
  if (!Array.isArray(persistedPrograms) || persistedPrograms.length === 0) {
    return fallbackPrograms
  }

  return persistedPrograms.map((program, programIndex) => {
    if (program?.weeks && Array.isArray(program.weeks)) {
      return program
    }

    const fallbackProgram = fallbackPrograms[programIndex] || fallbackPrograms[0]
    const legacyExercises = Array.isArray(program?.exercises) ? program.exercises : []

    return {
      id: program?.id || fallbackProgram?.id || `program-${programIndex + 1}`,
      title: program?.title || program?.name || fallbackProgram?.title || 'Program',
      name: program?.title || program?.name || fallbackProgram?.name || 'Program',
      description: program?.description || '이전 버전에서 가져온 프로그램입니다.',
      category: program?.category || fallbackProgram?.category || 'General Strength',
      difficulty: program?.difficulty || fallbackProgram?.difficulty || 'Beginner',
      durationWeeks: program?.durationWeeks || 1,
      sessionsPerWeek: program?.sessionsPerWeek || 1,
      goal: program?.goal || fallbackProgram?.goal || 'General fitness',
      authorId: program?.authorId || 'legacy',
      authorName: program?.authorName || 'Legacy',
      visibility: program?.visibility || 'private',
      likes: program?.likes || 0,
      useCount: program?.useCount || 0,
      reviewCount: program?.reviewCount || 0,
      averageRating: program?.averageRating || 0,
      tags: program?.tags || [],
      weeks: [
        {
          id: `${program?.id || `program-${programIndex + 1}`}-week-1`,
          weekIndex: program?.week || 1,
          title: `Week ${program?.week || 1}`,
          days: [
            {
              id: `${program?.id || `program-${programIndex + 1}`}-day-1`,
              dayIndex: program?.day || 1,
              title: `Day ${program?.day || 1}`,
              focus: program?.category || fallbackProgram?.category || 'General Strength',
              exercises: legacyExercises.map((exercise, exerciseIndex) => ({
                id: `${program?.id || `program-${programIndex + 1}`}-exercise-${exerciseIndex + 1}`,
                exerciseName: exercise.exerciseName || exercise.name,
                category: exercise.category || 'chest',
                sets: exercise.sets || 3,
                repsGuide: exercise.repsGuide || '8-12',
              })),
            },
          ],
        },
      ],
    }
  })
}

function getProgramPreviewDay(program, weekNumber = 1, dayNumber = 1) {
  const week = program?.weeks?.find((item) => item.weekIndex === weekNumber) || program?.weeks?.[0]
  const day = week?.days?.find((item) => item.dayIndex === dayNumber) || week?.days?.[0]
  return day || null
}

function getProgramExerciseList(program, weekNumber = 1, dayNumber = 1) {
  return getProgramPreviewDay(program, weekNumber, dayNumber)?.exercises || []
}

function inferProgramCategoryFromExercises(exercises = []) {
  const categories = exercises.map((exercise) => exercise.category).filter(Boolean)
  return categories[0] || 'General Strength'
}

function buildSessionMetrics(session) {
  const normalizedExercises = (session.exercises || []).map((exercise) => {
    const timeline = (exercise.timeline || []).map((setItem) => ({
      previous: setItem.previous || '-',
      weight: Number(setItem.weight || 0),
      reps: Number(setItem.reps || 0),
    }))
    const bestByWeight = [...timeline].sort((left, right) => Number(right.weight || 0) - Number(left.weight || 0))[0]
    const maxVolume = timeline.reduce((best, setItem) => Math.max(best, Number(setItem.weight || 0) * Number(setItem.reps || 0)), 0)
    const estimated1RM = timeline.reduce((best, setItem) => {
      const estimate = calculateEstimated1RM(Number(setItem.weight || 0), Number(setItem.reps || 0))
      return Math.max(best, estimate)
    }, 0)

    return {
      ...exercise,
      setCount: timeline.length,
      bestSet: bestByWeight ? `${bestByWeight.weight}kg x ${bestByWeight.reps}` : '-',
      maxWeight: bestByWeight ? Number(bestByWeight.weight) : 0,
      maxVolume,
      estimated1RM,
      timeline,
    }
  })

  const totalVolume = normalizedExercises.reduce(
    (sum, exercise) =>
      sum + exercise.timeline.reduce((exerciseSum, setItem) => exerciseSum + Number(setItem.weight || 0) * Number(setItem.reps || 0), 0),
    0,
  )
  const prCount = normalizedExercises.reduce((sum, exercise) => sum + (exercise.maxWeight > 0 ? 1 : 0), 0)

  return {
    exercises: normalizedExercises,
    totalVolume,
    prCount,
    calories: Math.max(80, Math.round(totalVolume * 0.08)),
  }
}

function createDefaultUserProfile(goal = 'maintain') {
  return {
    name: 'Donghyun An',
    bio: 'Train, Nutrition, FF Trainer에서 쓰는 개인 설정을 관리합니다.',
    sex: 'male',
    age: 29,
    heightCm: 178,
    weightKg: 77.7,
    targetWeightKg: goal === 'diet' ? 74 : goal === 'bulk' ? 82 : 78,
    activityLevel: 'moderate',
    goal,
    unitSystem: 'metric',
    notificationsEnabled: true,
    monthlyWeightReminderEnabled: true,
    nutritionPreference: 'balanced',
  }
}

function createDefaultHealthConnection(steps = 0) {
  return {
    source: 'Apple Health',
    status: 'connected',
    latestSteps: steps,
    latestDistanceKm: Number((steps * 0.00072).toFixed(1)),
    latestActiveCalories: Math.round(steps * 0.04),
    lastSyncedAt: 'Today 08:42',
  }
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
  const initialProgramState = useMemo(
    () => normalizePrograms(persistedState.programs, initialPrograms),
    [persistedState.programs],
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [goal, setGoal] = useState(persistedState.goal || 'maintain')
  const [appLanguage, setAppLanguage] = useState(persistedState.appLanguage || persistedState.foodNameLanguage || 'en')
  const foodNameLanguage = appLanguage
  const setFoodNameLanguage = setAppLanguage
  const [steps, setSteps] = useState(persistedState.steps || 11284)
  const [userProfile, setUserProfile] = useState(
    persistedState.userProfile && typeof persistedState.userProfile === 'object'
      ? { ...createDefaultUserProfile(persistedState.goal || 'maintain'), ...persistedState.userProfile }
      : createDefaultUserProfile(persistedState.goal || 'maintain'),
  )
  const [healthConnection, setHealthConnection] = useState(
    persistedState.healthConnection && typeof persistedState.healthConnection === 'object'
      ? { ...createDefaultHealthConnection(persistedState.steps || 11284), ...persistedState.healthConnection }
      : createDefaultHealthConnection(persistedState.steps || 11284),
  )
  const [weightHistory, setWeightHistory] = useState(
    Array.isArray(persistedState.weightHistory) && persistedState.weightHistory.length > 0
      ? persistedState.weightHistory
      : [
          {
            id: `weight-${Date.now()}`,
            date: formatLocalDate(new Date()),
            weightKg:
              persistedState.userProfile && typeof persistedState.userProfile === 'object' && Number.isFinite(persistedState.userProfile.weightKg)
                ? persistedState.userProfile.weightKg
                : createDefaultUserProfile(persistedState.goal || 'maintain').weightKg,
            source: 'profile',
          },
        ],
  )
  const [lastWeightCheckInDate, setLastWeightCheckInDate] = useState(
    persistedState.lastWeightCheckInDate || weightHistory?.[0]?.date || formatLocalDate(new Date()),
  )
  const [sets, setSets] = useState(Array.isArray(persistedState.sets) ? persistedState.sets : initialSets)
  const [meals, setMeals] = useState(Array.isArray(persistedState.meals) ? persistedState.meals : initialMeals)
  const [posts, setPosts] = useState(Array.isArray(persistedState.posts) ? persistedState.posts : initialPosts)
  const [programs, setPrograms] = useState(initialProgramState)
  const [activeProgram, setActiveProgram] = useState(
    persistedState.activeProgram && typeof persistedState.activeProgram === 'object' ? persistedState.activeProgram : {
      userId: 'me',
      programId: initialProgramState[0]?.id || null,
      currentWeek: 1,
      currentDay: 1,
      startedAt: formatLocalDate(new Date()),
      lastCompletedAt: null,
      streakDays: 6,
      completedSessionIds: [],
    },
  )
  const [programLikes, setProgramLikes] = useState(Array.isArray(persistedState.programLikes) ? persistedState.programLikes : [])
  const [programReviews, setProgramReviews] = useState(
    Array.isArray(persistedState.programReviews) ? persistedState.programReviews : [
      {
        id: 'review-1',
        programId: 'hypertrophy-a',
        userId: 'reviewer-1',
        authorName: 'Jisoo',
        rating: 5,
        content: '구조가 명확해서 매주 진행하기 좋았습니다.',
        createdAt: '2026-03-10',
      },
      {
        id: 'review-2',
        programId: 'lean-cut',
        userId: 'reviewer-2',
        authorName: 'Hana',
        rating: 4,
        content: '감량기에 부담이 크지 않아서 꾸준히 하기 좋았습니다.',
        createdAt: '2026-03-08',
      },
    ],
  )
  const [exerciseDatabase, setExerciseDatabase] = useState(
    Array.isArray(persistedState.exerciseDatabase) ? persistedState.exerciseDatabase : exerciseDatabaseSeed,
  )
  const [foods, setFoods] = useState(() => mergeFoodCatalog(foodSeed, persistedState.foods))
  const [customFoods, setCustomFoods] = useState(Array.isArray(persistedState.customFoods) ? persistedState.customFoods : [])
  const [foodMergeCandidates, setFoodMergeCandidates] = useState(
    Array.isArray(persistedState.foodMergeCandidates) ? persistedState.foodMergeCandidates : [],
  )
  const [sessions, setSessions] = useState(Array.isArray(persistedState.sessions) ? persistedState.sessions : initialSessions)
  const [savedPostIds, setSavedPostIds] = useState(Array.isArray(persistedState.savedPostIds) ? persistedState.savedPostIds : [])
  const [likedPostIds, setLikedPostIds] = useState(Array.isArray(persistedState.likedPostIds) ? persistedState.likedPostIds : [])
  const [hiddenPostIds, setHiddenPostIds] = useState(Array.isArray(persistedState.hiddenPostIds) ? persistedState.hiddenPostIds : [])
  const [reportedPostIds, setReportedPostIds] = useState(Array.isArray(persistedState.reportedPostIds) ? persistedState.reportedPostIds : [])
  const [followedAuthors, setFollowedAuthors] = useState(Array.isArray(persistedState.followedAuthors) ? persistedState.followedAuthors : ['Mina'])
  const [commentsByPost, setCommentsByPost] = useState(
    persistedState.commentsByPost && typeof persistedState.commentsByPost === 'object'
      ? persistedState.commentsByPost
      : defaultCommentsByPost,
  )
  const [shareEvents, setShareEvents] = useState(Array.isArray(persistedState.shareEvents) ? persistedState.shareEvents : [])
  const [activeWorkout, setActiveWorkout] = useState(null)
  const [restStartedAt, setRestStartedAt] = useState(null)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [lastWorkoutSummary, setLastWorkoutSummary] = useState(
    persistedState.lastWorkoutSummary || null,
  )
  const currentProgram = programs.find((program) => program.id === activeProgram?.programId) || null
  const currentProgramDay = currentProgram
    ? getProgramPreviewDay(currentProgram, activeProgram?.currentWeek, activeProgram?.currentDay)
    : null

  useEffect(() => {
    if (!programs.length) {
      return
    }

    if (!activeProgram?.programId || !programs.some((program) => program.id === activeProgram.programId)) {
      setActiveProgram({
        userId: 'me',
        programId: programs[0].id,
        currentWeek: 1,
        currentDay: 1,
        startedAt: formatLocalDate(new Date()),
        lastCompletedAt: null,
        streakDays: 0,
        completedSessionIds: [],
      })
    }
  }, [activeProgram?.programId, programs])

  useEffect(() => {
    setUserProfile((current) => (current.goal === goal ? current : { ...current, goal }))
  }, [goal])

  useEffect(() => {
    setHealthConnection((current) => ({
      ...current,
      latestSteps: steps,
      latestDistanceKm: Number((steps * 0.00072).toFixed(1)),
      latestActiveCalories: Math.round(steps * 0.04),
    }))
  }, [steps])

  useEffect(() => {
    saveDashboardState({
      goal,
      userProfile,
      healthConnection,
      weightHistory,
      lastWeightCheckInDate,
      appLanguage,
      foodNameLanguage,
      steps,
      sets,
      meals,
      posts,
      programs,
      activeProgram,
      programLikes,
      programReviews,
      exerciseDatabase,
      foods,
      customFoods,
      foodMergeCandidates,
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
    customFoods,
    appLanguage,
    exerciseDatabase,
    foodMergeCandidates,
    followedAuthors,
    foods,
    foodNameLanguage,
    goal,
    healthConnection,
    lastWorkoutSummary,
    likedPostIds,
    meals,
    posts,
    programs,
    activeProgram,
    programLikes,
    programReviews,
    userProfile,
    weightHistory,
    lastWeightCheckInDate,
    hiddenPostIds,
    reportedPostIds,
    savedPostIds,
    sessions,
    sets,
    shareEvents,
    steps,
  ])

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
      calculateLegacyMuscleFatigue(
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
  const muscleFatigueScores = useMemo(
    () => normalizeMuscleScores(calculateMuscleFatigue(sessions)),
    [sessions],
  )
  const recoveryRecommendation = useMemo(
    () => getRecoveryRecommendation(muscleFatigueScores),
    [muscleFatigueScores],
  )
  const isResting = Boolean(activeWorkout && restStartedAt)
  const currentRestElapsed = isResting ? Math.max(0, Math.floor((nowTick - restStartedAt) / 1000)) : 0
  const fatigueScore = Math.max(
    ...Object.values(fatigueByMuscle).map((value) => Number(value || 0)),
    Math.min(100, Math.round(totalVolume / 18)),
  )
  const fatigueLabel = fatigueScore >= 80 ? 'High' : fatigueScore >= 55 ? 'Moderate' : 'Low'
  const recommendedCalories = recommendedCaloriesRange.target
  const activityCalories = Math.max(180, Math.round(baseMetabolism * 0.18))
  const nextWeightCheckInDate = addDays(lastWeightCheckInDate || formatLocalDate(new Date()), 30)
  const weightReminderDue =
    userProfile.monthlyWeightReminderEnabled !== false &&
    userProfile.notificationsEnabled !== false &&
    daysBetween(lastWeightCheckInDate || formatLocalDate(new Date())) >= 30
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
    programMuscles: currentProgramDay?.exercises.flatMap((item) => mapCategoryToMuscles(item.category)) || [],
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

  function updateUserProfile(patch) {
    setUserProfile((current) => {
      const nextProfile = { ...current, ...patch }
      if (patch.goal && patch.goal !== goal) {
        setGoal(patch.goal)
      }
      return nextProfile
    })
  }

  function updateHealthConnection(patch) {
    setHealthConnection((current) => {
      const nextState = { ...current, ...patch }
      if (typeof patch.latestSteps === 'number' && patch.latestSteps !== steps) {
        setSteps(patch.latestSteps)
      }
      return nextState
    })
  }

  function recordWeightCheckIn(weightKg, options = {}) {
    const entryDate = options.date || formatLocalDate(new Date())
    const parsedWeight = Number(weightKg)

    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      return
    }

    setUserProfile((current) => ({
      ...current,
      weightKg: parsedWeight,
    }))
    setWeightHistory((current) => [
      {
        id: `weight-${Date.now()}`,
        date: entryDate,
        weightKg: parsedWeight,
        source: options.source || 'profile',
      },
      ...current.filter((entry) => entry.date !== entryDate),
    ])
    setLastWeightCheckInDate(entryDate)
  }

  function startRest() {
    setRestStartedAt(Date.now())
  }

  function stopRest() {
    setRestStartedAt(null)
  }

  function logSet({ category, exercise, reps, weight }) {
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
    let title = `${formatWorkoutTitleDate(new Date())} workout`
    let source = mode
    let sourceMeta = {}

    if (mode === 'program') {
      const selectedWeek = payload.currentWeek || activeProgram?.currentWeek || 1
      const selectedDay = payload.currentDay || activeProgram?.currentDay || 1
      const programDay = getProgramPreviewDay(payload, selectedWeek, selectedDay)
      title = programDay ? `${payload.title || payload.name} · ${programDay.title}` : payload.title || payload.name
      exerciseNames = getProgramExerciseList(payload, selectedWeek, selectedDay).map(
        (item) => item.exerciseName || item.name,
      )
      sourceMeta = {
        programId: payload.id,
        currentWeek: selectedWeek,
        currentDay: selectedDay,
        dayTitle: programDay?.title || null,
      }
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
      ...sourceMeta,
    })
    stopRest()
    setLastWorkoutSummary(null)
  }

  function addExerciseToWorkout(exerciseNameOrCategory) {
    const fallbackExercise = workoutCatalog.chest[0]
    const matchedExercise = exerciseDatabase.find((item) => item.name === exerciseNameOrCategory)
    const nextExerciseName = matchedExercise?.name || workoutCatalog[exerciseNameOrCategory]?.[0] || fallbackExercise
    const nextCategory = matchedExercise?.category || findCategoryByExercise(nextExerciseName)
    setActiveWorkout((current) => {
      if (!current) {
        return current
      }
      return {
        ...current,
        exercises: [
          ...current.exercises,
          createWorkoutExercise(nextExerciseName, nextCategory, latestRecordForExercise(nextExerciseName)),
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
        startRest()
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
    const finishedWorkout = activeWorkout
    const sessionId = `session-${Date.now()}`
    const completedDate = formatLocalDate(new Date())
    const completedSets = finishedWorkout.exercises.flatMap((exercise) =>
      exercise.sets.filter((setItem) => setItem.completed).map((setItem) => ({
        exercise: exercise.name,
        volume: Number(setItem.weight || 0) * Number(setItem.reps || 0),
        weight: Number(setItem.weight || 0),
        reps: Number(setItem.reps || 0),
        category: exercise.category,
      })),
    )
    const durationMinutes = Math.max(1, Math.round((Date.now() - finishedWorkout.startedAt) / 60000))
    const sessionVolume = completedSets.reduce((sum, item) => sum + item.volume, 0)
    const topSet = completedSets.sort((a, b) => b.weight - a.weight)[0]
    const prCount = finishedWorkout.exercises.reduce((count, exercise) => {
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
      date: completedDate,
      title: finishedWorkout.title,
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
        id: sessionId,
        date: completedDate,
        title: finishedWorkout.title,
        durationMinutes,
        totalVolume: sessionVolume,
        prCount,
        calories: Math.max(80, Math.round(sessionVolume * 0.08)),
        condition: 'Tracked',
        rpe: Math.min(10, 5 + Math.round(prCount / 2) + Math.round(durationMinutes / 30)),
        note: finishedWorkout.note || '운동 종료 후 자동 저장된 세션입니다.',
        exercises: finishedWorkout.exercises.map((exercise) => {
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
    if (finishedWorkout.source === 'program' && finishedWorkout.programId) {
      setActiveProgram((current) => {
        if (!current || current.programId !== finishedWorkout.programId) {
          return current
        }
        const program = programs.find((item) => item.id === current.programId)
        const currentWeek = finishedWorkout.currentWeek || current.currentWeek || 1
        const currentDay = finishedWorkout.currentDay || current.currentDay || 1
        const week = program?.weeks?.find((item) => item.weekIndex === currentWeek)
        const availableWeekCount = program?.weeks?.length || currentWeek
        const lastDayIndex = week?.days?.[week.days.length - 1]?.dayIndex || currentDay
        const nextDay = currentDay < lastDayIndex ? currentDay + 1 : 1
        const nextWeek =
          currentDay < lastDayIndex
            ? currentWeek
            : Math.min(availableWeekCount, currentWeek + 1)

        return {
          ...current,
          currentWeek: nextWeek,
          currentDay: nextDay,
          lastCompletedAt: completedDate,
          streakDays: current.streakDays + 1,
          completedSessionIds: [...current.completedSessionIds, sessionId],
        }
      })
    }
    setActiveWorkout(null)
    stopRest()
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
    foodId,
    sourceType = 'manual',
    selectedUnitLabel = '1 serving',
    grams,
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
        foodId,
        sourceType,
        selectedUnitLabel,
        grams,
      }),
      ...current,
    ])
  }

  function quickAddSuggestedMeal(name) {
    const found =
      [...customFoods, ...foods].find((item) => getFoodAllNames(item).includes(name)) ||
      foodSuggestions.find((item) => item.name === name || item.localNames?.ko === name || item.localNames?.en === name)
    if (!found) {
      return
    }
    addMeal({
      name: found.name,
      calories: found.nutritionPerServing?.kcal || found.calories,
      protein: found.nutritionPerServing?.protein || found.protein,
      carbs: found.nutritionPerServing?.carbs || found.carbs || 0,
      fat: found.nutritionPerServing?.fat || found.fat || 0,
      mealType: found.mealType || 'lunch',
      favorite: found.favorite || false,
      foodId: found.id,
      sourceType: found.source === 'custom' ? 'custom' : 'canonical',
      selectedUnitLabel: found.defaultServingLabel || '1 serving',
    })
  }

  function addFoodToMeal({
    food,
    mealType,
    nutrition,
    quantity = 1,
    selectedUnitLabel = '1 serving',
    grams = null,
    loggedDate,
  }) {
    addMeal({
      name: food.name,
      calories: nutrition.kcal,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      mealType,
      serving: quantity,
      favorite: food.favorite || false,
      loggedDate,
      foodId: food.id,
      sourceType: food.source === 'custom' ? 'custom' : 'canonical',
      selectedUnitLabel,
      grams,
    })
  }

  function createCustomFood(payload) {
    const customFood = {
      id: `custom-food-${Date.now()}`,
      name: payload.name,
      localNames: {
        ko: payload.localNames?.ko || payload.name,
        en: payload.localNames?.en || payload.name,
      },
      normalizedName: payload.name.toLowerCase().trim().replace(/[^a-z0-9가-힣]+/g, ' ').trim(),
      brand: payload.brand || null,
      category: payload.category || 'Custom',
      keywords: payload.keywords || [],
      defaultServingLabel: payload.baseAmountLabel,
      defaultServingGrams: payload.baseAmountGrams || null,
      nutritionPerServing: payload.nutrition,
      nutritionPer100g: payload.baseAmountGrams === 100 ? payload.nutrition : null,
      servingUnits: payload.servingUnits || [],
      popularityScore: 0,
      verified: false,
      source: 'custom',
      createdAt: new Date().toISOString(),
    }

    setCustomFoods((current) => [customFood, ...current])

    const mergeCandidate = findFoodMergeCandidate({
      customFood,
      existingCustomFoods: customFoods,
      canonicalFoods: foods,
    })

    if (mergeCandidate) {
      setFoodMergeCandidates((current) => [mergeCandidate, ...current])
    }

    return customFood
  }

  function addPost({
    id,
    title,
    body,
    author = userProfile.name || 'You',
    authorId = 'me',
    type = 'tip',
    goalTag = goal,
    hashtags = [],
    photoCount = 0,
    hasVideo = false,
    attachWorkoutCard = false,
    attachDietCard = false,
    category = goal,
    coverImage = '',
    media = [],
    routineData,
    mealData,
    carouselSlides = [],
    aiMeta = null,
    estimatedReadSeconds = 20,
    status = 'published',
    createdAt = new Date().toISOString(),
  }) {
    setPosts((current) => [
      createPostRecord({
        id,
        title,
        body,
        author,
        authorId,
        category,
        type,
        goalTag,
        hashtags,
        photoCount,
        hasVideo,
        attachWorkoutCard,
        attachDietCard,
        coverImage,
        media,
        routineData,
        mealData,
        carouselSlides,
        aiMeta,
        estimatedReadSeconds,
        status,
        createdAt,
      }),
      ...current,
    ])
  }

  function toggleSavePost(postId) {
    const isSaved = savedPostIds.includes(postId)
    setSavedPostIds((current) =>
      isSaved ? current.filter((id) => id !== postId) : [...current, postId],
    )
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, saveCount: Math.max(0, (post.saveCount || 0) + (isSaved ? -1 : 1)) }
          : post,
      ),
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

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, comments: (post.comments || 0) + 1 }
          : post,
      ),
    )

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

  function useProgram(programId) {
    const program = programs.find((item) => item.id === programId)
    if (!program) {
      return
    }

    setPrograms((current) =>
      current.map((item) =>
        item.id === programId ? { ...item, useCount: (item.useCount || 0) + 1 } : item,
      ),
    )

    setActiveProgram({
      userId: 'me',
      programId,
      currentWeek: 1,
      currentDay: 1,
      startedAt: formatLocalDate(new Date()),
      lastCompletedAt: null,
      streakDays: 0,
      completedSessionIds: [],
    })
  }

  function toggleProgramLike(programId) {
    const alreadyLiked = programLikes.some((item) => item.programId === programId && item.userId === 'me')

    setProgramLikes((current) =>
      alreadyLiked
        ? current.filter((item) => !(item.programId === programId && item.userId === 'me'))
        : [...current, { programId, userId: 'me', createdAt: formatLocalDate(new Date()) }],
    )
    setPrograms((current) =>
      current.map((program) =>
        program.id === programId
          ? { ...program, likes: Math.max(0, (program.likes || 0) + (alreadyLiked ? -1 : 1)) }
          : program,
      ),
    )
  }

  function addProgramReview(programId, rating, content) {
    if (!content.trim()) {
      return
    }

    const nextReview = {
      id: `review-${Date.now()}`,
      programId,
      userId: 'me',
      authorName: 'You',
      rating,
      content,
      createdAt: formatLocalDate(new Date()),
    }

    setProgramReviews((current) => [nextReview, ...current])
    setPrograms((current) =>
      current.map((program) => {
        if (program.id !== programId) {
          return program
        }
        const nextCount = (program.reviewCount || 0) + 1
        const currentTotal = (program.averageRating || 0) * (program.reviewCount || 0)
        return {
          ...program,
          reviewCount: nextCount,
          averageRating: Number(((currentTotal + rating) / nextCount).toFixed(1)),
        }
      }),
    )
  }

  function createProgram(payload) {
    const programId = `program-${Date.now()}`
    const normalizedWeeks = payload.weeks.map((week, weekIndex) => ({
      id: `${programId}-week-${weekIndex + 1}`,
      weekIndex: week.weekIndex || weekIndex + 1,
      title: week.title || `Week ${weekIndex + 1}`,
      days: week.days.map((day, dayIndex) => ({
        id: `${programId}-week-${weekIndex + 1}-day-${dayIndex + 1}`,
        dayIndex: day.dayIndex || dayIndex + 1,
        title: day.title || `Day ${dayIndex + 1}`,
        focus: day.focus || inferProgramCategoryFromExercises(day.exercises),
        exercises: day.exercises.map((exerciseName, exerciseIndex) => ({
          id: `${programId}-week-${weekIndex + 1}-day-${dayIndex + 1}-exercise-${exerciseIndex + 1}`,
          exerciseName,
          category: findCategoryByExercise(exerciseName),
          sets: 3,
          repsGuide: '8-12',
        })),
      })),
    }))

    const nextProgram = {
      id: programId,
      title: payload.title,
      name: payload.title,
      description: payload.description,
      category: payload.category,
      difficulty: payload.difficulty,
      durationWeeks: payload.durationWeeks,
      sessionsPerWeek: payload.sessionsPerWeek,
      goal: payload.goal,
      authorId: 'me',
      authorName: 'You',
      visibility: payload.visibility,
      likes: 0,
      useCount: 0,
      reviewCount: 0,
      averageRating: 0,
      tags: payload.tags || [],
      coverImage: null,
      weeks: normalizedWeeks,
    }

    setPrograms((current) => [nextProgram, ...current])
    setActiveProgram({
      userId: 'me',
      programId,
      currentWeek: 1,
      currentDay: 1,
      startedAt: formatLocalDate(new Date()),
      lastCompletedAt: null,
      streakDays: 0,
      completedSessionIds: [],
    })
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

  function updateSession(sessionId, patch) {
    setSessions((current) =>
      current.map((session) => {
        if (session.id !== sessionId) {
          return session
        }

        const nextSession = { ...session, ...patch }
        const recalculated = buildSessionMetrics(nextSession)

        return {
          ...nextSession,
          exercises: recalculated.exercises,
          totalVolume: recalculated.totalVolume,
          prCount: recalculated.prCount,
          calories: recalculated.calories,
        }
      }),
    )

    setLastWorkoutSummary((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        ...(patch.title ? { title: patch.title } : {}),
        ...(patch.date ? { date: patch.date } : {}),
      }
    })
  }

  function deleteSession(sessionId) {
    const targetSession = sessions.find((session) => session.id === sessionId)
    setSessions((current) => current.filter((session) => session.id !== sessionId))
    setLastWorkoutSummary((current) => {
      if (!current || !targetSession) {
        return current
      }

      return current.title === targetSession.title && current.date === targetSession.date ? null : current
    })
    setActiveProgram((current) =>
      current
        ? {
            ...current,
            completedSessionIds: current.completedSessionIds.filter((id) => id !== sessionId),
          }
        : current,
    )
  }

  function resetAllData() {
    setGoal('maintain')
    setAppLanguage('en')
    setSteps(11284)
    setUserProfile(createDefaultUserProfile('maintain'))
    setHealthConnection(createDefaultHealthConnection(11284))
    setWeightHistory([
      {
        id: `weight-${Date.now()}`,
        date: formatLocalDate(new Date()),
        weightKg: createDefaultUserProfile('maintain').weightKg,
        source: 'profile',
      },
    ])
    setLastWeightCheckInDate(formatLocalDate(new Date()))
    setSets(initialSets)
    setMeals(initialMeals)
    setPosts(initialPosts)
    setPrograms(initialPrograms)
    setActiveProgram({
      userId: 'me',
      programId: initialPrograms[0]?.id || null,
      currentWeek: 1,
      currentDay: 1,
      startedAt: formatLocalDate(new Date()),
      lastCompletedAt: null,
      streakDays: 6,
      completedSessionIds: [],
    })
    setProgramLikes([])
    setProgramReviews([])
    setExerciseDatabase(exerciseDatabaseSeed)
    setFoods(foodSeed)
    setCustomFoods([])
    setFoodMergeCandidates([])
    setSessions(initialSessions)
    setSavedPostIds([])
    setLikedPostIds([])
    setHiddenPostIds([])
    setReportedPostIds([])
    setFollowedAuthors(['Mina'])
    setCommentsByPost(defaultCommentsByPost)
    setShareEvents([])
    setActiveWorkout(null)
    setRestStartedAt(null)
    setLastWorkoutSummary(null)
    clearDashboardState()
  }

  const outletContext = {
    goal,
    setGoal,
    appLanguage,
    setAppLanguage,
    userProfile,
    updateUserProfile,
    healthConnection,
    updateHealthConnection,
    weightHistory,
    lastWeightCheckInDate,
    nextWeightCheckInDate,
    weightReminderDue,
    recordWeightCheckIn,
    foodNameLanguage,
    setFoodNameLanguage,
    steps,
    setSteps,
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
    activeProgram,
    currentProgramDay,
    programLikes,
    programReviews,
    streakDays,
    aiCoach,
    foodSuggestions,
    foods,
    customFoods,
    foodMergeCandidates,
    exerciseDatabase,
    sessions,
    activeWorkout,
    restStartedAt,
    isResting,
    currentRestElapsed,
    currentProgram,
    quickTemplates,
    categoryLabels,
    workoutCatalog,
    useProgram,
    toggleProgramLike,
    addProgramReview,
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
    stopRest,
    finishWorkout,
    lastWorkoutSummary,
    nowTick,
    logSet,
    addMeal,
    addFoodToMeal,
    quickAddSuggestedMeal,
    createCustomFood,
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
    updateSession,
    deleteSession,
    resetAllData,
    totalWorkoutCalories,
    totalVolume,
    consumedCalories,
    totalProtein,
    activityCalories,
    stepCalories,
    baseMetabolism,
    totalBurn,
    netCalories,
    recommendedCalories,
    recommendedCaloriesRange,
    fatigueScore,
    fatigueLabel,
    fatigueByMuscle,
    muscleFatigueScores,
    recoveryRecommendation,
    weeklyWorkoutMinutes,
    weeklyStepAverage,
    weeklyData,
  }

  const currentSection = getSectionMeta(location.pathname, appLanguage)
  const navigation = getNavigation(appLanguage)
  const showBackButton = !isPrimaryTabRoute(location.pathname)
  const activeWorkoutMinutes = activeWorkout
    ? Math.max(1, Math.floor((nowTick - activeWorkout.startedAt) / 60000))
    : 0
  const restClock = `${String(Math.floor(currentRestElapsed / 60)).padStart(2, '0')}:${String(currentRestElapsed % 60).padStart(2, '0')}`
  const showRestBanner = activeWorkout && isResting

  function handleBackNavigation() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/train')
  }

  return (
    <div className="dashboard-shell">
      <aside className={sidebarOpen ? `sidebar is-open${sidebarCollapsed ? ' is-collapsed' : ''}` : `sidebar${sidebarCollapsed ? ' is-collapsed' : ''}`}>
        <div className="sidebar-brand">
          <button
            type="button"
            className="sidebar-mark"
            aria-label={tx(appLanguage, '사이드바 접기 또는 펼치기', 'Toggle sidebar')}
            onClick={() => setSidebarCollapsed((current) => !current)}
          >
            FF
          </button>
          <div className="sidebar-brand-copy">
            <strong>FitFlow</strong>
            <p>{tx(appLanguage, '커넥트, 운동, 식단, AI', 'Connect, Train, Nutrition, AI')}</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label={tx(appLanguage, '사이드바', 'Sidebar')}>
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

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-language-button single"
            aria-label={tx(appLanguage, '언어 전환', 'Toggle language')}
            onClick={() => setAppLanguage((current) => (current === 'ko' ? 'en' : 'ko'))}
          >
            {appLanguage === 'ko' ? 'KR' : 'EN'}
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label={tx(appLanguage, '사이드바 닫기', 'Close sidebar')}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={sidebarCollapsed ? 'content-shell is-collapsed' : 'content-shell'}>
        <header className="content-topbar">
          {showBackButton ? (
            <button
              type="button"
              className="back-button"
              aria-label={tx(appLanguage, '뒤로 가기', 'Go back')}
              onClick={handleBackNavigation}
            >
              <AppIcon name="back" size="sm" />
            </button>
          ) : null}

          <button
            type="button"
            className="menu-toggle"
            aria-label={tx(appLanguage, '메뉴 열기', 'Toggle sidebar')}
            onClick={() => setSidebarOpen((current) => !current)}
          >
            <AppIcon name="menu" size="sm" />
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

        {showRestBanner ? (
          <button
            type="button"
            className="rest-banner"
            onClick={() => navigate('/train/workout')}
          >
            <span>{tx(appLanguage, `휴식 ${restClock}`, `Rest ${restClock}`)}</span>
            <strong>{activeWorkout.title}</strong>
          </button>
        ) : null}

        <main className="content-main">
          <Outlet context={outletContext} />
        </main>
      </div>

      <nav className="mobile-tabbar" aria-label={tx(appLanguage, '하단 탭', 'Bottom tabs')}>
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
