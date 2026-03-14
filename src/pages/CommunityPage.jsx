import PageHeader from '../components/PageHeader.jsx'
import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

const feedTabs = ['for-you', 'following']
const rankingTabs = ['daily', 'weekly', 'monthly']
const composerTypes = ['운동 인증', '식단 공유', '짧은 팁', '숏폼 영상']

const shortformQueue = [
  { id: 'sf-1', title: '45초 흉추 가동성', author: 'Coach Mina', completionRate: 82 },
  { id: 'sf-2', title: '점심 고단백 메뉴 3개', author: 'FitCook', completionRate: 76 },
]

function normalizeGoal(goal) {
  return goal === 'diet' ? 'cut' : goal === 'bulk' ? 'bulk' : 'maintain'
}

function normalizePostType(type, index) {
  if (type) {
    return type
  }
  return index % 3 === 0 ? '운동 인증' : index % 3 === 1 ? '식단 공유' : '짧은 팁'
}

function CommunityPage() {
  const {
    posts,
    savedPostIds,
    reportedPostIds,
    followedAuthors,
    commentsByPost,
    shareEvents,
    likePost,
    addPost,
    toggleSavePost,
    reportPost,
    toggleFollowAuthor,
    addComment,
    addReply,
    sharePost,
    timeLeft,
    goal,
    aiCoach,
  } = useOutletContext()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [hashtags, setHashtags] = useState('#fitflow')
  const [feedTab, setFeedTab] = useState('for-you')
  const [rankingTab, setRankingTab] = useState('weekly')
  const [searchQuery, setSearchQuery] = useState('')
  const [composerType, setComposerType] = useState(composerTypes[0])
  const [goalTag, setGoalTag] = useState(normalizeGoal(goal))
  const [composerOpen, setComposerOpen] = useState(false)
  const [openCommentPostId, setOpenCommentPostId] = useState(null)
  const [commentDrafts, setCommentDrafts] = useState({})
  const [replyDrafts, setReplyDrafts] = useState({})

  function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim() || !body.trim()) {
      return
    }

    addPost({
      title: `[${composerType}] ${title.trim()}`,
      body: body.trim(),
      type: composerType,
      goalTag,
      hashtags: hashtags
        .split(' ')
        .map((item) => item.trim())
        .filter(Boolean),
      photoCount: composerType === '운동 인증' ? 1 : 0,
      hasVideo: composerType === '숏폼 영상',
      attachWorkoutCard: composerType === '운동 인증',
      attachDietCard: composerType === '식단 공유',
    })
    setTitle('')
    setBody('')
    setHashtags('#fitflow')
    setComposerOpen(false)
  }

  const restClock = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`
  const isResting = timeLeft > 0

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        if (feedTab === 'following') {
          return followedAuthors.includes(post.author)
        }
        return true
      })
      .filter((post) => {
        if (!searchQuery.trim()) {
          return true
        }
        const query = searchQuery.toLowerCase()
        return post.title.toLowerCase().includes(query) || post.body.toLowerCase().includes(query)
      })
  }, [feedTab, followedAuthors, posts, searchQuery])

  const rankedPosts = useMemo(() => {
    const recencyWeight = rankingTab === 'daily' ? 6 : rankingTab === 'weekly' ? 4 : 2
    return [...posts]
      .map((post, index) => {
        const saveCount = savedPostIds.includes(post.id) ? 1 : 0
        const commentCount = (commentsByPost[post.id] || []).length
        const viewCompletion = shortformQueue[index % shortformQueue.length]?.completionRate >= 70 ? 1 : 0
        const shareCount = shareEvents.filter((event) => event.postId === post.id).length
        const score =
          post.likes * 1 +
          commentCount * 3 +
          saveCount * 4 +
          viewCompletion * 2 +
          shareCount * 1 +
          Math.max(0, recencyWeight - index)

        return { ...post, score, commentCount, shareCount }
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, rankingTab === 'daily' ? 3 : rankingTab === 'weekly' ? 5 : 7)
  }, [commentsByPost, posts, rankingTab, savedPostIds, shareEvents])

  const recommendedUsers = useMemo(() => {
    return [...new Set(posts.map((post) => post.author))]
      .filter((author) => !followedAuthors.includes(author))
      .slice(0, 3)
      .map((author, index) => ({
        author,
        description:
          index === 0
            ? `${goal === 'diet' ? '감량' : goal === 'bulk' ? '벌크업' : '유지'} 목표가 비슷한 사용자`
            : '최근 본 콘텐츠와 관심사가 유사한 사용자',
      }))
  }, [followedAuthors, goal, posts])

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Community"
        title="기록과 동기부여가 자연스럽게 이어지는 피드"
        description="핵심 액션은 빠르게 접근하고, 나머지 정보는 정돈해서 보이도록 커뮤니티 화면을 다시 구성했습니다."
      />

      <div className="community-header">
        <div className="program-chip-list">
          {feedTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={feedTab === tab ? 'inline-action active-soft' : 'inline-action'}
              onClick={() => setFeedTab(tab)}
            >
              {tab === 'for-you' ? 'For You' : 'Following'}
            </button>
          ))}
        </div>
        <label className="community-search">
          <span>🔎</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="운동 팁, 식단, 루틴 검색"
          />
        </label>
      </div>

      <div className="community-layout">
        <div className="community-main">
          <article className="content-card composer-card">
            <div className="feed-head">
              <div>
                <span className="card-kicker">Create post</span>
                <h2>빠르게 공유하기</h2>
              </div>
              <div className="program-chip-list">
                <span className="pill-tag">{goalTag}</span>
                <button className="inline-action" type="button" onClick={() => setComposerOpen((current) => !current)}>
                  {composerOpen ? '닫기' : '새 게시물'}
                </button>
              </div>
            </div>
            {composerOpen ? (
              <form className="stack-form" onSubmit={handleSubmit}>
                <div className="program-chip-list">
                  {composerTypes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={composerType === item ? 'inline-action active-soft' : 'inline-action'}
                      onClick={() => setComposerType(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <label className="field-label">
                  제목
                  <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="오늘 공유할 핵심만 적어주세요" />
                </label>
                <label className="field-label">
                  내용
                  <textarea
                    rows="3"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="운동 인증, 식단 후기, 짧은 팁"
                  />
                </label>
                <div className="compact-grid">
                  <label className="field-label">
                    해시태그
                    <input value={hashtags} onChange={(event) => setHashtags(event.target.value)} placeholder="#backday #cut" />
                  </label>
                  <label className="field-label">
                    목표 태그
                    <select value={goalTag} onChange={(event) => setGoalTag(event.target.value)}>
                      <option value="cut">감량</option>
                      <option value="maintain">유지</option>
                      <option value="bulk">벌크업</option>
                    </select>
                  </label>
                </div>
                <div className="composer-actions">
                  <div className="program-chip-list">
                    <span className="mini-panel">📷 사진</span>
                    <span className="mini-panel">🎥 영상</span>
                    <span className="mini-panel">🏋️ 운동 카드</span>
                    <span className="mini-panel">🍱 식단 카드</span>
                  </div>
                  <button className="inline-action primary-dark" type="submit">
                    게시하기
                  </button>
                </div>
              </form>
            ) : (
              <div className="composer-summary">
                <span>{composerType} 형식으로 빠르게 공유할 수 있습니다.</span>
                <span>사진, 영상, 운동 카드, 식단 카드, 해시태그를 붙일 수 있습니다.</span>
              </div>
            )}
          </article>

          <div className="feed-list">
            {filteredPosts.map((post, index) => {
              const postComments = commentsByPost[post.id] || []
              const isSaved = savedPostIds.includes(post.id)
              const isReported = reportedPostIds.includes(post.id)
              const isFollowing = followedAuthors.includes(post.author)

              return (
                <article className="content-card post-card" key={post.id}>
                  <div className="feed-head">
                    <div>
                      <span className="card-kicker">{normalizePostType(post.type, index)}</span>
                      <h2>{post.title}</h2>
                    </div>
                    <button className="inline-action" type="button" onClick={() => toggleFollowAuthor(post.author)}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>

                  <div className="post-meta">
                    <span className="pill-tag">{post.author}</span>
                    <span className="pill-tag">{post.goalTag || post.category}</span>
                  </div>

                  <p>{post.body}</p>

                  <div className="post-attachments">
                    {post.photoCount ? <span className="mini-panel">📷 {post.photoCount}장</span> : null}
                    {post.hasVideo ? <span className="mini-panel">🎥 영상</span> : null}
                    {post.attachWorkoutCard ? <span className="mini-panel">🏋️ 운동 카드</span> : null}
                    {post.attachDietCard ? <span className="mini-panel">🍱 식단 카드</span> : null}
                    {post.hashtags?.length
                      ? post.hashtags.map((tag) => (
                          <span className="pill-tag" key={tag}>
                            {tag}
                          </span>
                        ))
                      : null}
                  </div>

                  <div className="post-actions">
                    <button className="inline-action" type="button" onClick={() => likePost(post.id)}>
                      ❤️ {post.likes}
                    </button>
                    <button
                      className="inline-action"
                      type="button"
                      onClick={() => setOpenCommentPostId((current) => (current === post.id ? null : post.id))}
                    >
                      💬 {postComments.length}
                    </button>
                    <button
                      className={isSaved ? 'inline-action active-soft' : 'inline-action'}
                      type="button"
                      onClick={() => toggleSavePost(post.id)}
                    >
                      🔖
                    </button>
                    <button className="inline-action" type="button" onClick={() => sharePost(post.id)}>
                      ↗
                    </button>
                    <button
                      className={isReported ? 'inline-action active-soft' : 'inline-action'}
                      type="button"
                      onClick={() => reportPost(post.id)}
                    >
                      🚨
                    </button>
                  </div>

                  {openCommentPostId === post.id ? (
                    <div className="comment-stack">
                      <div className="comment-composer">
                        <input
                          value={commentDrafts[post.id] || ''}
                          onChange={(event) =>
                            setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))
                          }
                          placeholder="댓글 입력"
                        />
                        <button
                          className="inline-action"
                          type="button"
                          onClick={() => {
                            addComment(post.id, commentDrafts[post.id] || '')
                            setCommentDrafts((current) => ({ ...current, [post.id]: '' }))
                          }}
                        >
                          등록
                        </button>
                      </div>
                      {postComments.map((comment) => (
                        <div className="comment-item" key={comment.id}>
                          <strong>{comment.author}</strong>
                          <p>{comment.content}</p>
                          <div className="reply-list">
                            {comment.replies.map((reply) => (
                              <div className="reply-item" key={reply.id}>
                                <strong>{reply.author}</strong>
                                <span>{reply.content}</span>
                              </div>
                            ))}
                          </div>
                          <div className="comment-composer compact">
                            <input
                              value={replyDrafts[comment.id] || ''}
                              onChange={(event) =>
                                setReplyDrafts((current) => ({ ...current, [comment.id]: event.target.value }))
                              }
                              placeholder="답글 입력"
                            />
                            <button
                              className="inline-action"
                              type="button"
                              onClick={() => {
                                addReply(post.id, comment.id, replyDrafts[comment.id] || '')
                                setReplyDrafts((current) => ({ ...current, [comment.id]: '' }))
                              }}
                            >
                              답글
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </div>

        <aside className="community-side">
                  <article className="content-card side-card">
            <span className="card-kicker">AI picks</span>
            <div className="mini-panel">{aiCoach.communityTitle}</div>
            <div className="mini-panel">{aiCoach.community}</div>
            <div className="side-stats">
              <span>저장 {savedPostIds.length}</span>
              <span>팔로잉 {followedAuthors.length}</span>
              <span>공유 {shareEvents.length}</span>
            </div>
          </article>

          <article className="content-card side-card">
            <span className="card-kicker">Hot posts</span>
            <div className="program-chip-list">
              {rankingTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={rankingTab === tab ? 'inline-action active-soft' : 'inline-action'}
                  onClick={() => setRankingTab(tab)}
                >
                  {tab === 'daily' ? '일간' : tab === 'weekly' ? '주간' : '월간'}
                </button>
              ))}
            </div>
            <div className="simple-list">
              {rankedPosts.map((post, index) => (
                <div className="simple-row compact" key={post.id}>
                  <strong>#{index + 1} {post.title}</strong>
                  <span>점수 {post.score}</span>
                  <span>❤️ {post.likes} · 💬 {post.commentCount}</span>
                </div>
              ))}
            </div>
            <div className="mini-panel">좋아요 1 · 댓글 3 · 저장 4 · 완주율 2 · 최근성 보정</div>
          </article>

          <article className="content-card side-card">
            <span className="card-kicker">Suggested users</span>
            <div className="bullet-stack">
              {recommendedUsers.map((user) => (
                <div className="side-user" key={user.author}>
                  <div>
                    <strong>{user.author}</strong>
                    <span>{user.description}</span>
                  </div>
                  <button className="inline-action" type="button" onClick={() => toggleFollowAuthor(user.author)}>
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </article>

          <article className="content-card side-card">
            <span className="card-kicker">Rest overlay</span>
            <div className={isResting ? 'shortform-card active' : 'shortform-card'}>
              <strong>{isResting ? `남은 휴식 ${restClock}` : '휴식 타이머 대기 중'}</strong>
              <p>
                {isResting
                  ? `${shortformQueue[0].title} 시청 중, 10초 전 오버레이 알림 제공`
                  : '세트 완료 후 숏폼 모드가 켜집니다.'}
              </p>
            </div>
          </article>
        </aside>
      </div>
    </section>
  )
}

export default CommunityPage
