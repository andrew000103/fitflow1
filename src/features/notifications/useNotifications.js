import { useCallback, useEffect, useState } from 'react'
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeNotificationsChanged,
} from './notificationApi.ts'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    setLoading(true)
    setError('')

    try {
      const [items, unread] = await Promise.all([
        fetchNotifications(userId),
        fetchUnreadNotificationCount(userId),
      ])

      setNotifications(items)
      setUnreadCount(unread)
    } catch (nextError) {
      setError(nextError.message || '알림을 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    return subscribeNotificationsChanged(() => {
      refresh()
    })
  }, [refresh])

  const markOneRead = useCallback(
    async (notificationId) => {
      if (!userId) return
      await markNotificationAsRead(notificationId, userId)
      await refresh()
    },
    [refresh, userId],
  )

  const markAllRead = useCallback(async () => {
    if (!userId) return
    await markAllNotificationsAsRead(userId)
    await refresh()
  }, [refresh, userId])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markOneRead,
    markAllRead,
  }
}
