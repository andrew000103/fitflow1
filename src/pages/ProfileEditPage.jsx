import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { useAuth } from '../features/auth/useAuth.js'
import { supabase } from '../lib/supabase.js'
import {
  calculateProfileTargets,
  deleteProfileBundle,
  emptyProfileForm,
  loadProfileBundle,
  normalizeProfileForm,
  saveProfileBundle,
} from '../features/profile/profileData.js'
import { macroRatioPresetLabel, sexLabel, tx } from '../utils/appLanguage.js'
import '../styles/personalization.css'

function ProfileEditPage() {
  const { appLanguage, userProfile, updateUserProfile, resetAllData } = useOutletContext()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyProfileForm)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [settingsAction, setSettingsAction] = useState('')
  const [actionPending, setActionPending] = useState(false)

  useEffect(() => {
    let active = true

    async function loadData() {
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
        const { profile } = await loadProfileBundle(user.id)

        if (!active) {
          return
        }

        setForm({
          ...normalizeProfileForm(profile),
          macroRatioPreset: userProfile?.macroRatioPreset || 'balanced',
        })
        setStatus('ready')
      } catch (loadError) {
        if (!active) {
          return
        }
        setStatus('error')
        setError(loadError.message || tx(appLanguage, '프로필 수정 정보를 불러오지 못했어요.', 'Could not load your profile edit data.'))
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [appLanguage, user?.id])

  const previewTargets = useMemo(() => calculateProfileTargets(form), [form])

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
    setSaveError('')
  }

  async function handleLogout() {
    setActionPending(true)
    setSaveError('')

    try {
      resetAllData()
      await supabase.auth.signOut()
      navigate('/auth', { replace: true })
    } catch (logoutError) {
      setSaveError(logoutError.message || tx(appLanguage, '로그아웃 중 오류가 발생했어요.', 'Something went wrong while logging out.'))
    } finally {
      setActionPending(false)
      setSettingsAction('')
    }
  }

  async function handleDeleteAccount() {
    if (!user?.id) {
      setSaveError(tx(appLanguage, '로그인 정보를 다시 확인해 주세요.', 'Please refresh your login session and try again.'))
      setSettingsAction('')
      return
    }

    setActionPending(true)
    setSaveError('')

    try {
      await deleteProfileBundle(user.id)
      resetAllData()
      await supabase.auth.signOut()
      navigate('/auth', { replace: true, state: { deleted: true } })
    } catch (deleteError) {
      setSaveError(deleteError.message || tx(appLanguage, '회원탈퇴 처리 중 오류가 발생했어요.', 'Something went wrong while processing account deletion.'))
    } finally {
      setActionPending(false)
      setSettingsAction('')
    }
  }

  async function handleSave(event) {
    event.preventDefault()

    if (!form.age || !form.heightCm || !form.weightKg) {
      setSaveError(tx(appLanguage, '나이, 키, 몸무게를 먼저 입력해 주세요.', 'Please enter your age, height, and weight first.'))
      return
    }

    if (!user?.id) {
      setSaveError(tx(appLanguage, '로그인 정보를 다시 확인해 주세요.', 'Please refresh your login session and try again.'))
      return
    }

    setSaving(true)
    setSaveError('')

    try {
      await saveProfileBundle(user.id, form)
      updateUserProfile({
        name: form.nickname?.trim() || userProfile?.name,
        macroRatioPreset: form.macroRatioPreset || 'balanced',
      })
      navigate('/profile/me', { replace: true, state: { saved: true } })
    } catch (saveProfileError) {
      setSaveError(saveProfileError.message || tx(appLanguage, '저장 중 오류가 발생했어요.', 'Something went wrong while saving.'))
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <section className="page-section">
        <article className="content-card profile-empty-state">
          <strong>{tx(appLanguage, '수정 정보를 불러오는 중...', 'Loading your edit form...')}</strong>
          <p>{tx(appLanguage, '잠시만 기다리면 바로 수정할 수 있게 준비할게요.', 'We are preparing your profile so you can edit it right away.')}</p>
        </article>
      </section>
    )
  }

  if (status === 'error') {
    return (
      <section className="page-section">
        <article className="content-card profile-empty-state">
          <strong>{tx(appLanguage, '프로필 수정 정보를 불러오지 못했어요.', 'We could not load the profile editor.')}</strong>
          <p>{error}</p>
        </article>
      </section>
    )
  }

  return (
    <section className="page-section profile-page-shell">
      <PageHeader
        eyebrow={tx(appLanguage, '프로필 / 수정', 'Profile / Edit')}
        title={tx(appLanguage, '프로필 수정', 'Edit profile')}
        description={tx(
          appLanguage,
          '여기서 바꾸는 값이 앱 전체 개인화 기준이 됩니다.',
          'Everything you change here becomes the baseline for personalization across the app.',
        )}
      />

      {saveError ? (
        <article className="content-card profile-feedback-card error">
          <strong>{tx(appLanguage, '저장 전에 확인이 필요해요.', 'Please check a few details before saving.')}</strong>
          <p>{saveError}</p>
        </article>
      ) : null}

      <article className="content-card profile-editor-card profile-editor-surface">
        <div className="feed-head profile-edit-header">
          <div>
            <span className="profile-section-kicker">{tx(appLanguage, 'edit baseline', 'edit baseline')}</span>
            <h2>{tx(appLanguage, '신체정보와 목표 수정', 'Update body stats and goal')}</h2>
            <p>{tx(appLanguage, '저장하면 칼로리, 단백질, 걸음수, 운동 횟수까지 새 기준으로 다시 계산돼요.', 'Saving recalculates calories, protein, steps, and weekly workouts from your new baseline.')}</p>
          </div>
          <div className="profile-edit-actions">
            <button className="inline-action profile-primary-action" type="submit" form="profile-edit-form" disabled={saving}>
              {saving ? tx(appLanguage, '저장 중...', 'Saving...') : tx(appLanguage, '저장', 'Save')}
            </button>
            <button className="inline-action" type="button" onClick={() => navigate('/profile/me')}>
              {tx(appLanguage, '취소', 'Cancel')}
            </button>
          </div>
        </div>

        <form id="profile-edit-form" className="stack-form profile-edit-form-shell" onSubmit={handleSave}>
          <div className="profile-form-section">
            <div className="profile-form-section-head">
              <span>{tx(appLanguage, '기본 정보', 'Body basics')}</span>
              <p>{tx(appLanguage, '몸의 기본 수치부터 차분하게 정리해요.', 'Start with the core measurements that define your body baseline.')}</p>
            </div>
            <div className="compact-grid profile-edit-grid">
              <label className="field-label profile-field-card">
                {tx(appLanguage, '닉네임', 'Nickname')}
                <input value={form.nickname} onChange={(event) => updateField('nickname', event.target.value)} disabled={saving} />
              </label>
              <label className="field-label profile-field-card">
                {tx(appLanguage, '나이', 'Age')}
                <input type="number" value={form.age} onChange={(event) => updateField('age', event.target.value)} disabled={saving} />
              </label>
              <label className="field-label profile-field-card">
                {tx(appLanguage, '키 (cm)', 'Height (cm)')}
                <input type="number" value={form.heightCm} onChange={(event) => updateField('heightCm', event.target.value)} disabled={saving} />
              </label>
              <label className="field-label profile-field-card">
                {tx(appLanguage, '몸무게 (kg)', 'Weight (kg)')}
                <input type="number" value={form.weightKg} onChange={(event) => updateField('weightKg', event.target.value)} disabled={saving} />
              </label>
              <label className="field-label profile-field-card">
                {tx(appLanguage, '성별', 'Gender')}
                <select value={form.gender} onChange={(event) => updateField('gender', event.target.value)} disabled={saving}>
                  <option value="male">{sexLabel(appLanguage, 'male')}</option>
                  <option value="female">{sexLabel(appLanguage, 'female')}</option>
                  <option value="other">{tx(appLanguage, '기타/선택 안 함', 'Other / prefer not to say')}</option>
                </select>
              </label>
            </div>
          </div>

          <div className="profile-form-section">
            <div className="profile-form-section-head">
              <span>{tx(appLanguage, '생활 패턴과 목표', 'Lifestyle and goal')}</span>
              <p>{tx(appLanguage, '활동량과 목표에 맞춰 추천값이 바로 조정됩니다.', 'Recommendations update right away based on your activity level and goal.')}</p>
            </div>
            <div className="compact-grid profile-edit-grid">
              <label className="field-label profile-field-card">
                {tx(appLanguage, '평균 활동량', 'Average activity')}
                <select value={form.activityLevel} onChange={(event) => updateField('activityLevel', event.target.value)} disabled={saving}>
                  <option value="sedentary">{tx(appLanguage, '거의 앉아서 생활', 'Mostly sedentary')}</option>
                  <option value="light">{tx(appLanguage, '가벼운 활동', 'Light activity')}</option>
                  <option value="moderate">{tx(appLanguage, '보통 이상', 'Moderate activity')}</option>
                  <option value="high">{tx(appLanguage, '활동량 높음', 'High activity')}</option>
                </select>
              </label>
              <label className="field-label profile-field-card">
                {tx(appLanguage, '목표 타입', 'Goal type')}
                <select value={form.goalType} onChange={(event) => updateField('goalType', event.target.value)} disabled={saving}>
                  <option value="cut">{tx(appLanguage, '커팅', 'Cut')}</option>
                  <option value="maintain">{tx(appLanguage, '유지', 'Maintain')}</option>
                  <option value="bulk">{tx(appLanguage, '벌크업', 'Bulk')}</option>
                </select>
              </label>
              <label className="field-label profile-field-card">
                {tx(appLanguage, '탄단지 비율', 'Macro ratio')}
                <select value={form.macroRatioPreset || 'balanced'} onChange={(event) => updateField('macroRatioPreset', event.target.value)} disabled={saving}>
                  <option value="balanced">{macroRatioPresetLabel(appLanguage, 'balanced')}</option>
                  <option value="lower_carb">{macroRatioPresetLabel(appLanguage, 'lower_carb')}</option>
                </select>
              </label>
            </div>
          </div>

          {previewTargets ? (
            <div className="summary-grid tight profile-target-preview">
              <div>
                <span>{tx(appLanguage, '다음 목표 칼로리', 'Next target calories')}</span>
                <strong>{previewTargets.targetCalories} kcal</strong>
              </div>
              <div>
                <span>{tx(appLanguage, '다음 목표 단백질', 'Next target protein')}</span>
                <strong>{previewTargets.targetProteinG} g</strong>
              </div>
              <div>
                <span>{tx(appLanguage, '다음 목표 걸음수', 'Next target steps')}</span>
                <strong>{previewTargets.targetSteps.toLocaleString()} {tx(appLanguage, '보', 'steps')}</strong>
              </div>
              <div>
                <span>{tx(appLanguage, '다음 주간 운동 횟수', 'Next weekly workouts')}</span>
                <strong>{tx(appLanguage, `주 ${previewTargets.targetWorkoutsPerWeek}회`, `${previewTargets.targetWorkoutsPerWeek} / week`)}</strong>
              </div>
            </div>
          ) : null}

          <div className="profile-form-section profile-settings-section">
            <div className="profile-form-section-head">
              <span>{tx(appLanguage, '설정', 'Settings')}</span>
              <p>{tx(appLanguage, '로그아웃과 회원탈퇴는 여기서 진행할 수 있어요.', 'You can log out or leave the app from here.')}</p>
            </div>
            <div className="profile-settings-actions">
              <button className="inline-action" type="button" onClick={() => setSettingsAction('logout')} disabled={saving || actionPending}>
                {tx(appLanguage, '로그아웃', 'Log out')}
              </button>
              <button className="inline-action danger-soft" type="button" onClick={() => setSettingsAction('delete')} disabled={saving || actionPending}>
                {tx(appLanguage, '회원탈퇴', 'Delete account')}
              </button>
            </div>
          </div>
        </form>
      </article>

      {settingsAction ? (
        <>
          <button
            className="workout-finish-backdrop"
            type="button"
            aria-label={tx(appLanguage, '설정 확인 닫기', 'Close settings confirmation')}
            onClick={() => !actionPending && setSettingsAction('')}
          />
          <section className="content-card workout-finish-modal" aria-label={tx(appLanguage, '설정 확인', 'Settings confirmation')}>
            <div className="workout-finish-copy">
              <h2>
                {settingsAction === 'delete'
                  ? tx(appLanguage, '회원탈퇴를 진행할까요?', 'Proceed with account deletion?')
                  : tx(appLanguage, '로그아웃할까요?', 'Log out now?')}
              </h2>
              <p>
                {settingsAction === 'delete'
                  ? tx(
                      appLanguage,
                      '현재 버전에서는 앱에 저장된 프로필과 목표 데이터 삭제 후 로그아웃까지 진행돼요. Auth 계정 완전 삭제는 추후 서버 연동이 필요해요.',
                      'This version removes your saved app profile and target data, then logs you out. Full Auth account deletion still needs server-side support.',
                    )
                  : tx(
                      appLanguage,
                      '현재 기기에서 세션을 종료하고 로그인 화면으로 이동해요.',
                      'This ends your current session on this device and returns you to the login screen.',
                    )}
              </p>
            </div>
            <div className="workout-finish-actions">
              <button className="inline-action" type="button" onClick={() => setSettingsAction('')} disabled={actionPending}>
                {tx(appLanguage, '취소', 'Cancel')}
              </button>
              <button
                className={settingsAction === 'delete' ? 'inline-action danger-soft' : 'inline-action primary-dark'}
                type="button"
                onClick={settingsAction === 'delete' ? handleDeleteAccount : handleLogout}
                disabled={actionPending}
              >
                {actionPending
                  ? tx(appLanguage, '처리 중...', 'Processing...')
                  : settingsAction === 'delete'
                    ? tx(appLanguage, '탈퇴 진행', 'Continue deletion')
                    : tx(appLanguage, '로그아웃', 'Log out')}
              </button>
            </div>
          </section>
        </>
      ) : null}
    </section>
  )
}

export default ProfileEditPage
