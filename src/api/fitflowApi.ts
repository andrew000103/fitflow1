export const DASHBOARD_STATE_KEY = 'fitflow-dashboard-state'

export interface DashboardStatePayload {
  goal?: string
  steps?: number
  sets?: unknown[]
  meals?: unknown[]
  posts?: unknown[]
  programs?: unknown[]
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
  title,
  body,
  author = 'You',
  category,
  type = 'tip',
  goalTag = category,
  hashtags = [],
  photoCount = 0,
  hasVideo = false,
  attachWorkoutCard = false,
  attachDietCard = false,
}: {
  title: string
  body: string
  author?: string
  category: string
  type?: string
  goalTag?: string
  hashtags?: string[]
  photoCount?: number
  hasVideo?: boolean
  attachWorkoutCard?: boolean
  attachDietCard?: boolean
}) {
  return {
    id: Date.now(),
    category,
    title,
    author,
    body,
    type,
    goalTag,
    hashtags,
    photoCount,
    hasVideo,
    attachWorkoutCard,
    attachDietCard,
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
