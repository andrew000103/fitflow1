import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { useOutletContext } from 'react-router-dom'
import {
  activityLevelLabel,
  goalLabel,
  healthSourceLabel,
  healthStatusLabel,
  nutritionPreferenceLabel,
  sexLabel,
  tx,
  unitSystemLabel,
} from '../utils/appLanguage.js'

function ProfilePage() {
  const {
    appLanguage,
    colorTheme,
    setColorTheme,
    userProfile,
    sessions,
    updateUserProfile,
    healthConnection,
    updateHealthConnection,
    weightHistory,
    lastWeightCheckInDate,
    nextWeightCheckInDate,
    weightReminderDue,
    recordWeightCheckIn,
    consumedCalories,
    totalBurn,
    netCalories,
    recommendedCalories,
    recommendedCaloriesRange,
    totalWorkoutCalories,
    activityCalories,
    stepCalories,
    baseMetabolism,
    resetAllData,
  } = useOutletContext()
  const [profileForm, setProfileForm] = useState(() => ({
    name: userProfile.name,
    bio: userProfile.bio,
    sex: userProfile.sex,
    age: userProfile.age,
    heightCm: userProfile.heightCm,
    weightKg: userProfile.weightKg,
    targetWeightKg: userProfile.targetWeightKg,
    activityLevel: userProfile.activityLevel,
    goal: userProfile.goal,
    unitSystem: userProfile.unitSystem,
    nutritionPreference: userProfile.nutritionPreference,
    notificationsEnabled: userProfile.notificationsEnabled,
    monthlyWeightReminderEnabled: userProfile.monthlyWeightReminderEnabled !== false,
  }))

  useEffect(() => {
    setProfileForm({
      name: userProfile.name,
      bio: userProfile.bio,
      sex: userProfile.sex,
      age: userProfile.age,
      heightCm: userProfile.heightCm,
      weightKg: userProfile.weightKg,
      targetWeightKg: userProfile.targetWeightKg,
      activityLevel: userProfile.activityLevel,
      goal: userProfile.goal,
      unitSystem: userProfile.unitSystem,
      nutritionPreference: userProfile.nutritionPreference,
      notificationsEnabled: userProfile.notificationsEnabled,
      monthlyWeightReminderEnabled: userProfile.monthlyWeightReminderEnabled !== false,
    })
  }, [userProfile])

  const recentWeightEntries = useMemo(() => weightHistory.slice(0, 4), [weightHistory])
  const big3Summary = useMemo(() => {
    const bests = {
      bench: 0,
      squat: 0,
      deadlift: 0,
    }

    sessions.forEach((session) => {
      session.exercises.forEach((exercise) => {
        const name = String(exercise.name || '').toLowerCase()
        const maxWeight = Number(exercise.maxWeight || 0)

        if (name === 'bench press') {
          bests.bench = Math.max(bests.bench, maxWeight)
        }

        if (name === 'back squat' || name === 'squat') {
          bests.squat = Math.max(bests.squat, maxWeight)
        }

        if (name === 'deadlift' || name === 'conventional deadlift' || name === 'trap bar deadlift') {
          bests.deadlift = Math.max(bests.deadlift, maxWeight)
        }
      })
    })

    return {
      ...bests,
      total: bests.bench + bests.squat + bests.deadlift,
    }
  }, [sessions])

  const goalText = goalLabel(appLanguage, userProfile.goal)
  const profileBio =
    userProfile.bio === 'Train, Nutrition, FF Trainer에서 쓰는 개인 설정을 관리합니다.' ||
    userProfile.bio === 'Manage the personal settings used in Train, Nutrition, and FF Trainer.'
      ? tx(
          appLanguage,
          'Train, Nutrition, FF Trainer에서 쓰는 개인 설정을 관리합니다.',
          'Manage the personal settings used in Train, Nutrition, and FF Trainer.',
        )
      : userProfile.bio
  const healthBadgeLabel =
    healthConnection.status === 'connected'
      ? tx(appLanguage, `${healthSourceLabel(appLanguage, healthConnection.source)} 연결됨`, `${healthSourceLabel(appLanguage, healthConnection.source)} connected`)
      : tx(appLanguage, '건강 데이터 연결 안 됨', 'Health not connected')
  const energyStatus =
    netCalories > recommendedCaloriesRange.max - totalBurn
      ? tx(appLanguage, '오늘은 권장 섭취보다 높은 상태입니다.', 'You are above your recommended intake today.')
      : netCalories < recommendedCaloriesRange.min - totalBurn
        ? tx(appLanguage, '오늘은 권장 섭취보다 낮은 상태입니다.', 'You are below your recommended intake today.')
        : tx(appLanguage, '오늘은 목표 범위 안에 있습니다.', 'You are within your target range today.')

  function updateProfileForm(field, value) {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleSaveProfile() {
    const nextWeight = Number(profileForm.weightKg) || userProfile.weightKg
    updateUserProfile({
      ...profileForm,
      age: Number(profileForm.age) || 0,
      heightCm: Number(profileForm.heightCm) || 0,
      weightKg: nextWeight,
      targetWeightKg: Number(profileForm.targetWeightKg) || 0,
    })
    recordWeightCheckIn(nextWeight, { source: 'profile' })
  }

  function handleResetProfileForm() {
    setProfileForm({
      name: userProfile.name,
      bio: userProfile.bio,
      sex: userProfile.sex,
      age: userProfile.age,
      heightCm: userProfile.heightCm,
      weightKg: userProfile.weightKg,
      targetWeightKg: userProfile.targetWeightKg,
      activityLevel: userProfile.activityLevel,
      goal: userProfile.goal,
      unitSystem: userProfile.unitSystem,
      nutritionPreference: userProfile.nutritionPreference,
      notificationsEnabled: userProfile.notificationsEnabled,
      monthlyWeightReminderEnabled: userProfile.monthlyWeightReminderEnabled !== false,
    })
  }

  return (
    <section className="page-section">
      <PageHeader
        title={tx(appLanguage, '개인 프로필', 'Personal Profile')}
        description={tx(
          appLanguage,
          '목표, 몸 정보, 에너지 상태, 핵심 설정을 한곳에서 관리합니다.',
          'Manage your goals, body data, energy, and core settings in one place.',
        )}
      />

      <article className="content-card profile-energy-hero">
        <div className="profile-head">
          <div className="profile-avatar">FF</div>
          <div>
            <h2>{userProfile.name}</h2>
            <p>{profileBio}</p>
          </div>
        </div>
        <div className="profile-hero-meta">
          <span className="pill-tag profile-accent-chip">{goalText}</span>
          <span
            className={
              healthConnection.status === 'connected'
                ? 'pill-tag profile-accent-chip'
                : 'pill-tag profile-muted-chip'
            }
          >
            {healthBadgeLabel}
          </span>
        </div>
      </article>

      {weightReminderDue ? (
        <article className="content-card profile-reminder-card">
          <div className="feed-head">
            <div>
              <h2>{tx(appLanguage, '이번 달 체중 체크가 필요해요', 'Monthly weight check-in is due')}</h2>
              <p>
                {tx(
                  appLanguage,
                  `${nextWeightCheckInDate} 전에 새 체중을 기록해 변화를 이어가세요.`,
                  `Log your latest weight and keep your body trend up to date. Next target date: ${nextWeightCheckInDate}.`,
                )}
              </p>
            </div>
            <button
              className="inline-action primary-dark profile-primary-action"
              type="button"
              onClick={() => recordWeightCheckIn(profileForm.weightKg || userProfile.weightKg, { source: 'reminder' })}
            >
              {tx(appLanguage, '지금 기록', 'Log now')}
            </button>
          </div>
        </article>
      ) : null}

      <div className="card-grid split">
        <article className="content-card">
          <div className="feed-head">
            <h2>{tx(appLanguage, 'Daily Energy', 'Daily Energy')}</h2>
            <span className="pill-tag profile-accent-chip">
              {recommendedCalories} kcal {tx(appLanguage, '목표', 'target')}
            </span>
          </div>
          <div className="summary-grid tight">
            <div>
              <span>{tx(appLanguage, '목표 칼로리', 'Target Calories')}</span>
              <strong>{recommendedCalories} kcal</strong>
            </div>
            <div>
              <span>{tx(appLanguage, '섭취', 'Intake')}</span>
              <strong>{consumedCalories} kcal</strong>
            </div>
            <div>
              <span>{tx(appLanguage, '총소모', 'Total Burn')}</span>
              <strong>{Math.round(totalBurn)} kcal</strong>
            </div>
            <div>
              <span>Net Calories</span>
              <strong>{Math.round(netCalories)} kcal</strong>
            </div>
          </div>
          <div className="mini-panel">
            {tx(appLanguage, '권장 범위', 'Recommended range')} {recommendedCaloriesRange.min} - {recommendedCaloriesRange.max} kcal
          </div>
          <div className="mini-panel">
            BMR {Math.round(baseMetabolism)} · {tx(appLanguage, '생활 활동', 'Lifestyle')} {activityCalories} · {tx(appLanguage, '걸음', 'Steps')} {stepCalories} · {tx(appLanguage, '운동', 'Workout')} {Math.round(totalWorkoutCalories)}
          </div>
          <div className="mini-panel">{energyStatus}</div>
        </article>

        <article className="content-card">
          <div className="feed-head">
            <h2>{tx(appLanguage, 'Body & Goal', 'Body & Goal')}</h2>
            <span className="pill-tag">
              {tx(appLanguage, `최근 체크 ${lastWeightCheckInDate}`, `Last check-in ${lastWeightCheckInDate}`)}
            </span>
          </div>
          <div className="summary-grid tight">
            <div>
              <span>{tx(appLanguage, '성별', 'Sex')}</span>
              <strong>{sexLabel(appLanguage, userProfile.sex)}</strong>
            </div>
            <div>
              <span>{tx(appLanguage, '나이', 'Age')}</span>
              <strong>{userProfile.age}</strong>
            </div>
            <div>
              <span>{tx(appLanguage, '키', 'Height')}</span>
              <strong>{userProfile.heightCm} cm</strong>
            </div>
            <div>
              <span>{tx(appLanguage, '현재 체중', 'Current Weight')}</span>
              <strong>{userProfile.weightKg} kg</strong>
            </div>
            <div>
              <span>{tx(appLanguage, '목표 체중', 'Target Weight')}</span>
              <strong>{userProfile.targetWeightKg} kg</strong>
            </div>
            <div>
              <span>{tx(appLanguage, '활동 수준', 'Activity Level')}</span>
              <strong>{activityLevelLabel(appLanguage, userProfile.activityLevel)}</strong>
            </div>
            <div>
              <span>{tx(appLanguage, '목표', 'Goal')}</span>
              <strong>{goalText}</strong>
            </div>
            <div>
              <span>{tx(appLanguage, '단위', 'Units')}</span>
              <strong>{unitSystemLabel(appLanguage, userProfile.unitSystem)}</strong>
            </div>
          </div>
          <div className="mini-panel profile-big3-panel">
            <span>{tx(appLanguage, '3대 PR', 'Big 3 PR')}</span>
            <strong>{big3Summary.total} kg</strong>
            <div className="profile-big3-breakdown">
              <span>Bench {big3Summary.bench} kg</span>
              <span>Squat {big3Summary.squat} kg</span>
              <span>Deadlift {big3Summary.deadlift} kg</span>
            </div>
          </div>
        </article>
      </div>

      <details className="content-card profile-accordion">
        <summary className="profile-accordion-summary">
          <div>
            <h2>{tx(appLanguage, 'Edit Profile', 'Edit Profile')}</h2>
            <p>{tx(appLanguage, '나이, 키, 몸무게, 목표 정보를 직접 수정하고 저장합니다.', 'Update your age, height, weight, and goals here.')}</p>
          </div>
          <span className="profile-accordion-arrow" aria-hidden="true">⌄</span>
        </summary>
        <div className="stack-form">
          <div className="compact-grid">
            <label className="field-label">
              {tx(appLanguage, '이름', 'Name')}
              <input value={profileForm.name} onChange={(event) => updateProfileForm('name', event.target.value)} />
            </label>
            <label className="field-label">
              {tx(appLanguage, '성별', 'Sex')}
              <select value={profileForm.sex} onChange={(event) => updateProfileForm('sex', event.target.value)}>
                <option value="male">{sexLabel(appLanguage, 'male')}</option>
                <option value="female">{sexLabel(appLanguage, 'female')}</option>
                <option value="other">{sexLabel(appLanguage, 'other')}</option>
              </select>
            </label>
          </div>
          <label className="field-label">
            {tx(appLanguage, '한 줄 소개', 'Bio')}
            <input value={profileForm.bio} onChange={(event) => updateProfileForm('bio', event.target.value)} />
          </label>
          <div className="compact-grid profile-edit-grid">
            <label className="field-label">
              {tx(appLanguage, '나이', 'Age')}
              <input value={profileForm.age} inputMode="numeric" onChange={(event) => updateProfileForm('age', event.target.value)} />
            </label>
            <label className="field-label">
              {tx(appLanguage, '키', 'Height')}
              <input value={profileForm.heightCm} inputMode="decimal" onChange={(event) => updateProfileForm('heightCm', event.target.value)} />
            </label>
            <label className="field-label">
              {tx(appLanguage, '현재 체중', 'Current Weight')}
              <input value={profileForm.weightKg} inputMode="decimal" onChange={(event) => updateProfileForm('weightKg', event.target.value)} />
            </label>
            <label className="field-label">
              {tx(appLanguage, '목표 체중', 'Target Weight')}
              <input value={profileForm.targetWeightKg} inputMode="decimal" onChange={(event) => updateProfileForm('targetWeightKg', event.target.value)} />
            </label>
          </div>
          <div className="compact-grid">
            <label className="field-label">
              {tx(appLanguage, '목표 상태', 'Goal Status')}
              <select value={profileForm.goal} onChange={(event) => updateProfileForm('goal', event.target.value)}>
                <option value="diet">{tx(appLanguage, '감량', 'Cut')}</option>
                <option value="maintain">{tx(appLanguage, '유지', 'Maintain')}</option>
                <option value="bulk">{tx(appLanguage, '벌크업', 'Bulk')}</option>
              </select>
            </label>
            <label className="field-label">
              {tx(appLanguage, '활동 수준', 'Activity Level')}
              <select value={profileForm.activityLevel} onChange={(event) => updateProfileForm('activityLevel', event.target.value)}>
                <option value="sedentary">{activityLevelLabel(appLanguage, 'sedentary')}</option>
                <option value="light">{activityLevelLabel(appLanguage, 'light')}</option>
                <option value="moderate">{activityLevelLabel(appLanguage, 'moderate')}</option>
                <option value="high">{activityLevelLabel(appLanguage, 'high')}</option>
              </select>
            </label>
          </div>
          <div className="compact-grid">
            <label className="field-label">
              {tx(appLanguage, '단위 체계', 'Unit System')}
              <select value={profileForm.unitSystem} onChange={(event) => updateProfileForm('unitSystem', event.target.value)}>
                <option value="metric">{unitSystemLabel(appLanguage, 'metric')}</option>
                <option value="imperial">{unitSystemLabel(appLanguage, 'imperial')}</option>
              </select>
            </label>
            <label className="field-label">
              {tx(appLanguage, '영양 기본값', 'Nutrition Preference')}
              <select value={profileForm.nutritionPreference} onChange={(event) => updateProfileForm('nutritionPreference', event.target.value)}>
                <option value="balanced">{nutritionPreferenceLabel(appLanguage, 'balanced')}</option>
                <option value="high-protein">{nutritionPreferenceLabel(appLanguage, 'high-protein')}</option>
                <option value="low-carb">{nutritionPreferenceLabel(appLanguage, 'low-carb')}</option>
              </select>
            </label>
          </div>
          <div className="compact-grid">
            <label className="check-wrap">
              <input
                type="checkbox"
                checked={Boolean(profileForm.notificationsEnabled)}
                onChange={(event) => updateProfileForm('notificationsEnabled', event.target.checked)}
              />
              <span>{tx(appLanguage, '일반 알림 사용', 'Enable notifications')}</span>
            </label>
            <label className="check-wrap">
              <input
                type="checkbox"
                checked={Boolean(profileForm.monthlyWeightReminderEnabled)}
                onChange={(event) => updateProfileForm('monthlyWeightReminderEnabled', event.target.checked)}
              />
              <span>{tx(appLanguage, '월간 체중 체크 리마인더', 'Monthly weight reminder')}</span>
            </label>
          </div>
        </div>
        <div className="program-chip-list">
          <button className="inline-action primary-dark profile-primary-action" type="button" onClick={handleSaveProfile}>
            {tx(appLanguage, '저장', 'Save')}
          </button>
          <button className="inline-action" type="button" onClick={handleResetProfileForm}>
            {tx(appLanguage, '되돌리기', 'Reset')}
          </button>
        </div>
      </details>

      <details className="content-card profile-accordion">
        <summary className="profile-accordion-summary">
          <div>
            <h2>{tx(appLanguage, 'Weight History', 'Weight History')}</h2>
            <p>{tx(appLanguage, '한 달에 한 번 이상 체중 변화를 기록해 주세요.', 'Record your body weight at least once a month.')}</p>
          </div>
          <div className="profile-accordion-meta">
            <span className="pill-tag">{tx(appLanguage, `다음 체크 ${nextWeightCheckInDate}`, `Next check ${nextWeightCheckInDate}`)}</span>
            <span className="profile-accordion-arrow" aria-hidden="true">⌄</span>
          </div>
        </summary>
        <div className="simple-list">
          {recentWeightEntries.map((entry) => (
            <div className="simple-row compact" key={entry.id}>
              <strong>{entry.weightKg} kg</strong>
              <span>{entry.date}</span>
              <span>{entry.source === 'reminder' ? tx(appLanguage, '리마인더 기록', 'Reminder log') : tx(appLanguage, '프로필 업데이트', 'Profile update')}</span>
            </div>
          ))}
        </div>
      </details>

      <details className="content-card profile-accordion">
        <summary className="profile-accordion-summary">
          <div>
            <h2>{tx(appLanguage, 'Connected Health', 'Connected Health')}</h2>
          </div>
          <div className="profile-accordion-meta">
            <span
              className={
                healthConnection.status === 'connected'
                  ? 'pill-tag profile-accent-chip'
                  : 'pill-tag profile-muted-chip'
              }
            >
              {healthStatusLabel(appLanguage, healthConnection.status)}
            </span>
            <span className="profile-accordion-arrow" aria-hidden="true">⌄</span>
          </div>
        </summary>
        <div className="summary-grid tight">
          <div>
            <span>{tx(appLanguage, '연동 소스', 'Source')}</span>
            <strong>{healthSourceLabel(appLanguage, healthConnection.source)}</strong>
          </div>
          <div>
            <span>{tx(appLanguage, '걸음 수', 'Steps')}</span>
            <strong>{healthConnection.latestSteps.toLocaleString()}</strong>
          </div>
          <div>
            <span>{tx(appLanguage, '거리', 'Distance')}</span>
            <strong>{healthConnection.latestDistanceKm} km</strong>
          </div>
          <div>
            <span>{tx(appLanguage, '활동 칼로리', 'Active Calories')}</span>
            <strong>{healthConnection.latestActiveCalories} kcal</strong>
          </div>
          <div>
            <span>{tx(appLanguage, '최근 동기화', 'Last Synced')}</span>
            <strong>{healthConnection.lastSyncedAt}</strong>
          </div>
        </div>
      </details>

      <details className="content-card profile-accordion">
        <summary className="profile-accordion-summary">
          <div>
            <h2>{tx(appLanguage, 'App Settings', 'App Settings')}</h2>
          </div>
          <span className="profile-accordion-arrow" aria-hidden="true">⌄</span>
        </summary>
        <div className="stack-form">
          <div className="compact-grid">
            <label className="field-label">
              {tx(appLanguage, '목표 상태', 'Goal Status')}
              <select
                value={userProfile.goal}
                onChange={(event) =>
                  updateUserProfile({
                    goal: event.target.value,
                    targetWeightKg:
                      event.target.value === 'diet' ? 74 : event.target.value === 'bulk' ? 82 : 78,
                  })
                }
              >
                <option value="diet">{tx(appLanguage, '감량', 'Cut')}</option>
                <option value="maintain">{tx(appLanguage, '유지', 'Maintain')}</option>
                <option value="bulk">{tx(appLanguage, '벌크업', 'Bulk')}</option>
              </select>
            </label>
          </div>
          <div className="compact-grid">
            <label className="field-label">
              {tx(appLanguage, '활동 수준', 'Activity Level')}
              <select
                value={userProfile.activityLevel}
                onChange={(event) => updateUserProfile({ activityLevel: event.target.value })}
              >
                <option value="sedentary">{activityLevelLabel(appLanguage, 'sedentary')}</option>
                <option value="light">{activityLevelLabel(appLanguage, 'light')}</option>
                <option value="moderate">{activityLevelLabel(appLanguage, 'moderate')}</option>
                <option value="high">{activityLevelLabel(appLanguage, 'high')}</option>
              </select>
            </label>
            <label className="field-label">
              {tx(appLanguage, '테마', 'Theme')}
              <select
                value={colorTheme}
                onChange={(event) => setColorTheme(event.target.value)}
              >
                <option value="light">{tx(appLanguage, '라이트', 'Light')}</option>
                <option value="dark">{tx(appLanguage, '다크', 'Dark')}</option>
              </select>
            </label>
          </div>
          <div className="compact-grid">
            <label className="field-label">
              {tx(appLanguage, '단위 체계', 'Unit System')}
              <select
                value={userProfile.unitSystem}
                onChange={(event) => updateUserProfile({ unitSystem: event.target.value })}
              >
                <option value="metric">{unitSystemLabel(appLanguage, 'metric')}</option>
                <option value="imperial">{unitSystemLabel(appLanguage, 'imperial')}</option>
              </select>
            </label>
          </div>
          <div className="compact-grid">
            <label className="check-wrap">
              <input
                type="checkbox"
                checked={Boolean(userProfile.monthlyWeightReminderEnabled)}
                onChange={(event) => updateUserProfile({ monthlyWeightReminderEnabled: event.target.checked })}
              />
              <span>{tx(appLanguage, '월간 체중 체크 리마인더', 'Monthly weight reminder')}</span>
            </label>
          </div>
          <div className="compact-grid">
            <label className="field-label">
              {tx(appLanguage, '현재 체중', 'Current Weight')}
              <input
                value={userProfile.weightKg}
                onChange={(event) => updateUserProfile({ weightKg: Number(event.target.value) || 0 })}
                inputMode="decimal"
              />
            </label>
            <label className="field-label">
              {tx(appLanguage, '목표 체중', 'Target Weight')}
              <input
                value={userProfile.targetWeightKg}
                onChange={(event) => updateUserProfile({ targetWeightKg: Number(event.target.value) || 0 })}
                inputMode="decimal"
              />
            </label>
          </div>
          <div className="compact-grid">
            <label className="field-label">
              {tx(appLanguage, '영양 기본값', 'Nutrition Preference')}
              <select
                value={userProfile.nutritionPreference}
                onChange={(event) => updateUserProfile({ nutritionPreference: event.target.value })}
              >
                <option value="balanced">{nutritionPreferenceLabel(appLanguage, 'balanced')}</option>
                <option value="high-protein">{nutritionPreferenceLabel(appLanguage, 'high-protein')}</option>
                <option value="low-carb">{nutritionPreferenceLabel(appLanguage, 'low-carb')}</option>
              </select>
            </label>
            <label className="field-label">
              {tx(appLanguage, '동기화된 걸음 수', 'Synced Steps')}
              <input
                value={healthConnection.latestSteps}
                onChange={(event) =>
                  updateHealthConnection({
                    latestSteps: Number(event.target.value) || 0,
                    lastSyncedAt: tx(appLanguage, '방금 전', 'Just now'),
                  })
                }
                inputMode="numeric"
              />
            </label>
          </div>
          <div className="compact-grid">
            <label className="field-label">
              {tx(appLanguage, '건강 데이터 소스', 'Health Source')}
              <select
                value={healthConnection.source}
                onChange={(event) => updateHealthConnection({ source: event.target.value })}
              >
                <option value="Apple Health">{healthSourceLabel(appLanguage, 'Apple Health')}</option>
                <option value="Health Connect">{healthSourceLabel(appLanguage, 'Health Connect')}</option>
                <option value="Manual">{healthSourceLabel(appLanguage, 'Manual')}</option>
              </select>
            </label>
          </div>
        </div>
        <div className="program-chip-list">
          <button
            className="inline-action"
            type="button"
            onClick={() =>
              updateHealthConnection({
                status: healthConnection.status === 'connected' ? 'disconnected' : 'connected',
                lastSyncedAt: tx(appLanguage, '방금 전', 'Just now'),
              })
            }
          >
            {tx(appLanguage, '건강 연결 상태 토글', 'Toggle Health Connection')}
          </button>
          <button className="inline-action" type="button" onClick={resetAllData}>
            {tx(appLanguage, '로컬 데이터 초기화', 'Reset Local Data')}
          </button>
        </div>
      </details>
    </section>
  )
}

export default ProfilePage
