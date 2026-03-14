import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { goalLabel, healthStatusLabel, tx } from '../utils/appLanguage.js'

function ProfileLauncherPage() {
  const { appLanguage, userProfile, healthConnection, recommendedCalories, netCalories } = useOutletContext()
  const goalText = goalLabel(appLanguage, userProfile.goal)

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={tx(appLanguage, '프로필', 'Profile')}
        title={tx(appLanguage, '프로필', 'Profile')}
        description={tx(appLanguage, '개인 상태, 목표, 대사 정보와 건강 데이터 연결을 관리합니다.', 'Manage your personal status, goals, metabolism, and health connection.')}
      />

      <div className="launcher-stat-row">
        <article className="launcher-stat-card">
          <span className="card-kicker">{tx(appLanguage, '목표', 'Goal')}</span>
          <strong>{goalText}</strong>
          <p>{userProfile.targetWeightKg} kg {tx(appLanguage, '목표로 조정 중입니다.', 'target in progress.')}</p>
        </article>
        <article className="launcher-stat-card">
          <span className="card-kicker">{tx(appLanguage, '목표 kcal', 'Target kcal')}</span>
          <strong>{recommendedCalories} kcal</strong>
          <p>{tx(appLanguage, '오늘 기준 권장 섭취 칼로리입니다.', 'Recommended intake for today.')}</p>
        </article>
        <article className="launcher-stat-card">
          <span className="card-kicker">{tx(appLanguage, '건강', 'Health')}</span>
          <strong>{healthStatusLabel(appLanguage, healthConnection.status)}</strong>
          <p>Net {Math.round(netCalories)} kcal</p>
        </article>
      </div>

      <div className="sticky-cta-bar">
        <Link className="inline-action primary-dark" to="/profile/me">
          {tx(appLanguage, '프로필 열기', 'Open Profile')}
        </Link>
      </div>
    </section>
  )
}

export default ProfileLauncherPage
