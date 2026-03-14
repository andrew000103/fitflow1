function SupportButton({ status = 'not_supported', loading = false, onToggle }) {
  const isActive = status === 'supported'

  if (isActive) {
    return (
      <div className="profile-social-button-row">
        <button type="button" className="profile-social-button is-active" disabled>
          응원 중
        </button>
        <button type="button" className="profile-social-button is-muted" onClick={onToggle} disabled={loading}>
          {loading ? '처리 중...' : '응원 취소'}
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="profile-social-button"
      onClick={onToggle}
      disabled={loading}
    >
      {loading ? '처리 중...' : '응원하기'}
    </button>
  )
}

export default SupportButton
