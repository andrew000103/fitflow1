import { useState } from 'react'
import { Link } from 'react-router-dom'
import LanguageToggle from '../language/LanguageToggle.jsx'
import { useLanguage } from '../language/useLanguage.js'
import { supabase } from '../../lib/supabase.js'
import { getPasswordRecoveryRedirectUrl } from './authRecovery.js'
import '../../styles/auth.css'

export default function ForgotPasswordPage() {
  const { text } = useLanguage('auth')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('submitting')
    setMessage('')

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setStatus('error')
      setMessage(text.forgotPasswordError)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: getPasswordRecoveryRedirectUrl(),
      })

      if (error) throw error

      setStatus('success')
      setMessage(text.forgotPasswordSuccess)
    } catch (submitError) {
      setStatus('error')
      setMessage(submitError.message || text.forgotPasswordError)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-layout auth-layout-compact">
        <div className="auth-card">
          <div className="auth-card-top">
            <div>
              <span className="auth-kicker">FitFlow Access</span>
              <h1>{text.forgotPasswordTitle}</h1>
              <p className="auth-subtitle">{text.forgotPasswordSubtitle}</p>
            </div>
            <LanguageToggle compact />
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <input
              type="email"
              placeholder={text.emailPlaceholder}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="auth-input"
              autoComplete="email"
              required
            />

            <button
              type="submit"
              className="auth-primary-button"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? text.processing : text.forgotPasswordAction}
            </button>
          </form>

          {message ? (
            <p className={status === 'error' ? 'auth-message auth-message-error' : 'auth-message'}>
              {message}
            </p>
          ) : null}

          <div className="auth-inline-link-row auth-inline-link-row-spaced">
            <Link className="auth-inline-link" to="/auth">
              {text.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
