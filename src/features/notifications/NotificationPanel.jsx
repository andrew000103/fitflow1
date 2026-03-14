import { useState } from 'react'
import { acceptCrewRequest, declineCrewRequest } from '../social/socialApi.ts'

function formatRelativeTime(value) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()

  if (Number.isNaN(date.getTime()) || diffMs < 0) {
    return ''
  }

  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) return '방금 전'
  if (diffMinutes < 60) return `${diffMinutes}분 전`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}시간 전`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}일 전`

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

function buildNotificationMessage(item) {
  if (item.type === 'support_received') {
    return '회원님을 응원하기 시작했어요'
  }
  if (item.type === 'crew_request_received') {
    return '크루 요청을 보냈어요'
  }
  if (item.type === 'crew_request_accepted') {
    return '회원님의 크루 요청을 수락했어요'
  }
  if (item.type === 'post_commented') {
    return '회원님의 게시물에 댓글을 남겼어요'
  }
  if (item.type === 'post_reacted') {
    return '회원님의 게시물에 반응을 남겼어요'
  }
  return '새 알림이 도착했어요'
}

function NotificationPanel({
  userId,
  notifications,
  unreadCount,
  loading,
  error,
  onClose,
  onRefresh,
  onMarkAllRead,
  onMarkOneRead,
}) {
  const [pendingActionId, setPendingActionId] = useState('')
  const [actionError, setActionError] = useState('')

  async function handleCrewRequestAction(item, action) {
    if (!userId || !item.actorId) {
      return
    }

    setPendingActionId(`${item.id}-${action}`)
    setActionError('')

    try {
      if (action === 'accept') {
        await acceptCrewRequest(userId, item.actorId)
      }

      if (action === 'decline') {
        await declineCrewRequest(userId, item.actorId)
      }

      await onMarkOneRead(item.id)
      await onRefresh?.()
    } catch (error) {
      setActionError(error.message || '요청을 처리하지 못했어요.')
    } finally {
      setPendingActionId('')
    }
  }

  return (
    <>
      <button type="button" className="notification-backdrop" aria-label="알림 닫기" onClick={onClose} />
      <aside className="notification-panel">
        <div className="notification-panel-head">
          <div>
            <span className="card-kicker">알림</span>
            <h2>새 소식</h2>
          </div>
          <div className="notification-panel-actions">
            {unreadCount > 0 ? (
              <button type="button" className="inline-action" onClick={onMarkAllRead}>
                전체 읽음 처리
              </button>
            ) : null}
            <button type="button" className="inline-action" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>

        {loading ? <div className="notification-panel-state">알림을 불러오는 중...</div> : null}
        {error ? <div className="notification-panel-state error">{error}</div> : null}
        {actionError ? <div className="notification-panel-state error">{actionError}</div> : null}

        {!loading && !error && notifications.length === 0 ? (
          <div className="notification-panel-state">아직 도착한 알림이 없어요.</div>
        ) : null}

        <div className="notification-list">
          {notifications.map((item) => (
            <article
              key={item.id}
              className={item.isRead ? 'notification-item' : 'notification-item unread'}
              onClick={() => {
                if (!item.isRead) {
                  onMarkOneRead(item.id)
                }
              }}
            >
              <div className="notification-item-head">
                <strong>{item.actorName}</strong>
                <span>{formatRelativeTime(item.createdAt)}</span>
              </div>
              <p>{buildNotificationMessage(item)}</p>

              {item.type === 'crew_request_received' ? (
                <div className="notification-item-actions">
                  <button
                    type="button"
                    className="inline-action primary-dark"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleCrewRequestAction(item, 'accept')
                    }}
                    disabled={Boolean(pendingActionId)}
                  >
                    {pendingActionId === `${item.id}-accept` ? '처리 중...' : '요청 수락'}
                  </button>
                  <button
                    type="button"
                    className="inline-action"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleCrewRequestAction(item, 'decline')
                    }}
                    disabled={Boolean(pendingActionId)}
                  >
                    {pendingActionId === `${item.id}-decline` ? '처리 중...' : '요청 거절'}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </aside>
    </>
  )
}

export default NotificationPanel
