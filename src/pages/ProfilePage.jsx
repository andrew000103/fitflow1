import PageHeader from '../components/PageHeader.jsx'
import { Link, useOutletContext } from 'react-router-dom'

function ProfilePage() {
  const {
    goal,
    setGoal,
    steps,
    setSteps,
    streakDays,
    aiCoach,
    resetAllData,
    posts,
    programs,
    meals,
    sessions,
  } = useOutletContext()

  const currentWeight = 77.7
  const targetWeight = goal === 'diet' ? 74 : goal === 'bulk' ? 82 : 78
  const followerCount = 128
  const followingCount = 64
  const savedPosts = Math.max(6, Math.ceil(posts.length * 1.5))
  const goalLabel = goal === 'diet' ? '감량' : goal === 'bulk' ? '벌크업' : '체중 유지'

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Profile / Me"
        title="내 정보, 성과, 설정, 기록 관리를 모아둔 프로필 허브"
        description="프로필 정보, 목표 상태, 체중, streak, 게시물/팔로우 지표와 내 운동·식단·프로그램·저장 게시물 관리, 설정까지 한 화면에서 다룹니다."
      />

      <div className="card-grid split">
        <article className="content-card">
          <div className="profile-head">
            <div className="profile-avatar">🙂</div>
            <div>
              <span className="card-kicker">Profile</span>
              <h2>Donghyun An</h2>
              <p>기록 기반으로 운동과 식단을 관리하고, 커뮤니티에서 동기부여를 받는 FitFlow 사용자입니다.</p>
            </div>
          </div>
          <div className="summary-grid tight">
            <div>
              <span>Goal</span>
              <strong>{goalLabel}</strong>
            </div>
            <div>
              <span>Current weight</span>
              <strong>{currentWeight} kg</strong>
            </div>
            <div>
              <span>Target weight</span>
              <strong>{targetWeight} kg</strong>
            </div>
            <div>
              <span>Streak</span>
              <strong>{streakDays} days</strong>
            </div>
          </div>
        </article>

        <article className="content-card">
          <span className="card-kicker">Performance</span>
          <div className="summary-grid tight">
            <div>
              <span>내 게시물 수</span>
              <strong>{posts.length}</strong>
            </div>
            <div>
              <span>팔로워</span>
              <strong>{followerCount}</strong>
            </div>
            <div>
              <span>팔로잉</span>
              <strong>{followingCount}</strong>
            </div>
            <div>
              <span>저장한 게시물</span>
              <strong>{savedPosts}</strong>
            </div>
          </div>
          <div className="mini-panel">{aiCoach.communityTitle} · {aiCoach.community}</div>
        </article>
      </div>

      <div className="card-grid split">
        <article className="content-card">
          <span className="card-kicker">My menus</span>
          <div className="profile-menu-grid">
            <Link className="template-chip" to="/history/calendar">
              <strong>🏋️ 내 운동 기록</strong>
              <span>{sessions.length}개 세션을 회고합니다.</span>
            </Link>
            <Link className="template-chip" to="/nutrition/diary">
              <strong>🍽️ 내 식단 기록</strong>
              <span>{meals.length}개 식단 기록을 관리합니다.</span>
            </Link>
            <Link className="template-chip" to="/train">
              <strong>📚 내 프로그램</strong>
              <span>{programs.length}개 프로그램을 관리합니다.</span>
            </Link>
            <Link className="template-chip" to="/community/feed">
              <strong>🔖 저장한 게시물</strong>
              <span>커뮤니티 피드에서 저장 콘텐츠를 모아봅니다.</span>
            </Link>
          </div>
        </article>

        <article className="content-card">
          <span className="card-kicker">Settings</span>
          <div className="stack-form">
            <label className="field-label">
              Goal status
              <select value={goal} onChange={(event) => setGoal(event.target.value)}>
                <option value="diet">감량</option>
                <option value="maintain">유지</option>
                <option value="bulk">벌크업</option>
              </select>
            </label>
            <label className="field-label">
              Current steps
              <input value={steps} onChange={(event) => setSteps(Number(event.target.value) || 0)} inputMode="numeric" />
            </label>
          </div>
          <div className="bullet-stack">
            <div className="mini-panel">🔔 알림 설정: 휴식 타이머, 커뮤니티 반응, 식단 리마인더</div>
            <div className="mini-panel">💳 구독 관리: Pro 배지, AI 추천 확장, 프로그램 마켓 기능</div>
            <div className="mini-panel">🤖 추천 설정: {aiCoach.trainingTitle} · {aiCoach.training}</div>
          </div>
          <div className="program-chip-list">
            <Link className="inline-action" to="/profile/nutrition">
              Nutrition 관리
            </Link>
            <button className="inline-action" type="button" onClick={resetAllData}>
              로컬 데이터 초기화
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}

export default ProfilePage
