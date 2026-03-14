import { supabase } from '../../lib/supabase.js'

const POSTS_TABLE = 'posts'
const EVENTS_TABLE = 'activity_feed_events'

function formatTodayLabel() {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
  }).format(new Date())
}

export async function createSampleGeneralPost(userId) {
  const { error } = await supabase.from(POSTS_TABLE).insert({
    author_id: userId,
    title: `${formatTodayLabel()} 한 줄 기록`,
    body: '오늘도 리듬을 놓치지 않고 차분하게 이어갔어요.',
    post_type: 'general',
    metadata: {
      summary: '가볍게 남기는 오늘의 상태 기록',
      source: 'dev_seed',
    },
  })

  if (error) throw error
}

export async function createSampleWorkoutSummaryPost(userId) {
  const { error } = await supabase.from(POSTS_TABLE).insert({
    author_id: userId,
    title: '오늘의 운동 요약',
    body: '등 운동 6세트와 보조 운동까지 깔끔하게 마무리했어요.',
    post_type: 'workout_summary',
    metadata: {
      summary: '총 42분, 18세트, 루틴 완료',
      workout_minutes: 42,
      total_sets: 18,
      source: 'dev_seed',
    },
  })

  if (error) throw error
}

export async function createSamplePrPost(userId) {
  const { error } = await supabase.from(POSTS_TABLE).insert({
    author_id: userId,
    title: 'PR 달성',
    body: '바벨 로우에서 최고 중량과 볼륨을 함께 갱신했어요.',
    post_type: 'pr',
    metadata: {
      exercise_name: '바벨 로우',
      weight_kg: 100,
      reps: 8,
      source: 'dev_seed',
    },
  })

  if (error) throw error
}

export async function createWorkoutCompletedEvent(userId) {
  const { error } = await supabase.from(EVENTS_TABLE).insert({
    user_id: userId,
    event_type: 'workout_completed',
    payload: {
      summary: '오늘 루틴을 끝까지 완료했어요.',
      workout_title: 'Pull Day',
      duration_minutes: 47,
      created_by: 'dev_seed',
    },
  })

  if (error) throw error
}

export async function createStreakMilestoneEvent(userId) {
  const { error } = await supabase.from(EVENTS_TABLE).insert({
    user_id: userId,
    event_type: 'streak_milestone',
    payload: {
      streak_days: 14,
      summary: '2주 연속 기록을 이어가고 있어요.',
      created_by: 'dev_seed',
    },
  })

  if (error) throw error
}
