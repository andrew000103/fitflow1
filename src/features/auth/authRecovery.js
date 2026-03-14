export const AUTH_FLOW_QUERY_KEY = 'auth_flow'
export const RESET_PASSWORD_FLOW = 'reset-password'
export const RECOVERY_TOKENS_STORAGE_KEY = 'fitflow_recovery_tokens'

export function getAuthRedirectUrl() {
  if (typeof window === 'undefined') {
    return undefined
  }

  return `${window.location.origin}${window.location.pathname}`
}

// Supabase recovery links return tokens in the URL hash. Because this app uses
// HashRouter, we normalize that one-time URL before React mounts so the router
// can still render /auth/reset-password while we keep the recovery tokens safe.
export function captureRecoveryTokensFromUrl() {
  if (typeof window === 'undefined') {
    return
  }

  const searchParams = new URLSearchParams(window.location.search)
  const requestedFlow = searchParams.get(AUTH_FLOW_QUERY_KEY)
  const rawHash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash

  if (requestedFlow !== RESET_PASSWORD_FLOW || !rawHash || rawHash.startsWith('/')) {
    return
  }

  const hashParams = new URLSearchParams(rawHash)
  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')
  const recoveryType = hashParams.get('type')

  if (!accessToken || !refreshToken || recoveryType !== 'recovery') {
    return
  }

  window.sessionStorage.setItem(
    RECOVERY_TOKENS_STORAGE_KEY,
    JSON.stringify({
      accessToken,
      refreshToken,
      type: recoveryType,
    }),
  )

  window.history.replaceState(
    {},
    document.title,
    `${window.location.origin}${window.location.pathname}?${AUTH_FLOW_QUERY_KEY}=${RESET_PASSWORD_FLOW}#/auth/reset-password`,
  )
}

export function getPasswordRecoveryRedirectUrl() {
  if (typeof window === 'undefined') {
    return undefined
  }

  return `${window.location.origin}${window.location.pathname}?${AUTH_FLOW_QUERY_KEY}=${RESET_PASSWORD_FLOW}`
}

export function readStoredRecoveryTokens() {
  if (typeof window === 'undefined') {
    return null
  }

  const rawTokens = window.sessionStorage.getItem(RECOVERY_TOKENS_STORAGE_KEY)

  if (!rawTokens) {
    return null
  }

  try {
    return JSON.parse(rawTokens)
  } catch {
    return null
  }
}

export function clearStoredRecoveryTokens() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(RECOVERY_TOKENS_STORAGE_KEY)
}
