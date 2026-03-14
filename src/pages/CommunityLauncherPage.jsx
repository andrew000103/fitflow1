import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { tx } from '../utils/appLanguage.js'

function CommunityLauncherPage() {
  const { appLanguage, posts, isResting, currentRestElapsed, aiCoach } = useOutletContext()
  const aiSeedCount = posts.filter((post) => post.aiMeta?.isAIGenerated).length
  const routineCount = posts.filter((post) => post.type === 'routine_post').length
  const mealCount = posts.filter((post) => post.type === 'meal_post').length
  const restClock = `${String(Math.floor(currentRestElapsed / 60)).padStart(2, '0')}:${String(currentRestElapsed % 60).padStart(2, '0')}`

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={tx(appLanguage, '커넥트', 'Connect')}
        title={tx(appLanguage, '커넥트', 'Connect')}
        description={tx(appLanguage, '운동 기록 앱과 연결된 탐색형 피드에서 루틴, 식단, 카드뉴스, 숏폼을 소비하고 바로 행동으로 연결합니다.', 'Explore routines, meals, card news, and short-form posts connected to your fitness logs.')}
      />

      <div className="launcher-stat-row">
        <article className="launcher-stat-card">
          <span className="card-kicker">{tx(appLanguage, '탐색 피드', 'Explore Feed')}</span>
          <strong>{posts.length} {tx(appLanguage, '게시물', 'posts')}</strong>
          <p>{tx(appLanguage, '루틴, 식단, 팁, 카드뉴스를 한 피드에서 탐색합니다.', 'Explore routines, meals, tips, and card news in one feed.')}</p>
        </article>
        <article className="launcher-stat-card">
          <span className="card-kicker">{tx(appLanguage, 'AI 시드', 'AI Seed')}</span>
          <strong>{aiSeedCount} {tx(appLanguage, '게시물', 'posts')}</strong>
          <p>{tx(appLanguage, '초기 빈 피드를 막기 위한 AI Guide / Editorial 콘텐츠입니다.', 'AI Guide / Editorial content for early feed seeding.')}</p>
        </article>
        <article className="launcher-stat-card">
          <span className="card-kicker">{tx(appLanguage, '휴식 추천', 'Rest Picks')}</span>
          <strong>{isResting ? tx(appLanguage, `휴식 ${restClock}`, `Rest ${restClock}`) : tx(appLanguage, '휴식 대기', 'Rest Ready')}</strong>
          <p>{aiCoach.communityTitle}</p>
        </article>
      </div>

      <div className="card-grid three-up">
        <article className="content-card">
          <span className="card-kicker">{tx(appLanguage, '루틴', 'Routines')}</span>
          <strong>{routineCount}</strong>
          <p>{tx(appLanguage, '저장 후 내 운동으로 가져올 수 있습니다.', 'Save and import into your workouts.')}</p>
        </article>
        <article className="content-card">
          <span className="card-kicker">{tx(appLanguage, '식단', 'Meals')}</span>
          <strong>{mealCount}</strong>
          <p>{tx(appLanguage, '식단 게시물을 저장하고 Nutrition에 반영할 수 있습니다.', 'Save meal posts and send them to Nutrition.')}</p>
        </article>
        <article className="content-card">
          <span className="card-kicker">{tx(appLanguage, 'AI 추천', 'AI Picks')}</span>
          <strong>Guide + Editorial</strong>
          <p>{tx(appLanguage, '초보자 팁, 선수 스타일 해설, 회복 카드뉴스를 기본 제공.', 'Starter tips, athlete-style explainers, and recovery cards by default.')}</p>
        </article>
      </div>

      <div className="sticky-cta-bar">
        <Link className="inline-action primary-dark" to="/connect/feed">
          {tx(appLanguage, '피드 열기', 'Open Feed')}
        </Link>
      </div>
    </section>
  )
}

export default CommunityLauncherPage
