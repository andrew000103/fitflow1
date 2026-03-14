import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import LanguageToggle from '../language/LanguageToggle.jsx'
import { useLanguage } from '../language/useLanguage.js'
import { supabase } from '../../lib/supabase'
import { useAuth } from './useAuth'
import '../../styles/auth.css'

function getAuthRedirectUrl() {
  if (typeof window === 'undefined') {
    return undefined
  }

  return `${window.location.origin}${window.location.pathname}#/auth`
}

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
            />

            <input
              type="password"
              placeholder={text.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />

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
            <div className="auth-side-stack">
              <h2>Clear structure. Calm motion. One steady start.</h2>
              <p>
                삼성바이오로직스 홈페이지처럼 정돈된 구조와 절제된 강조를 참고해서, 진입 경험도 더 믿음직하게 정리했어.
              </p>
            </div>
          </div>
          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <span>01</span>
              <strong>Structured access</strong>
              <p>진입 수단은 빠르게 고르되, 정보 구조는 한눈에 정리되도록 배치했어.</p>
            </div>
            <div className="auth-feature-item">
              <span>02</span>
              <strong>Unified tone</strong>
              <p>로그인, 온보딩, 프로필 입력까지 하나의 브랜드 화면처럼 같은 결로 이어져.</p>
            </div>
            <div className="auth-feature-item">
              <span>03</span>
              <strong>Subtle motion</strong>
              <p>강한 효과 대신 부드러운 등장감과 얕은 반응만 남겨서 부담을 줄였어.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
