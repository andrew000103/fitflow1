import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import LanguageToggle from '../language/LanguageToggle.jsx'
import { useLanguage } from '../language/useLanguage.js'
import { supabase } from '../../lib/supabase'
import { useAuth } from './useAuth'
import { getAuthRedirectUrl } from './authRecovery.js'
import '../../styles/auth.css'

export default function AuthPage() {
  const { user, isLoggedIn, isAnonymous, loading } = useAuth()
  const { text } = useLanguage('auth')
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/train'
  const authRedirectUrl = getAuthRedirectUrl()

  if (!loading && isLoggedIn) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleEmailAuth(e) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: authRedirectUrl,
          },
        })

        if (error) throw error

        if (data?.user && !data?.session) {
          setMessage(text.signupDoneVerify)
        } else {
          setMessage(text.signupDone)
          navigate('/train', { replace: true })
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        navigate(redirectTo, { replace: true })
      }
    } catch (error) {
      setMessage(error.message || text.emailAuthError)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleLogin() {
    setSubmitting(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: authRedirectUrl,
        },
      })

      if (error) throw error
    } catch (error) {
      setMessage(error.message || text.googleAuthError)
      setSubmitting(false)
    }
  }

  async function handleGuestLogin() {
    setSubmitting(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInAnonymously()

      if (error) throw error

      navigate('/train', { replace: true })
    } catch (error) {
      setMessage(error.message || text.guestAuthError)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    setSubmitting(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setMessage(text.logoutDone)
    } catch (error) {
      setMessage(error.message || text.logoutError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-layout">
        <div className="auth-card">
          <div className="auth-card-top">
            <div>
              <span className="auth-kicker">FitFlow Access</span>
              <h1>{text.title}</h1>
              <p className="auth-subtitle">{text.subtitle}</p>
            </div>
            <LanguageToggle compact />
          </div>

          <div className="auth-mode-row">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={mode === 'login' ? 'auth-mode-button active' : 'auth-mode-button'}
            >
              {text.login}
            </button>

            <button
              type="button"
              onClick={() => setMode('signup')}
              className={mode === 'signup' ? 'auth-mode-button active' : 'auth-mode-button'}
            >
              {text.signup}
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="auth-form">
            <input
              type="email"
              placeholder={text.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              autoComplete="email"
              required
            />

            <input
              type="password"
              placeholder={text.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
            />

            {mode === 'login' ? (
              <div className="auth-inline-link-row">
                <Link className="auth-inline-link" to="/auth/forgot-password">
                  {text.forgotPassword}
                </Link>
              </div>
            ) : null}

            <button type="submit" className="auth-primary-button" disabled={submitting}>
              {submitting
                ? text.processing
                : mode === 'signup'
                ? text.signupWithEmail
                : text.loginWithEmail}
            </button>
          </form>

          <div className="auth-secondary-stack">
            <button
              type="button"
              className="auth-secondary-button"
              onClick={handleGoogleLogin}
              disabled={submitting}
            >
              {text.continueWithGoogle}
            </button>

            <button
              type="button"
              className="auth-secondary-button"
              onClick={handleGuestLogin}
              disabled={submitting}
            >
              {text.continueAsGuest}
            </button>
          </div>

          {isLoggedIn && (
            <div className="auth-logged-in-box">
              <div>{text.loggedInStatus}</div>
              <div className="auth-small-text">
                {user?.email || (isAnonymous ? text.guestUser : text.loggedIn)}
              </div>

              <button
                type="button"
                className="auth-logout-button"
                onClick={handleLogout}
                disabled={submitting}
              >
                {text.logout}
              </button>
            </div>
          )}

          {!!message && <p className="auth-message">{message}</p>}
        </div>

        <aside className="auth-side-card">
          <div>
            <span className="auth-kicker">FitFlow Start</span>
          </div>
          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <span>01</span>
              <strong>오직 당신만을 위한 개인 맞춤형 헬스케어를 시작해요.</strong>
            </div>
            <div className="auth-feature-item">
              <span>02</span>
              <strong>운동에 필요한 모든 흐름을 하나의 앱에서 자연스럽게 이어가요.</strong>
            </div>
            <div className="auth-feature-item">
              <span>03</span>
              <strong>친구들과 함께 더 건강한 라이프를 나누고 오래 이어가요.</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
