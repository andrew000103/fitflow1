function getActivityBadge(item) {
  if (item.eventType?.includes('pr')) {
    return 'PR'
  }
  if (item.eventType?.includes('streak')) {
    return '연속 기록'
  }
  if (item.eventType?.includes('challenge')) {
    return '챌린지'
  }
  return '활동'
}

function getActivityMetric(item) {
  const payload = item.eventPayload || {}

  if (item.eventType?.includes('pr')) {
    const weight = payload.weight_kg || payload.weightKg
    const reps = payload.reps
    return weight && reps ? `${weight}kg x ${reps}` : '최고 기록 달성'
  }

  if (item.eventType?.includes('streak')) {
    const streakDays = payload.streak_days || payload.streakDays
    return streakDays ? `${streakDays}일 연속` : '루틴 유지 중'
  }

  if (item.eventType?.includes('challenge')) {
    return String(payload.challenge_title || payload.challengeTitle || '오늘 챌린지 진행')
  }

  return '새 활동'
}

function ActivityFeedCard({ item }) {
  return (
    <article className={`social-feed-card activity ${item.challenge ? 'challenge' : ''}`}>
      <div className="social-feed-card-head">
        <div>
          <span className="social-feed-badge accent">{getActivityBadge(item)}</span>
          <strong>{item.actorName}</strong>
        </div>
        <span className="social-feed-time">{new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(new Date(item.createdAt))}</span>
      </div>

      <div className="social-activity-body">
        <div className="social-activity-metric">{getActivityMetric(item)}</div>
        <div className="social-feed-copy">
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </div>
      </div>
    </article>
  )
}

export default ActivityFeedCard
