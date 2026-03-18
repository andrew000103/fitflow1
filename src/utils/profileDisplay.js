export function resolveProfileDisplayName(profile, fallback = '사용자') {
  const displayName = typeof profile?.display_name === 'string' ? profile.display_name.trim() : typeof profile?.displayName === 'string' ? profile.displayName.trim() : ''
  if (displayName) {
    return displayName
  }

  const username = typeof profile?.username === 'string' ? profile.username.trim() : ''
  if (username) {
    return username
  }

  const nickname = typeof profile?.nickname === 'string' ? profile.nickname.trim() : ''
  if (nickname) {
    return nickname
  }

  return fallback
}
