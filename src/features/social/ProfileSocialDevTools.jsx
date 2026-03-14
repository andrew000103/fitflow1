import { useState } from 'react'
import { Link } from 'react-router-dom'

function ProfileSocialDevTools({ currentUserId, activeProfileUserId }) {
  const [targetUserId, setTargetUserId] = useState('')

  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <article className="content-card profile-dev-card">
      <div className="feed-head">
        <div>
          <span className="profile-section-kicker">dev</span>
          <h2>소셜 테스트</h2>
          <p>다른 사용자 ID로 바로 프로필 이동해서 응원/크루 흐름을 테스트할 수 있어요.</p>
        </div>
      </div>

      <div className="profile-dev-meta">
        <span>내 ID: {currentUserId || '-'}</span>
        <span>현재 프로필 ID: {activeProfileUserId || '-'}</span>
      </div>

      <div className="profile-dev-actions">
        <input
          className="auth-input"
          value={targetUserId}
          onChange={(event) => setTargetUserId(event.target.value)}
          placeholder="테스트할 사용자 ID"
        />
        <Link className="inline-action primary-dark" to={targetUserId.trim() ? `/profile/${targetUserId.trim()}` : '/profile/me'}>
          프로필 열기
        </Link>
      </div>
    </article>
  )
}

export default ProfileSocialDevTools
