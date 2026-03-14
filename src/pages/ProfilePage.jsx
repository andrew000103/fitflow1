import { useMemo } from 'react'
import AppIcon from '../components/AppIcon.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { Link, useOutletContext } from 'react-router-dom'
import buildAnalyticsViewModel from '../components/analytics/buildAnalyticsViewModel.js'
import BodyMapBack from '../components/bodymap/BodyMapBack.jsx'
import BodyMapCard from '../components/bodymap/BodyMapCard.jsx'
import BodyMapFront from '../components/bodymap/BodyMapFront.jsx'
import MuscleLegend from '../components/bodymap/MuscleLegend.jsx'
import {
  calculateMuscleFatigue,
  getRecoveryRecommendation,
  normalizeMuscleScores,
} from '../utils/muscleFatigue.js'

function ProfilePage() {
  const context = useOutletContext()
  const {
    goal,
    setGoal,
    steps,
    setSteps,
    streakDays,
    aiCoach,
    resetAllData,
    posts,
    likedPostIds,
    hiddenPostIds,
    programs,
    meals,
    sessions,
  } = context
  const analytics = buildAnalyticsViewModel(context)
  const normalizedMuscleScores = useMemo(
    () => normalizeMuscleScores(calculateMuscleFatigue(sessions)),
    [sessions],
  )
  const recoveryRecommendation = useMemo(
    () => getRecoveryRecommendation(normalizedMuscleScores),
    [normalizedMuscleScores],
  )

  const currentWeight = 77.7
  const targetWeight = goal === 'diet' ? 74 : goal === 'bulk' ? 82 : 78
  const followerCount = 128
  const followingCount = 64
  const goalLabel = goal === 'diet' ? '감량' : goal === 'bulk' ? '벌크업' : '체중 유지'
  const myPosts = posts.filter((post) => post.author === 'You')
  const likedPosts = posts.filter((post) => likedPostIds.includes(post.id))

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
            <div className="profile-avatar"><AppIcon name="profile" /></div>
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
              <strong>{myPosts.length}</strong>
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
              <span>좋아요한 게시물</span>
              <strong>{likedPosts.length}</strong>
            </div>
          </div>
          <div className="mini-panel">{aiCoach.communityTitle} · {aiCoach.community}</div>
        </article>
      </div>

      <div className="card-grid split">
        <article className="content-card">
          <span className="card-kicker">My menus</span>
          <div className="profile-menu-grid">
            <Link className="template-chip" to="/train/history">
              <strong>내 운동 기록</strong>
              <span>{sessions.length}개 세션을 회고합니다.</span>
            </Link>
            <Link className="template-chip" to="/nutrition/diary">
              <strong>내 식단 기록</strong>
              <span>{meals.length}개 식단 기록을 관리합니다.</span>
            </Link>
            <Link className="template-chip" to="/train">
              <strong>내 프로그램</strong>
              <span>{programs.length}개 프로그램을 관리합니다.</span>
            </Link>
            <div className="template-chip">
              <strong>좋아요한 게시물</strong>
              <span>{likedPosts.length}개 게시물을 여기서 바로 봅니다.</span>
            </div>
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
            <div className="mini-panel">알림 설정: 휴식 타이머, 커뮤니티 반응, 식단 리마인더</div>
            <div className="mini-panel">구독 관리: Pro 배지, AI 추천 확장, 프로그램 마켓 기능</div>
            <div className="mini-panel">추천 설정: {aiCoach.trainingTitle} · {aiCoach.training}</div>
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

      <div className="card-grid split">
        <article className="content-card">
          <div className="feed-head">
            <div>
              <span className="card-kicker">My community</span>
              <h2>내가 쓴 글</h2>
            </div>
            <span className="pill-tag">{myPosts.length} posts</span>
          </div>
          <div className="simple-list">
            {myPosts.length > 0 ? (
              myPosts.map((post) => (
                <div className="simple-row compact" key={post.id}>
                  <strong>{post.title}</strong>
                  <span>{hiddenPostIds.includes(post.id) ? '숨김 상태' : post.goalTag || post.category}</span>
                  <span>Like {post.likes}</span>
                </div>
              ))
            ) : (
              <div className="mini-panel">아직 작성한 게시물이 없습니다.</div>
            )}
          </div>
          <Link className="inline-action" to="/connect/feed">
            Connect로 이동
          </Link>
        </article>

        <article className="content-card">
          <div className="feed-head">
            <div>
              <span className="card-kicker">Liked posts</span>
              <h2>좋아요한 게시물</h2>
            </div>
            <span className="pill-tag">{likedPosts.length} likes</span>
          </div>
          <div className="simple-list">
            {likedPosts.length > 0 ? (
              likedPosts.map((post) => (
                <div className="simple-row compact" key={post.id}>
                  <strong>{post.title}</strong>
                  <span>{post.author}</span>
                  <span>{post.goalTag || post.category}</span>
                </div>
              ))
            ) : (
              <div className="mini-panel">아직 좋아요한 게시물이 없습니다.</div>
            )}
          </div>
        </article>
      </div>

      <article className="content-card">
        <div className="feed-head">
          <div>
            <span className="card-kicker">Analytics in profile</span>
            <h2>기록 분석</h2>
          </div>
          <span className="pill-tag accent">Integrated</span>
        </div>
        <div className="card-grid four-up analytics-summary-grid">
          <div className="summary-grid-block">
            <span>Weekly volume</span>
            <strong>{analytics.totalVolume.toLocaleString()} kg</strong>
          </div>
          <div className="summary-grid-block">
            <span>Workout count</span>
            <strong>{analytics.weeklyWorkoutCount} sessions</strong>
          </div>
          <div className="summary-grid-block">
            <span>Recovery</span>
            <strong>{analytics.fatigueLabel} {analytics.fatigueScore}</strong>
          </div>
          <div className="summary-grid-block">
            <span>Net calories</span>
            <strong>{analytics.netCalories} kcal</strong>
          </div>
        </div>
        <div className="card-grid split analytics-detail-grid">
          <div className="mini-panel">
            권장 섭취량 {analytics.recommendedCalories} kcal · 범위 {analytics.recommendedCaloriesRange.min}-{analytics.recommendedCaloriesRange.max} kcal
          </div>
          <div className="mini-panel">
            {aiCoach.trainingTitle} · {aiCoach.training}
          </div>
        </div>
        <div className="program-chip-list">
          <Link className="inline-action" to="/train/history">
            Workout history 보기
          </Link>
          <Link className="inline-action" to="/nutrition/diary">
            Nutrition 보기
          </Link>
        </div>
      </article>

      <article className="content-card">
        <div className="feed-head">
          <div>
            <span className="card-kicker">Body fatigue map</span>
            <h2>근육 피로도 시각화</h2>
          </div>
          <span className="pill-tag accent">7 days</span>
        </div>

        <div className="card-grid three-up">
          <div className="mini-panel">
            <strong>회복이 필요한 부위</strong>
            <p>{recoveryRecommendation.shouldRest.map((item) => item.label).join(', ') || '없음'}</p>
          </div>
          <div className="mini-panel">
            <strong>운동 가능한 부위</strong>
            <p>{recoveryRecommendation.trainable.map((item) => item.label).join(', ') || '없음'}</p>
          </div>
          <div className="mini-panel">
            <strong>최근 주요 사용 부위</strong>
            <p>{recoveryRecommendation.primaryUsage.map((item) => item.label).join(', ') || '없음'}</p>
          </div>
        </div>

        <div className="bodymap-layout">
          <BodyMapCard title="Front" subtitle="앞면">
            <BodyMapFront scores={normalizedMuscleScores} />
          </BodyMapCard>
          <BodyMapCard title="Back" subtitle="뒷면">
            <BodyMapBack scores={normalizedMuscleScores} />
          </BodyMapCard>
        </div>

        <MuscleLegend />

        <div className="muscle-detail-list">
          {recoveryRecommendation.rows.map((item) => (
            <div className="muscle-detail-row" key={item.muscle}>
              <strong>{item.label}</strong>
              <span>{item.score}</span>
              <span>{item.level}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}

export default ProfilePage
