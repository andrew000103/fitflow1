function CrewButton({
  status = 'none',
  loading = false,
  onSend,
  onCancel,
  onAccept,
  onDecline,
}) {
  if (status === 'incoming_request') {
    return (
      <div className="profile-social-button-row">
        <button type="button" className="profile-social-button is-active" onClick={onAccept} disabled={loading}>
          {loading ? '처리 중...' : '요청 수락'}
        </button>
        <button type="button" className="profile-social-button is-muted" onClick={onDecline} disabled={loading}>
          요청 거절
        </button>
      </div>
    )
  }

  if (status === 'outgoing_request') {
    return (
      <button type="button" className="profile-social-button is-muted" onClick={onCancel} disabled={loading}>
        {loading ? '처리 중...' : '요청 취소'}
      </button>
    )
  }

  if (status === 'crew') {
    return (
      <button type="button" className="profile-social-button is-active" disabled>
        크루 중
      </button>
    )
  }

  return (
    <button type="button" className="profile-social-button" onClick={onSend} disabled={loading}>
      {loading ? '처리 중...' : '크루 요청'}
    </button>
  )
}

export default CrewButton
