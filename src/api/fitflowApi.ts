export const DASHBOARD_STATE_KEY = 'fitflow-dashboard-state'

export interface DashboardStatePayload {
  goal?: string
  userProfile?: unknown
  healthConnection?: unknown
  weightHistory?: unknown[]
  lastWeightCheckInDate?: string
  steps?: number
  sets?: unknown[]
  meals?: unknown[]
  posts?: unknown[]
  programs?: unknown[]
  activeProgram?: unknown
  programLikes?: unknown[]
  programReviews?: unknown[]
  exerciseDatabase?: unknown[]
  sessions?: unknown[]
  savedPostIds?: Array<string | number>
  likedPostIds?: Array<string | number>
  hiddenPostIds?: Array<string | number>
  reportedPostIds?: Array<string | number>
  followedAuthors?: string[]
  commentsByPost?: Record<string, unknown>
  shareEvents?: unknown[]
  lastWorkoutSummary?: unknown
  foods?: unknown[]
  customFoods?: unknown[]
  foodMergeCandidates?: unknown[]
  appLanguage?: string
  foodNameLanguage?: string
}

export function loadDashboardState(): DashboardStatePayload {
  if (typeof window === 'undefined') {
    return {}
  }

  const raw = window.localStorage.getItem(DASHBOARD_STATE_KEY)
  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function saveDashboardState(payload: DashboardStatePayload) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(DASHBOARD_STATE_KEY, JSON.stringify(payload))
}

export function clearDashboardState() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(DASHBOARD_STATE_KEY)
}

export function createPostRecord({
  id,
  title,
  body,
  author = 'You',
  authorId = 'me',
  category,
  type = 'tip',
  goalTag = category,
  hashtags = [],
  photoCount = 0,
  hasVideo = false,
  attachWorkoutCard = false,
  attachDietCard = false,
  coverImage = '',
  media = [],
  routineData,
  mealData,
  carouselSlides = [],
  aiMeta = null,
  estimatedReadSeconds = 20,
  mediaCount,
  status = 'published',
  createdAt = new Date().toISOString(),
}: {
  id?: string | number
  title: string
  body: string
  author?: string
  authorId?: string
  category: string
  type?: string
  goalTag?: string
  hashtags?: string[]
  photoCount?: number
  hasVideo?: boolean
  attachWorkoutCard?: boolean
  attachDietCard?: boolean
  coverImage?: string
  media?: unknown[]
  routineData?: unknown
  mealData?: unknown
  carouselSlides?: unknown[]
  aiMeta?: unknown
  estimatedReadSeconds?: number
  mediaCount?: number
  status?: string
  createdAt?: string
}) {
  return {
    id: id || Date.now(),
    category,
    title,
    author,
    authorId,
    body,
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
    mediaCount: mediaCount ?? (Array.isArray(media) ? media.length : 0),
    status,
    createdAt,
    likes: 0,
    comments: 0,
    hidden: false,
  }
}

export function createMealRecord({
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
}: {
  name: string
  calories: number
  protein: number
  carbs?: number
  fat?: number
  mealType?: string
  serving?: number
  favorite?: boolean
  loggedDate: string
  foodId?: string
  sourceType?: string
  selectedUnitLabel?: string
  grams?: number
}) {
  return {
    id: Date.now(),
    name,
    calories,
    protein,
    carbs,
    fat,
    mealType,
    serving,
    favorite,
    loggedDate,
    foodId,
    sourceType,
    selectedUnitLabel,
    grams,
    createdAt: 'Just now',
  }
}

export function createCommentRecord(content: string) {
  return {
    id: `comment-${Date.now()}`,
    author: 'You',
    content: content.trim(),
    replies: [],
  }
}

export function createReplyRecord(content: string) {
  return {
    id: `reply-${Date.now()}`,
    author: 'You',
    content: content.trim(),
  }
}

export function createShareEvent(postId: string | number) {
  return {
    id: `share-${Date.now()}`,
    postId,
    createdAt: Date.now(),
  }
}
