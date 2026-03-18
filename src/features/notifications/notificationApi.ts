import { supabase } from '../../lib/supabase.js'
import { loadProfileMapByUserIds, normalizeUserIds } from '../../utils/profileHydration.js'

const NOTIFICATIONS_TABLE = 'notifications'
const PROFILES_TABLE = 'profiles'
const NOTIFICATION_EVENT = 'fitflow:notifications-changed'

export type NotificationType =
  | 'post_commented'
  | 'post_reacted'

export interface NotificationItem {
  id: string
  userId: string
  actorId: string
  type: NotificationType
  referenceId: string | null
  payload: Record<string, unknown>
  isRead: boolean
  createdAt: string
}

export interface NotificationListResult {
  items: NotificationItem[]
  profileMap: Record<string, { user_id?: string; username?: string | null; display_name?: string | null; avatar_url?: string | null }>
}

function toArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : []
}

export function emitNotificationsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT))
  }
}

export function subscribeNotificationsChanged(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  window.addEventListener(NOTIFICATION_EVENT, callback)
  return () => window.removeEventListener(NOTIFICATION_EVENT, callback)
}

export async function fetchNotifications(userId: string, limit = 40): Promise<NotificationListResult> {
  const { data, error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .select('id, user_id, actor_id, type, reference_id, payload, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  const rows = toArray<Record<string, unknown>>(data)
  const actorIds = normalizeUserIds(rows.map((row) => String(row.actor_id || '')))
  const profileMap = await loadProfileMapByUserIds(actorIds)

  return {
    items: rows.map((row) => {
    const actorId = String(row.actor_id || '')

    return {
      id: String(row.id || ''),
      userId: String(row.user_id || ''),
      actorId,
      type: String(row.type || '') as NotificationType,
      referenceId: row.reference_id ? String(row.reference_id) : null,
      payload: (row.payload as Record<string, unknown>) || {},
      isRead: Boolean(row.is_read),
      createdAt: String(row.created_at || new Date().toISOString()),
    }
    }),
    profileMap,
  }
}

export async function fetchUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    throw error
  }

  return count || 0
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const { error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  emitNotificationsChanged()
}

export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    throw error
  }

  emitNotificationsChanged()
}

type CreateNotificationInput = {
  userId: string
  actorId: string
  type: NotificationType
  referenceId?: string | null
  payload?: Record<string, unknown>
}

export async function createNotification(input: CreateNotificationInput) {
  if (!input.userId || !input.actorId || input.userId === input.actorId) {
    return
  }

  let duplicateQuery = supabase
    .from(NOTIFICATIONS_TABLE)
    .select('id')
    .eq('user_id', input.userId)
    .eq('actor_id', input.actorId)
    .eq('type', input.type)
    .eq('is_read', false)

  if (input.referenceId) {
    duplicateQuery = duplicateQuery.eq('reference_id', input.referenceId)
  }

  const { data: duplicateRows, error: duplicateError } = await duplicateQuery.limit(1)

  if (duplicateError) {
    throw duplicateError
  }

  if (toArray(duplicateRows).length > 0) {
    return
  }

  const { error } = await supabase.from(NOTIFICATIONS_TABLE).insert({
    user_id: input.userId,
    actor_id: input.actorId,
    type: input.type,
    reference_id: input.referenceId || null,
    payload: input.payload || {},
    is_read: false,
  })

  if (error) {
    throw error
  }

  emitNotificationsChanged()
}
