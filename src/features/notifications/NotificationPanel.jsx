import { resolveHydratedProfileName } from '../../utils/profileHydration.js'

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
  profileMap,
  unreadCount,
  loading,
  error,
  onClose,
  onRefresh,
  onMarkAllRead,
  onMarkOneRead,
}) {
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
                <strong>{resolveHydratedProfileName(profileMap, item.actorId)}</strong>
                <span>{formatRelativeTime(item.createdAt)}</span>
              </div>
              <p>{buildNotificationMessage(item)}</p>
            </article>
          ))}
        </div>
      </aside>
    </>
  )
}

export default NotificationPanel
