import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import TrainActionCard from '../components/train/TrainActionCard.jsx'

function ProfileLauncherPage() {
  const { goal, streakDays, programs, savedPostIds } = useOutletContext()

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Profile"
        title="Profile"
        description="내 정보, 설정, 기록 관리는 각각의 상세 화면에서 확인합니다."
      />

      <div className="launcher-stat-row">
        <article className="launcher-stat-card">
          <span className="card-kicker">Goal</span>
          <strong>{goal}</strong>
          <p>현재 목표와 기록 방향을 관리합니다.</p>
        </article>
        <article className="launcher-stat-card">
          <span className="card-kicker">Streak</span>
          <strong>{streakDays} days</strong>
          <p>일일 기록 리듬을 유지하고 있습니다.</p>
        </article>
        <article className="launcher-stat-card">
          <span className="card-kicker">Saved</span>
          <strong>{savedPostIds.length} posts</strong>
          <p>{programs.length} programs in library</p>
        </article>
      </div>

      <div className="train-action-grid">
        <TrainActionCard
          to="/profile/me"
          title="My Profile"
          subtitle="프로필, 내 글, 좋아요한 글, 인사이트를 확인합니다."
          icon="profile"
          cta="Open"
        />
        <TrainActionCard
          to="/profile/nutrition"
          title="Nutrition Manager"
          subtitle="식단 관리와 관련 설정을 바로 확인합니다."
          icon="nutrition"
          cta="Open"
        />
      </div>
    </section>
  )
}

export default ProfileLauncherPage
