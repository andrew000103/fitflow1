import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import FeedTabs from '../components/social/FeedTabs.jsx'
import ActivityFeedCard from '../components/social/ActivityFeedCard.jsx'
import PostCard from '../components/social/PostCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useAuth } from '../features/auth/useAuth.js'
import SocialDevSeedPanel from '../features/social/SocialDevSeedPanel.jsx'
import {
  createSocialComment,
  createSocialReaction,
  deleteSocialPost,
  getCrewFeed,
  getProfileFeed,
  getRecommendedFeed,
  updateSocialPost,
} from '../features/social/socialFeedApi.ts'
import { tx } from '../utils/appLanguage.js'
import '../styles/socialFeed.css'

function CommunityPage() {
  const { appLanguage } = useOutletContext()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('recommended')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [recommendedFeed, setRecommendedFeed] = useState([])
  const [crewFeed, setCrewFeed] = useState([])
  const [challengeFeed, setChallengeFeed] = useState([])
  const [popularFeed, setPopularFeed] = useState([])

  function applyPostUpdate(postItem, updater) {
    const updateList = (items) =>
      items.map((item) => {
        if (item.type !== 'post' || item.sourceId !== postItem.sourceId) {
          return item
        }

        return typeof updater === 'function' ? updater(item) : { ...item, ...updater }
      })

    setRecommendedFeed(updateList)
    setCrewFeed(updateList)
    setChallengeFeed(updateList)
    setPopularFeed(updateList)
  }

  function removePostFromLists(postItem) {
    const filterList = (items) => items.filter((item) => !(item.type === 'post' && item.sourceId === postItem.sourceId))

    setRecommendedFeed(filterList)
    setCrewFeed(filterList)
    setChallengeFeed(filterList)
    setPopularFeed(filterList)
  }

  async function refreshFeed() {
    if (!user?.id) {
      setStatus('error')
      setError(tx(appLanguage, '로그인 정보를 찾을 수 없어요.', 'We could not find your login session.'))
      return
    }

    setStatus('loading')
    setError('')

    const [recommendedItems, crewItems] = await Promise.all([
      getRecommendedFeed(user.id, 28),
      getCrewFeed(user.id, 28),
    ])

    const challengeItems = recommendedItems.filter((item) => item.challenge || item.eventType?.includes('challenge'))
    const popularItems = [...recommendedItems].sort((left, right) => right.engagementScore - left.engagementScore).slice(0, 28)

    setRecommendedFeed(recommendedItems)
    setCrewFeed(crewItems)
    setChallengeFeed(challengeItems)
    setPopularFeed(popularItems)
    setStatus('ready')
  }

  useEffect(() => {
    let active = true

    async function loadFeed() {
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
        const [recommendedItems, crewItems] = await Promise.all([
          getRecommendedFeed(user.id, 28),
          getCrewFeed(user.id, 28),
        ])

        if (!active) {
          return
        }

        const challengeItems = recommendedItems.filter((item) => item.challenge || item.eventType?.includes('challenge'))
        const popularItems = [...recommendedItems].sort((left, right) => right.engagementScore - left.engagementScore).slice(0, 28)

        setRecommendedFeed(recommendedItems)
        setCrewFeed(crewItems)
        setChallengeFeed(challengeItems)
        setPopularFeed(popularItems)
        setStatus('ready')
      } catch (loadError) {
        if (!active) {
          return
        }

        setStatus('error')
        setError(loadError.message || tx(appLanguage, '커뮤니티 피드를 불러오지 못했어요.', 'Could not load the community feed.'))
      }
    }

    loadFeed()

    return () => {
      active = false
    }
  }, [appLanguage, user?.id])

  const visibleFeed = useMemo(() => {
    if (activeTab === 'crew') {
      return crewFeed
    }

    if (activeTab === 'challenge') {
      return challengeFeed
    }

    if (activeTab === 'popular') {
      return popularFeed
    }

    return recommendedFeed
  }, [activeTab, challengeFeed, crewFeed, popularFeed, recommendedFeed])

  async function handlePostUpdate(postItem, payload) {
    if (!user?.id) {
      throw new Error('로그인 정보를 확인해 주세요.')
    }

    if (payload?.mode === 'react') {
      await createSocialReaction(postItem.sourceId, user.id, payload.reactionType)
      await refreshFeed()
      return
    }

    if (payload?.mode === 'comment') {
      await createSocialComment(postItem.sourceId, user.id, payload.body || '')
      await refreshFeed()
      return
    }

    const result = await updateSocialPost(postItem.sourceId, user.id, payload)

    applyPostUpdate(postItem, (item) => ({
      ...item,
      title: result?.title || payload.title,
      body: result?.body || payload.body,
      updatedAt: result?.updated_at || new Date().toISOString(),
    }))
  }

  async function handlePostDelete(postItem) {
    if (!user?.id) {
      throw new Error('로그인 정보를 확인해 주세요.')
    }

    await deleteSocialPost(postItem.sourceId, user.id)
    removePostFromLists(postItem)
  }

  return (
    <section className="page-section social-feed-page">
      <PageHeader
        eyebrow={tx(appLanguage, '커뮤니티', 'Community')}
        title={tx(appLanguage, '커뮤니티', 'Community')}
        description={tx(
          appLanguage,
          '운동 진행, 연속 기록, PR, 챌린지 활동을 한 화면에서 가볍게 확인해요.',
          'See workout progress, streaks, PRs, and challenge activity in one lightweight feed.',
        )}
      />

      <section className="social-feed-shell">
        <article className="content-card social-feed-hero">
          <div>
            <span className="card-kicker">{tx(appLanguage, '오늘 피드', 'Today feed')}</span>
            <h2>{tx(appLanguage, '운동 흐름이 잘 보이는 커뮤니티', 'A community feed built around real progress')}</h2>
            <p>{tx(appLanguage, '가벼운 소셜보다, 오늘의 기록과 꾸준함이 먼저 보이도록 정리했어요.', 'Designed to show today effort and consistency before generic social noise.')}</p>
          </div>
        </article>

        <FeedTabs activeTab={activeTab} onChange={setActiveTab} />

        {status === 'loading' ? (
          <article className="content-card social-feed-state">
            <strong>{tx(appLanguage, '피드를 불러오는 중...', 'Loading the feed...')}</strong>
            <p>{tx(appLanguage, '운동 기록과 활동 업데이트를 정리하고 있어요.', 'We are pulling in workout progress and activity updates.')}</p>
          </article>
        ) : null}

        {status === 'error' ? (
          <article className="content-card social-feed-state error">
            <strong>{tx(appLanguage, '피드를 불러오지 못했어요.', 'We could not load the feed.')}</strong>
            <p>{error}</p>
          </article>
        ) : null}

        {status === 'ready' ? (
          <section className="social-feed-list">
            {visibleFeed.map((item) =>
              item.type === 'activity' ? (
                <ActivityFeedCard key={item.id} item={item} />
              ) : (
                <PostCard
                  key={item.id}
                  item={item}
                  currentUserId={user?.id}
                  onUpdate={handlePostUpdate}
                  onDelete={handlePostDelete}
                />
              ),
            )}
          </section>
        ) : null}

        {status === 'ready' && visibleFeed.length === 0 ? (
          <article className="content-card social-feed-state">
            <strong>{tx(appLanguage, '아직 표시할 활동이 없어요.', 'There are no activities to show yet.')}</strong>
            <p>{tx(appLanguage, '운동 기록이나 크루 활동이 생기면 여기서 바로 확인할 수 있어요.', 'When workout progress or crew activity appears, it will show up here right away.')}</p>
          </article>
        ) : null}

        {import.meta.env.DEV ? (
          <article className="content-card social-feed-dev-card">
            <span className="card-kicker">DEV</span>
            <h2>내 프로필 피드 미리보기</h2>
            <p>프로필 전용 피드 helper 연결을 빠르게 확인하는 영역입니다.</p>
            <button
              type="button"
              className="inline-action"
              onClick={async () => {
                if (!user?.id) return
                const items = await getProfileFeed(user.id, user.id, 8)
                setRecommendedFeed(items)
                setActiveTab('recommended')
              }}
            >
              프로필 피드 로드
            </button>
            <SocialDevSeedPanel userId={user.id} onCreated={refreshFeed} />
            <div className="social-feed-dev-note">profile helper is ready</div>
          </article>
        ) : null}
      </section>
    </section>
  )
}

export default CommunityPage
