import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LanguageToggle from '../features/language/LanguageToggle.jsx'
import { useLanguage } from '../features/language/useLanguage.js'
import { supabase } from '../lib/supabase'
import { loadDashboardState, saveDashboardState } from '../api/fitflowApi.ts'
import { calculateHealthTargets } from '../lib/healthTargets'
import { checkNicknameAvailability, saveProfileBundle, suggestNicknames } from '../features/profile/profileData.js'
import '../styles/onboarding.css'

const initialForm = {
  nickname: '',
  age: '',
  heightCm: '',
  weightKg: '',
  gender: 'male',
  activityLevel: 'light',
  goalType: 'cut',
}

function normalizeNickname(value) {
  return String(value || '').trim()
}

function isValidNickname(value) {
  const normalizedNickname = normalizeNickname(value)
  return normalizedNickname.length >= 2 && normalizedNickname.length <= 20
}

function StepCard({ step, title, description, children }) {
  return (
    <section className="onboarding-section-card">
      <div className="onboarding-section-head">
        <span className="onboarding-step-badge">{step}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function ChoiceGrid({ options, value, onChange }) {
  return (
    <div className="onboarding-choice-grid">
      {options.map((option) => {
        const selected = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            className={selected ? 'onboarding-choice-card selected' : 'onboarding-choice-card'}
            onClick={() => onChange(option.value)}
          >
            <strong>{option.label}</strong>
            <span>{option.hint}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { text } = useLanguage('onboarding')
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nicknameStatus, setNicknameStatus] = useState('idle')
  const [nicknameMessage, setNicknameMessage] = useState('')
  const [nicknameSuggestions, setNicknameSuggestions] = useState([])
  const nicknameRequestIdRef = useRef(0)

  const genderOptions = [
    { value: 'male', label: text.genderMale, hint: text.genderMaleHint },
    { value: 'female', label: text.genderFemale, hint: text.genderFemaleHint },
    { value: 'other', label: text.genderOther, hint: text.genderOtherHint },
  ]

  const activityOptions = [
    { value: 'sedentary', label: text.activitySedentary, hint: text.activitySedentaryHint },
    { value: 'light', label: text.activityLight, hint: text.activityLightHint },
    { value: 'moderate', label: text.activityModerate, hint: text.activityModerateHint },
    { value: 'high', label: text.activityHigh, hint: text.activityHighHint },
  ]

  const goalOptions = [
    { value: 'cut', label: text.goalCut, hint: text.goalCutHint },
    { value: 'maintain', label: text.goalMaintain, hint: text.goalMaintainHint },
    { value: 'bulk', label: text.goalBulk, hint: text.goalBulkHint },
  ]

  const metricFields = [
    { key: 'nickname', label: text.nickname, placeholder: text.nicknamePlaceholder, type: 'text' },
    { key: 'age', label: text.age, suffix: text.ageSuffix, placeholder: '25' },
    { key: 'heightCm', label: text.height, suffix: text.heightSuffix, placeholder: '175' },
    { key: 'weightKg', label: text.weight, suffix: text.weightSuffix, placeholder: '78' },
  ]

  const preview = useMemo(() => {
    const age = Number(form.age)
    const heightCm = Number(form.heightCm)
    const weightKg = Number(form.weightKg)

    if (!age || !heightCm || !weightKg) return null

    return calculateHealthTargets({
      age,
      heightCm,
      weightKg,
      gender: form.gender,
      activityLevel: form.activityLevel,
      goalType: form.goalType,
    })
  }, [form])

  const completedCount = [
    form.age,
    form.heightCm,
    form.weightKg,
    form.gender,
    form.activityLevel,
    form.goalType,
  ].filter(Boolean).length

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'nickname') {
      setNicknameStatus('idle')
      setNicknameMessage('')
      setNicknameSuggestions([])
    }
  }

  async function handleNicknameCheck(nextNickname = form.nickname) {
    const trimmedNickname = normalizeNickname(nextNickname)
    const requestId = nicknameRequestIdRef.current + 1
    nicknameRequestIdRef.current = requestId

    if (!trimmedNickname) {
      setNicknameStatus('error')
      setNicknameMessage(text.nicknameRequired)
      setNicknameSuggestions([])
      return false
    }

    if (!isValidNickname(trimmedNickname)) {
      setNicknameStatus('error')
      setNicknameMessage(text.nicknameInvalid)
      setNicknameSuggestions([])
      return false
    }

    setNicknameStatus('checking')
    setNicknameMessage('')
    setNicknameSuggestions([])

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const result = await checkNicknameAvailability(user?.id, trimmedNickname)
      if (nicknameRequestIdRef.current !== requestId) {
        return false
      }

      if (!result.supported) {
        setNicknameStatus('skipped')
        setNicknameMessage(text.nicknameCheckUnavailable)
        return true
      }

      if (result.available) {
        setNicknameStatus('available')
        setNicknameMessage(text.nicknameAvailable)
        return true
      }

      setNicknameStatus('duplicate')
      setNicknameMessage(text.nicknameDuplicate)
      const suggestions = await suggestNicknames(trimmedNickname)
      if (nicknameRequestIdRef.current !== requestId) {
        return false
      }
      setNicknameSuggestions(suggestions.slice(0, 5))
      return false
    } catch (checkError) {
      if (nicknameRequestIdRef.current !== requestId) {
        return false
      }
      setNicknameStatus('skipped')
      setNicknameMessage(checkError.message || text.nicknameCheckUnavailable)
      setNicknameSuggestions([])
      return true
    }
  }

  useEffect(() => {
    const trimmedNickname = normalizeNickname(form.nickname)

    if (!trimmedNickname) {
      setNicknameStatus('idle')
      setNicknameMessage('')
      setNicknameSuggestions([])
      return undefined
    }

    if (!isValidNickname(trimmedNickname)) {
      setNicknameStatus('error')
      setNicknameMessage(text.nicknameInvalid)
      setNicknameSuggestions([])
      return undefined
    }

    const debounceTimer = window.setTimeout(() => {
      handleNicknameCheck(trimmedNickname)
    }, 450)

    return () => {
      window.clearTimeout(debounceTimer)
    }
  }, [form.nickname, text.nicknameAvailable, text.nicknameCheckUnavailable, text.nicknameDuplicate, text.nicknameInvalid, text.nicknameRequired])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const age = Number(form.age)
    const heightCm = Number(form.heightCm)
    const weightKg = Number(form.weightKg)
    const trimmedNickname = normalizeNickname(form.nickname)

    if (!age || !heightCm || !weightKg) {
      setError(text.missingBodyError)
      return
    }

    if (!trimmedNickname) {
      setError(text.nicknameRequired)
      setNicknameStatus('error')
      setNicknameMessage(text.nicknameRequired)
      return
    }

    if (!isValidNickname(trimmedNickname)) {
      setError(text.nicknameInvalid)
      setNicknameStatus('error')
      setNicknameMessage(text.nicknameInvalid)
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error(text.loginRequired)

      if (nicknameStatus !== 'available') {
        const isNicknameOkay = await handleNicknameCheck(trimmedNickname)
        if (!isNicknameOkay) {
          setLoading(false)
          return
        }
      }

      await saveProfileBundle(user.id, {
        ...form,
        nickname: trimmedNickname,
      })

      const persistedState = loadDashboardState(user.id)
      saveDashboardState(
        {
          ...persistedState,
          userProfile: {
            ...(persistedState.userProfile && typeof persistedState.userProfile === 'object' ? persistedState.userProfile : {}),
            name: trimmedNickname,
          },
        },
        user.id,
      )

      navigate('/')
    } catch (err) {
      setError(err.message || text.saveError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-background-glow onboarding-background-glow-left" />
      <div className="onboarding-background-glow onboarding-background-glow-right" />

      <div className="onboarding-container">
        <header className="onboarding-hero">
          <div className="onboarding-topbar">
            <div />
            <LanguageToggle className="onboarding-language-toggle" compact />
          </div>

          <div className="onboarding-hero-copy">
            <span className="onboarding-kicker">{text.heroKicker}</span>
            <h1>{text.heroTitle}</h1>
            <p>{text.heroDescription}</p>
          </div>

          <aside className="onboarding-progress-card">
            <span className="onboarding-progress-label">{text.progressLabel}</span>
            <strong>{completedCount} / 7</strong>
            <p>{text.progressDescription}</p>
            <div className="onboarding-progress-track" aria-hidden="true">
              <span style={{ width: `${(completedCount / 6) * 100}%` }} />
            </div>
            <div className="onboarding-progress-footnote">
              <span>FitFlow Baseline</span>
              <em>Personal setup in one calm flow</em>
            </div>
          </aside>
        </header>

        <form className="onboarding-form-layout" onSubmit={handleSubmit}>
          <div className="onboarding-main-column">
            <StepCard
              step="01"
              title={text.stepBodyTitle}
              description={text.stepBodyDescription}
            >
              <div className="onboarding-metrics-grid">
                {metricFields.map((field) => (
                  <label key={field.key} className="onboarding-metric-card">
                    <span>{field.label}</span>
                    <div className="onboarding-metric-input-wrap">
                      <input
                        type={field.type || 'number'}
                        value={form[field.key]}
                        onChange={(event) => updateField(field.key, event.target.value)}
                        placeholder={field.placeholder}
                      />
                      {field.suffix ? <em>{field.suffix}</em> : null}
                    </div>
                    {field.key === 'nickname' ? (
                      <div className="onboarding-nickname-row">
                        <span className="onboarding-nickname-rule">{text.nicknameRule}</span>
                        {nicknameStatus === 'checking' ? (
                          <span className="onboarding-nickname-feedback">{text.nicknameChecking}</span>
                        ) : null}
                        {nicknameMessage && nicknameStatus !== 'checking' ? (
                          <span
                            className={
                              nicknameStatus === 'available'
                                ? 'onboarding-nickname-feedback is-success'
                                : nicknameStatus === 'duplicate' || nicknameStatus === 'error'
                                ? 'onboarding-nickname-feedback is-error'
                                : 'onboarding-nickname-feedback'
                            }
                          >
                            {nicknameMessage}
                          </span>
                        ) : null}
                        {nicknameStatus === 'duplicate' && nicknameSuggestions.length > 0 ? (
                          <div className="onboarding-nickname-suggestions">
                            <span className="onboarding-nickname-suggestions-label">{text.nicknameSuggestions}</span>
                            <div className="onboarding-nickname-chip-row">
                              {nicknameSuggestions.slice(0, 5).map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  className="onboarding-nickname-chip"
                                  onClick={() => updateField('nickname', suggestion)}
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </label>
                ))}
              </div>
            </StepCard>

            <StepCard
              step="02"
              title={text.stepPreferencesTitle}
              description={text.stepPreferencesDescription}
            >
              <div className="onboarding-choice-stack">
                <div className="onboarding-field-block">
                  <div className="onboarding-field-head">
                    <h3>{text.genderTitle}</h3>
                    <p>{text.genderDescription}</p>
                  </div>
                  <ChoiceGrid options={genderOptions} value={form.gender} onChange={(value) => updateField('gender', value)} />
                </div>

                <div className="onboarding-field-block">
                  <div className="onboarding-field-head">
                    <h3>{text.activityTitle}</h3>
                    <p>{text.activityDescription}</p>
                  </div>
                  <ChoiceGrid options={activityOptions} value={form.activityLevel} onChange={(value) => updateField('activityLevel', value)} />
                </div>

                <div className="onboarding-field-block">
                  <div className="onboarding-field-head">
                    <h3>{text.goalTitle}</h3>
                    <p>{text.goalDescription}</p>
                  </div>
                  <ChoiceGrid options={goalOptions} value={form.goalType} onChange={(value) => updateField('goalType', value)} />
                </div>
              </div>
            </StepCard>
          </div>

          <aside className="onboarding-side-column">
            <section className="onboarding-preview-card">
              <div className="onboarding-preview-head">
                <span className="onboarding-kicker">{text.previewKicker}</span>
                <h2>{text.previewTitle}</h2>
                <p>{text.previewDescription}</p>
              </div>

              {preview ? (
                <div className="onboarding-preview-stats">
                  <div className="onboarding-preview-stat">
                    <span>{text.targetCalories}</span>
                    <strong>{preview.targetCalories} kcal</strong>
                  </div>
                  <div className="onboarding-preview-stat">
                    <span>{text.targetProtein}</span>
                    <strong>{preview.targetProteinG} g</strong>
                  </div>
                  <div className="onboarding-preview-stat">
                    <span>{text.targetSteps}</span>
                    <strong>{preview.targetSteps.toLocaleString()} {text.stepsUnit}</strong>
                  </div>
                  <div className="onboarding-preview-stat">
                    <span>{text.targetWorkouts}</span>
                    <strong>{text.workoutsPerWeek.replace('{count}', String(preview.targetWorkoutsPerWeek))}</strong>
                  </div>
                </div>
              ) : (
                <div className="onboarding-preview-empty">
                  <strong>{text.previewEmptyTitle}</strong>
                  <p>{text.previewEmptyDescription}</p>
                </div>
              )}

              {error ? (
                <div className="onboarding-error-banner">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="onboarding-submit-button"
              >
                {loading ? text.saving : text.startButton}
              </button>
            </section>
          </aside>
        </form>
      </div>
    </div>
  )
}
