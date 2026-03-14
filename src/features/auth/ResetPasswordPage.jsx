import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LanguageToggle from '../language/LanguageToggle.jsx'
import { useLanguage } from '../language/useLanguage.js'
import { supabase } from '../../lib/supabase.js'
import {
  AUTH_FLOW_QUERY_KEY,
  RESET_PASSWORD_FLOW,
  clearStoredRecoveryTokens,
  readStoredRecoveryTokens,
} from './authRecovery.js'
import '../../styles/auth.css'

function hasResetPasswordFlowFlag() {
  if (typeof window === 'undefined') {
    return false
  }

  return new URLSearchParams(window.location.search).get(AUTH_FLOW_QUERY_KEY) === RESET_PASSWORD_FLOW
}

export default function ResetPasswordPage() {
  const { text } = useLanguage('auth')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const canEditPassword = status === 'ready' || status === 'submitting'

  useEffect(() => {
    let active = true

    async function initializeRecovery() {
      if (!hasResetPasswordFlowFlag()) {
        if (active) {
          setStatus('invalid')
          setMessage(text.resetPasswordInvalidLink)
        }
        return
      }

      const storedTokens = readStoredRecoveryTokens()

      if (storedTokens?.accessToken && storedTokens?.refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: storedTokens.accessToken,
          refresh_token: storedTokens.refreshToken,
        })

        clearStoredRecoveryTokens()

        if (error) {
          if (active) {
            setStatus('invalid')
            setMessage(error.message || text.resetPasswordInvalidLink)
          }
          return
        }

        if (active) {
          setStatus('ready')
        }
        return
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (!active) {
        return
      }

      if (error) {
        setStatus('invalid')
        setMessage(error.message || text.resetPasswordInvalidLink)
        return
      }

      if (!session) {
        setStatus('invalid')
        setMessage(text.resetPasswordMissingSession)
        return
      }

      setStatus('ready')
    }

    initializeRecovery()

    return () => {
      active = false
    }
  }, [text.resetPasswordInvalidLink, text.resetPasswordMissingSession])

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    if (password.length < 8) {
      setStatus('ready')
      setMessage(text.resetPasswordTooShort)
      return
    }

    if (password !== confirmPassword) {
      setStatus('ready')
      setMessage(text.resetPasswordMismatch)
      return
    }

    setStatus('submitting')

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        throw error
      }

      await supabase.auth.signOut()
      clearStoredRecoveryTokens()
      setStatus('success')
      setMessage(text.resetPasswordSuccess)
    } catch (submitError) {
      setStatus('ready')
      setMessage(submitError.message || text.resetPasswordError)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-layout auth-layout-compact">
        <div className="auth-card">
          <div className="auth-card-top">
            <div>
              <span className="auth-kicker">FitFlow Access</span>
              <h1>{text.resetPasswordTitle}</h1>
              <p className="auth-subtitle">{text.resetPasswordSubtitle}</p>
            </div>
            <LanguageToggle compact />
          </div>

          {status === 'loading' ? (
            <p className="auth-message">{text.processing}</p>
          ) : null}

          {canEditPassword ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <input
                type="password"
                placeholder={text.newPasswordPlaceholder}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="auth-input"
                autoComplete="new-password"
                required
              />

              <input
                type="password"
                placeholder={text.confirmPasswordPlaceholder}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="auth-input"
                autoComplete="new-password"
                required
              />

              <button
                type="submit"
                className="auth-primary-button"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? text.processing : text.resetPasswordAction}
              </button>
            </form>
          ) : null}

          {message ? (
            <p className={status === 'invalid' ? 'auth-message auth-message-error' : 'auth-message'}>
              {message}
            </p>
          ) : null}

          {status === 'success' ? (
            <div className="auth-inline-link-row auth-inline-link-row-spaced">
              <button
                type="button"
                className="auth-inline-link auth-inline-link-button"
                onClick={() => navigate('/auth', { replace: true })}
              >
                {text.backToLogin}
              </button>
            </div>
          ) : null}

          {status === 'invalid' ? (
            <div className="auth-inline-link-row auth-inline-link-row-spaced">
              <Link className="auth-inline-link" to="/auth/forgot-password">
                {text.forgotPasswordAction}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
