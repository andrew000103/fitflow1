import { supabase } from '../lib/supabase.js'

export function normalizeUserIds(userIds = []) {
  return [...new Set(userIds.map((userId) => String(userId || '').trim()).filter(Boolean))]
}

export async function loadProfileMapByUserIds(userIds = []) {
  const normalizedIds = normalizeUserIds(userIds)

  if (!normalizedIds.length) {
    return {}
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, avatar_url')
    .in('user_id', normalizedIds)

  if (error) {
    throw error
  }

  const profileMap = (Array.isArray(data) ? data : []).reduce((acc, item) => {
    const profileUserId = String(item?.user_id || '').trim()

    if (profileUserId) {
      acc[profileUserId] = {
        user_id: profileUserId,
        username: item?.username || '',
        display_name: item?.display_name || '',
        avatar_url: item?.avatar_url || '',
      }
    }

    return acc
  }, {})

  if (import.meta.env.DEV) {
    const missingUserIds = normalizedIds.filter((userId) => !profileMap[userId])
    if (missingUserIds.length > 0) {
      console.warn('[FitFlow] Missing hydrated profiles for user ids:', missingUserIds)
    }
  }

  return profileMap
}

export function resolveHydratedProfileName(profileMap, userId, fallback = '사용자') {
  const profile = profileMap?.[String(userId || '').trim()]
  const displayName = String(profile?.display_name || '').trim()
  const username = String(profile?.username || '').trim()

  return displayName || username || fallback
}
