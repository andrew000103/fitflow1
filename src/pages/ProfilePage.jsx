import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import BrandLoader from '../components/BrandLoader.jsx'
import { useAuth } from '../features/auth/useAuth.js'
import { loadProfileBundle } from '../features/profile/profileData.js'
import { activityLevelLabel, macroRatioPresetLabel, sexLabel, tx } from '../utils/appLanguage.js'
import '../styles/personalization.css'

function goalTypeLabel(language, goalType) {
  if (goalType === 'bulk') {
    return tx(language, '벌크업', 'Bulk')
  }
  if (goalType === 'maintain') {
    return tx(language, '유지', 'Maintain')
  }
  return tx(language, '커팅', 'Cut')
}

function numberText(value, suffix = '') {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return `${value}${suffix}`
}

function ProfilePage() {
  const { appLanguage, userProfile } = useOutletContext()
  const { user } = useAuth()
  const location = useLocation()
  const avatarInputRef = useRef(null)
  const [profile, setProfile] = useState(null)
  const [targets, setTargets] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const avatarStorageKey = user?.id ? `fitflow_profile_avatar_${user.id}` : ''

  useEffect(() => {
    let active = true

    async function loadProfileData() {
      if (!user?.id) {
        if (active) {
          setStatus('error')
          setError(tx(appLanguage, '로그인 정보를 찾을 수 없어요.', 'We could not find your login session.'))
        }
        return
      }

      setStatus('loading')
      setError('')

      try {
        const { profile: nextProfile, targets: nextTargets } = await loadProfileBundle(user.id)

        if (!active) {
          return
        }

        setProfile(nextProfile)
        setTargets(nextTargets)
        setStatus('ready')
      } catch (loadError) {
        if (!active) {
          return
        }
        setStatus('error')
        setError(loadError.message || tx(appLanguage, '프로필을 불러오지 못했어요.', 'Could not load your profile.'))
      }
    }

    loadProfileData()

    return () => {
      active = false
    }
  }, [appLanguage, user?.id])

  useEffect(() => {
    if (!avatarStorageKey || typeof window === 'undefined') {
      return
    }

    const savedAvatar = window.localStorage.getItem(avatarStorageKey) || ''
    setAvatarUrl(savedAvatar)
  }, [avatarStorageKey])

  const summaryItems = useMemo(() => {
    return [
      {
        label: tx(appLanguage, '나이', 'Age'),
        value: numberText(profile?.age, tx(appLanguage, '세', 'y')),
      },
      {
        label: tx(appLanguage, '키', 'Height'),
        value: numberText(profile?.height_cm, ' cm'),
      },
      {
        label: tx(appLanguage, '몸무게', 'Weight'),
        value: numberText(profile?.weight_kg, ' kg'),
      },
      {
        label: tx(appLanguage, '성별', 'Gender'),
        value: profile?.gender ? sexLabel(appLanguage, profile.gender) : '-',
      },
      {
        label: tx(appLanguage, '평균 활동량', 'Activity level'),
        value: profile?.activity_level ? activityLevelLabel(appLanguage, profile.activity_level) : '-',
      },
      {
        label: tx(appLanguage, '목표 타입', 'Goal type'),
        value: profile?.goal_type ? goalTypeLabel(appLanguage, profile.goal_type) : '-',
      },
      {
        label: tx(appLanguage, '목표 칼로리', 'Target calories'),
        value: numberText(targets?.target_calories, ' kcal'),
      },
      {
        label: tx(appLanguage, '목표 단백질', 'Target protein'),
        value: numberText(targets?.target_protein_g, ' g'),
      },
      {
        label: tx(appLanguage, '목표 걸음수', 'Target steps'),
        value:
          targets?.target_steps || targets?.target_steps === 0
            ? `${Number(targets.target_steps).toLocaleString()} ${tx(appLanguage, '보', 'steps')}`
            : '-',
      },
      {
        label: tx(appLanguage, '주간 운동 횟수', 'Weekly workouts'),
        value:
          targets?.target_workouts_per_week || targets?.target_workouts_per_week === 0
            ? tx(appLanguage, `주 ${targets.target_workouts_per_week}회`, `${targets.target_workouts_per_week} / week`)
            : '-',
      },
      {
        label: tx(appLanguage, '탄단지 비율', 'Macro ratio'),
        value: macroRatioPresetLabel(appLanguage, userProfile?.macroRatioPreset || 'balanced'),
      },
    ]
  }, [appLanguage, profile, targets, userProfile?.macroRatioPreset])

  function openAvatarPicker() {
    avatarInputRef.current?.click()
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file || !avatarStorageKey) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const nextAvatar = typeof reader.result === 'string' ? reader.result : ''
      setAvatarUrl(nextAvatar)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(avatarStorageKey, nextAvatar)
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function handleAvatarReset() {
    setAvatarUrl('')
    if (avatarStorageKey && typeof window !== 'undefined') {
      window.localStorage.removeItem(avatarStorageKey)
    }
  }

  if (status === 'loading') {
    return (
      <section className="profile-loading-screen" aria-label={tx(appLanguage, '프로필 로딩 중', 'Loading profile')}>
        <BrandLoader />
        <div className="profile-loading-copy">
          <strong>{tx(appLanguage, '내 프로필을 준비하고 있어요', 'Preparing your profile')}</strong>
          <p>{tx(appLanguage, '기준 정보와 목표를 깔끔하게 정리해서 보여줄게요.', 'We are arranging your baseline and targets into one clean view.')}</p>
        </div>
      </section>
    )
  }

  if (status === 'error') {
    return (
      <section className="page-section">
        <PageHeader
          eyebrow={tx(appLanguage, '프로필', 'Profile')}
          title={tx(appLanguage, '내 기준 다시 확인하기', 'Review your baseline')}
          description={tx(
            appLanguage,
            '온보딩 데이터를 기반으로 지금의 목표를 관리하는 공간입니다.',
            'This is where your onboarding baseline powers the rest of the app.',
          )}
        />
        <article className="content-card profile-empty-state">
          <strong>{tx(appLanguage, '프로필을 불러오지 못했어요.', 'We could not load your profile.')}</strong>
          <p>{error}</p>
        </article>
      </section>
    )
  }

  return (
    <section className="page-section profile-page-shell">
      <PageHeader
        eyebrow={tx(appLanguage, '프로필', 'Profile')}
        title={tx(appLanguage, '관리 보고서', 'Personal report')}
        description={tx(
          appLanguage,
          '신체 정보와 목표에 맞춘 개인맞춤 플랫폼이에요.',
          'A personalized platform shaped around your body data and goals.',
        )}
      />

      <article className="content-card profile-energy-hero">
        <div className="profile-head">
          <div className={avatarUrl ? 'profile-avatar has-image' : 'profile-avatar'}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={tx(appLanguage, '프로필 사진', 'Profile avatar')} />
            ) : (
              <div className="profile-avatar-fallback" aria-hidden="true">
                <span className="profile-avatar-head" />
                <span className="profile-avatar-body" />
              </div>
            )}
          </div>
          <div>
            <h2>{tx(appLanguage, '내 몸 정보와 목표를 한 번에 보는 공간', 'A clean view of your body data and goals')}</h2>
            <p>
              {tx(
                appLanguage,
                '프로필 사진부터 목표 수치까지, 지금 나에게 맞는 기준을 간단하게 관리할 수 있어요.',
                'From your avatar to your target numbers, this is where your personal baseline stays in sync.',
              )}
            </p>
            <div className="profile-avatar-actions">
              <input
                ref={avatarInputRef}
                className="profile-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <button className="inline-action" type="button" onClick={openAvatarPicker}>
                {tx(appLanguage, '프로필 사진 수정', 'Edit photo')}
              </button>
              {avatarUrl ? (
                <button className="inline-action" type="button" onClick={handleAvatarReset}>
                  {tx(appLanguage, '기본 사진으로', 'Use default')}
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <div className="profile-hero-meta">
          <span className="pill-tag profile-accent-chip">{goalTypeLabel(appLanguage, profile?.goal_type)}</span>
          <span className="pill-tag profile-muted-chip">{activityLevelLabel(appLanguage, profile?.activity_level)}</span>
        </div>
      </article>

      {location.state?.saved ? (
        <article className="content-card profile-feedback-card success">
          <strong>{tx(appLanguage, '프로필이 업데이트됐어요.', 'Your profile has been updated.')}</strong>
          <p>{tx(appLanguage, '새 기준이 운동과 식단 추천에도 바로 반영됩니다.', 'Your new baseline is already reflected across workout and nutrition recommendations.')}</p>
        </article>
      ) : null}

      <article className="content-card profile-reminder-card">
        <div className="feed-head">
          <div>
            <span className="profile-section-kicker">{tx(appLanguage, 'edit', 'edit')}</span>
            <h2>{tx(appLanguage, '프로필 수정', 'Edit profile')}</h2>
            <p>{tx(appLanguage, '수정 페이지에서 신체정보와 목표를 바꾸면 추천 목표가 같이 다시 계산돼요.', 'On the edit page, updating your profile recalculates your recommended targets at the same time.')}</p>
          </div>
          <Link className="inline-action profile-primary-action" to="/profile/edit" state={{ from: location.pathname }}>
            {tx(appLanguage, '프로필 수정', 'Edit profile')}
          </Link>
        </div>
      </article>

      <div className="card-grid split">
        <article className="content-card profile-summary-card">
          <div className="feed-head">
            <div>
              <span className="profile-section-kicker">{tx(appLanguage, 'body baseline', 'body baseline')}</span>
              <h2>{tx(appLanguage, '현재 저장된 신체 정보', 'Saved body details')}</h2>
              <p>{tx(appLanguage, '지금 앱이 기준으로 삼는 내 몸 정보예요.', 'These are the body details the app is currently using as your baseline.')}</p>
            </div>
          </div>
          <div className="summary-grid tight">
            {summaryItems.slice(0, 6).map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card profile-summary-card">
          <div className="feed-head">
            <div>
              <span className="profile-section-kicker">{tx(appLanguage, 'target baseline', 'target baseline')}</span>
              <h2>{tx(appLanguage, '현재 저장된 목표 정보', 'Saved target details')}</h2>
              <p>{tx(appLanguage, '운동과 식단 첫 화면에 연결되는 핵심 목표입니다.', 'These are the core targets connected to your workout and nutrition home screens.')}</p>
            </div>
          </div>
          <div className="summary-grid tight">
            {summaryItems.slice(6).map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}

export default ProfilePage
