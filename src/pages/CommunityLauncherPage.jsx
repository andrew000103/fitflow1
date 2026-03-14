import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import TrainActionCard from '../components/train/TrainActionCard.jsx'

function CommunityLauncherPage() {
  const { posts, aiCoach, followedAuthors } = useOutletContext()

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Connect"
        title="Connect"
        description="피드를 탐색하거나 인기글과 추천 사용자를 필요한 화면에서 확인합니다."
      />

      <div className="launcher-stat-row">
        <article className="launcher-stat-card">
          <span className="card-kicker">For you</span>
          <strong>{posts.length} posts</strong>
          <p>{aiCoach.community}</p>
        </article>
        <article className="launcher-stat-card">
          <span className="card-kicker">Following</span>
          <strong>{followedAuthors.length}</strong>
          <p>자주 보는 작성자와 루틴 기반 추천을 확인합니다.</p>
        </article>
      </div>

      <div className="train-action-grid">
        <TrainActionCard
          to="/connect/feed"
          title="Open Feed"
          subtitle="For You와 Following 피드를 보고 반응합니다."
          icon="feed"
          cta="Browse"
        />
        <TrainActionCard
          to="/connect/feed"
          title="Hot Posts"
          subtitle="일간, 주간, 월간 인기글을 확인합니다."
          icon="hot"
          cta="Open"
        />
      </div>
    </section>
  )
}

export default CommunityLauncherPage
