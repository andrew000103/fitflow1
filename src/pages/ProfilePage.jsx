import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useOutletContext, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import BrandLoader from '../components/BrandLoader.jsx'
import { useAuth } from '../features/auth/useAuth.js'
import { loadProfileBundle } from '../features/profile/profileData.js'
import CrewButton from '../features/social/CrewButton.jsx'
import ProfileSocialDevTools from '../features/social/ProfileSocialDevTools.jsx'
import ProfileSocialStats from '../features/social/ProfileSocialStats.jsx'
import SupportButton from '../features/social/SupportButton.jsx'
import {
  acceptCrewRequest,
  cancelCrewRequest,
  cancelSupport,
  createSupport,
  declineCrewRequest,
  getProfileSocialState,
  sendCrewRequest,
  subscribeSocialRelationshipsChanged,
} from '../features/social/socialApi.ts'
import { activityLevelLabel, macroRatioPresetLabel, sexLabel, tx } from '../utils/appLanguage.js'
import '../styles/personalization.css'

const dailyProfileMessages = [
  ['오늘도 내 페이스를 믿고 가면 충분해요.', 'Your own pace is more than enough today.'],
  ['몸도 마음도 가볍게 흐르는 하루가 되길 바라요.', 'Wishing you a day that feels light in both body and mind.'],
  ['작은 루틴 하나가 하루 분위기를 바꿔줘요.', 'One small routine can change the tone of your day.'],
  ['지금의 나를 잘 챙기는 게 가장 좋은 시작이에요.', 'Taking care of yourself is the best place to begin.'],
  ['무리하지 않아도 꾸준함은 충분히 빛나요.', 'Consistency shines even when the pace is gentle.'],
  ['오늘 하루도 내 몸 편에 서서 가볼게요.', 'Let today be another day on your body side.'],
  ['좋은 컨디션은 잘 쉬고 잘 챙기는 데서 시작돼요.', 'Good energy starts with caring for yourself well.'],
  ['하루가 조금 바빠도 나를 돌보는 시간은 남겨둬요.', 'Even on busy days, keep a little time for yourself.'],
  ['어제보다 조금 편안하면 그것도 좋은 진전이에요.', 'Feeling a bit better than yesterday is real progress.'],
  ['오늘의 기준은 남과 비교하지 않는 것부터예요.', 'Today baseline starts by not comparing yourself to others.'],
  ['잘하려고 애쓴 만큼, 오늘도 분명 괜찮은 하루예요.', 'With how much you keep trying, today is already a good day.'],
  ['기분 좋은 하루는 나를 다정하게 보는 데서 시작돼요.', 'A better day often begins with being kind to yourself.'],
]

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

function getDailyProfileMessage(language) {
  const today = new Date()
  const daySeed = Number(
    `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`,
  )
  const messageIndex = daySeed % dailyProfileMessages.length

  return dailyProfileMessages[messageIndex][language === 'en' ? 1 : 0]
}

function ProfilePage() {
  const { appLanguage, userProfile } = useOutletContext()
  const { user } = useAuth()
  const { profileUserId } = useParams()
  const location = useLocation()
  const avatarInputRef = useRef(null)
  const [profile, setProfile] = useState(null)
  const [targets, setTargets] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [socialState, setSocialState] = useState({
    supportStatus: 'not_supported',
    crewStatus: 'none',
    stats: {
      supporterCount: 0,
      supportingCount: 0,
      crewCount: 0,
    },
  })
  const [socialPending, setSocialPending] = useState('')
  const [socialError, setSocialError] = useState('')
  const dailyProfileMessage = getDailyProfileMessage(appLanguage)

  const activeProfileUserId = profileUserId || user?.id || ''
  const isOwnProfile = !activeProfileUserId || activeProfileUserId === user?.id
  const avatarStorageKey = activeProfileUserId ? `fitflow_profile_avatar_${activeProfileUserId}` : ''
  const profileNickname = profile?.nickname || (isOwnProfile ? userProfile?.name : '') || tx(appLanguage, 'FitFlow 사용자', 'FitFlow user')

  useEffect(() => {
    let active = true

    async function loadProfileData() {
      if (!user?.id || !activeProfileUserId) {
        if (active) {
          setStatus('error')
          setError(tx(appLanguage, '로그인 정보를 찾을 수 없어요.', 'We could not find your login session.'))
        }
        return
      }

      setStatus('loading')
      setError('')
      setSocialError('')

      try {
        const { profile: nextProfile, targets: nextTargets } = await loadProfileBundle(activeProfileUserId)

        if (!active) {
          return
        }

        setProfile(nextProfile)
        setTargets(nextTargets)
        setStatus('ready')

        try {
          const nextSocialState = await getProfileSocialState(user.id, activeProfileUserId)
          if (!active) {
            return
          }
          setSocialState(nextSocialState)
        } catch (nextSocialError) {
          if (!active) {
            return
          }
          setSocialState({
            supportStatus: 'not_supported',
            crewStatus: 'none',
            stats: {
              supporterCount: 0,
              supportingCount: 0,
              crewCount: 0,
            },
          })
          setSocialError(nextSocialError.message || tx(appLanguage, '소셜 정보를 불러오지 못했어요.', 'Could not load social details.'))
        }
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
  }, [activeProfileUserId, appLanguage, user?.id])

  useEffect(() => {
    if (!user?.id || !activeProfileUserId) {
      return
    }

    return subscribeSocialRelationshipsChanged(() => {
      refreshSocialState().catch(() => {})
    })
  }, [activeProfileUserId, user?.id])

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

  async function refreshSocialState() {
    if (!user?.id || !activeProfileUserId) {
      return
    }

    const nextSocialState = await getProfileSocialState(user.id, activeProfileUserId)
    setSocialState(nextSocialState)
    setSocialError('')
  }

  async function handleSupportToggle() {
    if (!user?.id || !activeProfileUserId) {
      return
    }

    setSocialPending('support')

    try {
      if (socialState.supportStatus === 'supported') {
        await cancelSupport(user.id, activeProfileUserId)
      } else {
        await createSupport(user.id, activeProfileUserId)
      }

      await refreshSocialState()
    } catch (actionError) {
      setSocialError(actionError.message || tx(appLanguage, '소셜 상태를 업데이트하지 못했어요.', 'Could not update social relationship.'))
    } finally {
      setSocialPending('')
    }
  }

  async function handleCrewAction(action) {
    if (!user?.id || !activeProfileUserId) {
      return
    }

    setSocialPending(action)

    try {
      if (action === 'send') {
        await sendCrewRequest(user.id, activeProfileUserId)
      }
      if (action === 'cancel') {
        await cancelCrewRequest(user.id, activeProfileUserId)
      }
      if (action === 'accept') {
        await acceptCrewRequest(user.id, activeProfileUserId)
      }
      if (action === 'decline') {
        await declineCrewRequest(user.id, activeProfileUserId)
      }

      await refreshSocialState()
    } catch (actionError) {
      setSocialError(actionError.message || tx(appLanguage, '크루 상태를 업데이트하지 못했어요.', 'Could not update crew relationship.'))
    } finally {
      setSocialPending('')
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
        description={dailyProfileMessage}
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
            <h2>{profileNickname}</h2>
            {isOwnProfile ? (
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
            ) : null}
          </div>
        </div>
        <div className="profile-hero-meta">
          <span className="pill-tag profile-accent-chip">{goalTypeLabel(appLanguage, profile?.goal_type)}</span>
          <span className="pill-tag profile-muted-chip">{activityLevelLabel(appLanguage, profile?.activity_level)}</span>
        </div>
        <ProfileSocialStats
          supporterCount={socialState.stats.supporterCount}
          supportingCount={socialState.stats.supportingCount}
          crewCount={socialState.stats.crewCount}
        />
        {!isOwnProfile ? (
          <div className="profile-social-actions">
            <SupportButton
              status={socialState.supportStatus}
              loading={socialPending === 'support'}
              onToggle={handleSupportToggle}
            />
            <CrewButton
              status={socialState.crewStatus}
              loading={socialPending === 'send' || socialPending === 'cancel' || socialPending === 'accept' || socialPending === 'decline'}
              onSend={() => handleCrewAction('send')}
              onCancel={() => handleCrewAction('cancel')}
              onAccept={() => handleCrewAction('accept')}
              onDecline={() => handleCrewAction('decline')}
            />
          </div>
        ) : null}
        {socialError ? (
          <div className="profile-social-inline-error">
            <span>{socialError}</span>
          </div>
        ) : null}
      </article>

      {location.state?.saved ? (
        <article className="content-card profile-feedback-card success">
          <strong>{tx(appLanguage, '프로필이 업데이트됐어요.', 'Your profile has been updated.')}</strong>
          <p>{tx(appLanguage, '새 기준이 운동과 식단 추천에도 바로 반영됩니다.', 'Your new baseline is already reflected across workout and nutrition recommendations.')}</p>
        </article>
      ) : null}

      {isOwnProfile ? (
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
      ) : null}

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

      <ProfileSocialDevTools currentUserId={user?.id || ''} activeProfileUserId={activeProfileUserId} />
    </section>
  )
}

export default ProfilePage
