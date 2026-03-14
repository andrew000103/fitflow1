import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { tx } from '../utils/appLanguage.js'
import { CONNECT_MEDIA_CONFIG, canViewerUploadVideo } from '../config/mediaConfig.js'
import { createLocalMediaUploadDraft } from '../utils/connectUploadApi.js'
import ConnectComposerMediaPicker from '../components/connect/ConnectComposerMediaPicker.jsx'
import ConnectPostMedia from '../components/connect/ConnectPostMedia.jsx'
import ConnectHeroHeader from '../components/connect/ConnectHeroHeader.jsx'
import ConnectComposerEntry from '../components/connect/ConnectComposerEntry.jsx'
import ConnectFeedTabs from '../components/connect/ConnectFeedTabs.jsx'
import ConnectFeedPostCard from '../components/connect/ConnectFeedPostCard.jsx'
import ConnectDiscoverySection from '../components/connect/ConnectDiscoverySection.jsx'

const postTypeLabels = {
  image_post: 'Image',
  video_post: 'Video',
  text_post: 'Journal',
  carousel_post: 'Guide',
  routine_post: 'Routine',
  meal_post: 'Meal',
  ai_editorial_post: 'AI Guide',
}

function getGoalFeedBoost(post, goal) {
  if (!post?.goalTag) {
    return 0
  }

  const normalizedGoal = goal === 'diet' ? 'diet' : goal === 'bulk' ? 'bulk' : 'maintain'
  return post.goalTag === normalizedGoal ? 4 : 0
}

function getRestFriendlyBoost(post, isResting) {
  if (!isResting) {
    return 0
  }

  return post.type === 'ai_editorial_post' || post.type === 'carousel_post' || post.type === 'video_post' ? 6 : 0
}

function getCategoryLabel(language, category) {
  const labels = {
    routine: tx(language, '루틴', 'Routines'),
    meal: tx(language, '식단', 'Meals'),
    tip: tx(language, '팁', 'Tips'),
    athlete: tx(language, '선수', 'Athletes'),
    recovery: tx(language, '회복', 'Recovery'),
  }

  return labels[category] || tx(language, '게시물', 'Post')
}

function getPostCategoryLabel(language, post) {
  return getCategoryLabel(language, post?.category || 'tip')
}

function getAuthorName(post) {
  return post.author || post.authorName || 'FitFlow'
}

function getPostDescription(post) {
  return post.body || post.caption || post.description || ''
}

function getVisualTone(post) {
  if (post.category === 'routine') {
    return 'routine'
  }
  if (post.category === 'meal') {
    return 'meal'
  }
  if (post.category === 'recovery') {
    return 'recovery'
  }
  if (post.category === 'athlete') {
    return 'athlete'
  }
  return post.aiMeta?.isAIGenerated ? 'editorial' : 'motivation'
}

function getPrimaryActionLabel(language, post) {
  if (post.routineData) {
    return tx(language, '루틴 저장', 'Use Routine')
  }
  if (post.mealData) {
    return tx(language, '식단에 추가', 'Add Meal')
  }
  if (post.category === 'athlete') {
    return tx(language, '스타일 보기', 'View Style')
  }
  return tx(language, '자세히 보기', 'Open Story')
}

function getSecondaryMeta(language, post) {
  if (post.routineData) {
    return tx(language, `${post.routineData.exercises.length}개 운동`, `${post.routineData.exercises.length} exercises`)
  }
  if (post.mealData) {
    return `${post.mealData.kcal} kcal`
  }
  return `${post.estimatedReadSeconds || 20}s`
}

function formatPostTime(language, createdAt) {
  if (!createdAt) {
    return tx(language, '방금', 'Just now')
  }

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) {
    return createdAt
  }

  return new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function isEditorialPost(post) {
  return Boolean(post.aiMeta?.isAIGenerated) || getAuthorName(post).includes('Editorial')
}

function CommunityPage() {
  const {
    appLanguage,
    posts,
    likedPostIds,
    savedPostIds,
    reportedPostIds,
    followedAuthors,
    commentsByPost,
    likePost,
    toggleSavePost,
    reportPost,
    toggleFollowAuthor,
    addComment,
    addPost,
    createProgram,
    addMeal,
    goal,
    isResting,
    currentRestElapsed,
    recoveryRecommendation,
    userProfile,
  } = useOutletContext()

  const [feedMode, setFeedMode] = useState('for_you')
  const [activeTopic, setActiveTopic] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [postType, setPostType] = useState('text_post')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [routineExercises, setRoutineExercises] = useState('Bench Press, Lat Pulldown, Overhead Press')
  const [mealKcal, setMealKcal] = useState('480')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadError, setUploadError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')

  const viewerId = 'me'
  const videoUploadEnabled = canViewerUploadVideo(viewerId)
  const restClock = `${String(Math.floor(currentRestElapsed / 60)).padStart(2, '0')}:${String(currentRestElapsed % 60).padStart(2, '0')}`

  const rankedPosts = useMemo(
    () =>
      posts
        .map((post, index) => ({
          ...post,
          rankScore:
            (post.likes || 0) +
            (post.saveCount || 0) * 2 +
            getGoalFeedBoost(post, goal) +
            getRestFriendlyBoost(post, isResting) +
            (isEditorialPost(post) ? 1 : 3) -
            index * 0.01,
        }))
        .sort((left, right) => right.rankScore - left.rankScore),
    [goal, isResting, posts],
  )

  const visiblePosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return rankedPosts
      .filter((post) => {
        if (feedMode === 'following') {
          // TODO: Replace followedAuthors string matching with real follow graph once backend identities are connected.
          return followedAuthors.includes(getAuthorName(post)) || post.authorId === viewerId
        }

        if (feedMode === 'discover') {
          return isEditorialPost(post) || (post.saveCount || 0) >= 20
        }

        return true
      })
      .filter((post) => (activeTopic === 'all' ? true : post.category === activeTopic))
      .filter((post) => {
        if (!query) {
          return true
        }

        return (
          (post.title || '').toLowerCase().includes(query) ||
          getPostDescription(post).toLowerCase().includes(query) ||
          getAuthorName(post).toLowerCase().includes(query)
        )
      })
      .slice(0, CONNECT_MEDIA_CONFIG.CONNECT_FEED_PAGE_SIZE)
  }, [activeTopic, feedMode, followedAuthors, rankedPosts, searchQuery])

  const heroPost = visiblePosts.find((post) => !isEditorialPost(post)) || visiblePosts[0] || null
  const discoveryItems = [
    rankedPosts.find((post) => post.category === 'routine' || post.routineData),
    rankedPosts.find((post) => post.category === 'meal' || post.mealData),
    rankedPosts.find((post) => isEditorialPost(post) || post.category === 'recovery' || post.category === 'tip'),
  ]
    .filter(Boolean)
    .slice(0, 3)
    .map((post) => ({
      id: `discovery-${post.id}`,
      postId: post.id,
      kicker: getPostCategoryLabel(appLanguage, post),
      title: post.title,
      description: getPostDescription(post),
      actionLabel: getPrimaryActionLabel(appLanguage, post),
    }))

  const modalPost = selectedPostId ? posts.find((post) => String(post.id) === String(selectedPostId)) || null : null
  const modalComments = modalPost ? commentsByPost?.[modalPost.id] || [] : []

  function openComposer(nextType = 'text_post') {
    setComposerOpen(true)
    setPostType(nextType)
  }

  function closeComposer() {
    setComposerOpen(false)
    setUploadError('')
    setSelectedFiles([])
  }

  async function handleCreatePost(event) {
    event.preventDefault()
    if (!title.trim() || !body.trim()) {
      return
    }

    const hasSelectedVideo = selectedFiles.some((file) => file.type.startsWith('video/'))
    const hasSelectedImages = selectedFiles.some((file) => file.type.startsWith('image/'))

    if (postType === 'video_post' && !hasSelectedVideo) {
      setUploadError(tx(appLanguage, '영상 포스트에는 실제 영상 파일이 필요합니다.', 'A video post needs an actual video file.'))
      return
    }

    if (hasSelectedVideo && postType !== 'video_post') {
      setUploadError(tx(appLanguage, '영상 파일은 video post에서만 업로드할 수 있습니다.', 'Video files can only be uploaded inside a video post.'))
      return
    }

    const effectivePostType =
      hasSelectedVideo
        ? 'video_post'
        : hasSelectedImages && postType === 'text_post'
          ? 'image_post'
          : postType

    setUploadError('')
    setIsUploading(true)
    setUploadProgress(8)

    try {
      const postId = `post-${Date.now()}`
      let mediaPayload = { media: [], containsVideo: false, imageCount: 0 }

      if (selectedFiles.length > 0) {
        mediaPayload = await createLocalMediaUploadDraft({
          files: selectedFiles,
          postId,
          viewerId,
          onProgress: setUploadProgress,
        })
      } else {
        setUploadProgress(55)
      }

      addPost({
        id: postId,
        title: title.trim(),
        body: body.trim(),
        author: userProfile?.name || 'You',
        authorId: viewerId,
        type: effectivePostType,
        category:
          postType === 'routine_post'
            ? 'routine'
            : postType === 'meal_post'
              ? 'meal'
              : postType === 'video_post'
                ? 'recovery'
                : 'tip',
        goalTag: goal === 'diet' ? 'diet' : goal === 'bulk' ? 'bulk' : 'maintain',
        hashtags: ['#fitflow', '#connect'],
        photoCount: mediaPayload.imageCount,
        hasVideo: mediaPayload.containsVideo,
        media: mediaPayload.media,
        routineData:
          postType === 'routine_post'
            ? {
                title: title.trim(),
                goal: 'Imported from Connect',
                difficulty: 'Beginner',
                exercises: routineExercises
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .map((item) => ({ name: item, sets: 3, reps: '8-12' })),
              }
            : undefined,
        mealData:
          postType === 'meal_post'
            ? {
                title: title.trim(),
                kcal: Number(mealKcal) || 0,
                carbs: Math.round((Number(mealKcal) || 0) * 0.1),
                protein: Math.round((Number(mealKcal) || 0) * 0.08),
                fat: Math.round((Number(mealKcal) || 0) * 0.03),
              }
            : undefined,
        estimatedReadSeconds: effectivePostType === 'video_post' ? 15 : 30,
        createdAt: new Date().toISOString(),
      })

      setUploadProgress(100)
      setTitle('')
      setBody('')
      setRoutineExercises('Bench Press, Lat Pulldown, Overhead Press')
      setMealKcal('480')
      setSelectedFiles([])
      setComposerOpen(false)
    } catch (error) {
      setUploadError(error?.message || tx(appLanguage, '업로드 중 오류가 발생했습니다.', 'Something went wrong while preparing the upload.'))
    } finally {
      setIsUploading(false)
      window.setTimeout(() => setUploadProgress(0), 400)
    }
  }

  function handleUseRoutine(post) {
    if (!post?.routineData) {
      setSelectedPostId(post?.id || null)
      return
    }

    createProgram({
      title: post.routineData.title,
      description: `Imported from Connect: ${post.title}`,
      category: 'General Strength',
      difficulty: post.routineData.difficulty || 'Beginner',
      durationWeeks: 4,
      sessionsPerWeek: 3,
      goal: post.routineData.goal || 'Imported routine',
      visibility: 'private',
      weeks: [
        {
          weekIndex: 1,
          title: 'Week 1',
          days: [
            {
              dayIndex: 1,
              title: post.routineData.title,
              focus: 'Imported from Connect',
              exercises: post.routineData.exercises.map((item) => item.name),
            },
          ],
        },
      ],
      tags: ['connect-import'],
    })
  }

  function handleUseMeal(post) {
    if (!post?.mealData) {
      setSelectedPostId(post?.id || null)
      return
    }

    addMeal({
      name: post.mealData.title,
      calories: post.mealData.kcal,
      protein: post.mealData.protein,
      carbs: post.mealData.carbs,
      fat: post.mealData.fat,
      mealType: 'lunch',
      favorite: false,
    })
  }

  function handlePrimaryAction(post) {
    if (post?.routineData) {
      handleUseRoutine(post)
      return
    }

    if (post?.mealData) {
      handleUseMeal(post)
      return
    }

    if (post?.id) {
      setSelectedPostId(post.id)
    }
  }

  function handlePrimaryActionById(postId) {
    const post = posts.find((item) => String(item.id) === String(postId))
    if (post) {
      handlePrimaryAction(post)
    }
  }

  function handleOpenModal(postId) {
    setSelectedPostId(postId)
    setCommentDraft('')
  }

  function handleSubmitComment(event) {
    event.preventDefault()

    if (!modalPost || !commentDraft.trim()) {
      return
    }

    addComment(modalPost.id, commentDraft)
    setCommentDraft('')
  }

  return (
    <section className="page-section connect-community-page">
      <PageHeader
        title="Connect"
        description={tx(
          appLanguage,
          '사람들이 올린 운동, 식단, 팁을 보고 저장하고 바로 내 흐름에 연결하세요.',
          'Browse what people share, save what helps, and turn it into real fitness actions.',
        )}
      />

      <section className="connect-community-shell">
        <ConnectHeroHeader
          appLanguage={appLanguage}
          isResting={isResting}
          restClock={restClock}
          onOpenComposer={() => openComposer('text_post')}
        />

        <ConnectComposerEntry
          appLanguage={appLanguage}
          userName={userProfile?.name || 'You'}
          videoUploadEnabled={videoUploadEnabled}
          onOpenComposer={openComposer}
        />

        {composerOpen ? (
          <article className="content-card connect-composer-sheet">
            <form className="stack-form" onSubmit={handleCreatePost}>
              <div className="program-chip-list">
                {Object.keys(postTypeLabels)
                  .filter((item) => item !== 'ai_editorial_post' && item !== 'carousel_post')
                  .filter((item) => (item === 'video_post' ? videoUploadEnabled : true))
                  .map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={postType === item ? 'inline-action active-soft' : 'inline-action'}
                      onClick={() => setPostType(item)}
                    >
                      {postTypeLabels[item]}
                    </button>
                  ))}
                <button className="inline-action" type="button" onClick={closeComposer}>
                  {tx(appLanguage, '접기', 'Collapse')}
                </button>
              </div>

              <label className="field-label">
                {tx(appLanguage, '제목', 'Title')}
                <input value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>

              <label className="field-label">
                {tx(appLanguage, '본문', 'Body')}
                <textarea
                  rows={4}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={tx(appLanguage, '오늘 한 운동, 식단, 팁을 가볍게 적어보세요.', 'Write a quick workout, meal, or tip update.')}
                />
              </label>

              {postType === 'routine_post' ? (
                <label className="field-label">
                  {tx(appLanguage, '루틴 운동', 'Routine exercises')}
                  <input
                    value={routineExercises}
                    onChange={(event) => setRoutineExercises(event.target.value)}
                    placeholder="Bench Press, Lat Pulldown, Overhead Press"
                  />
                </label>
              ) : null}

              {postType === 'meal_post' ? (
                <label className="field-label">
                  {tx(appLanguage, '식단 kcal', 'Meal kcal')}
                  <input value={mealKcal} onChange={(event) => setMealKcal(event.target.value)} inputMode="numeric" />
                </label>
              ) : null}

              <ConnectComposerMediaPicker
                appLanguage={appLanguage}
                viewerId={viewerId}
                selectedFiles={selectedFiles}
                onFilesChange={(files) => {
                  setUploadError('')
                  setSelectedFiles(files)
                  if (files.some((file) => file.type.startsWith('video/')) && !videoUploadEnabled) {
                    setUploadError(tx(appLanguage, '이 계정은 현재 영상 업로드가 비활성화되어 있습니다.', 'Video uploads are disabled for this account.'))
                  }
                }}
                uploadError={uploadError}
                uploadProgress={uploadProgress}
                isUploading={isUploading}
              />

              <button className="inline-action primary-dark" type="submit">
                {tx(appLanguage, '게시', 'Publish')}
              </button>
            </form>
          </article>
        ) : null}

        <ConnectFeedTabs
          appLanguage={appLanguage}
          feedMode={feedMode}
          activeTopic={activeTopic}
          searchQuery={searchQuery}
          onFeedModeChange={setFeedMode}
          onTopicChange={setActiveTopic}
          onSearchChange={setSearchQuery}
        />

        {isResting && heroPost ? (
          <article className="connect-rest-ribbon soft">
            <div>
              <h3>{tx(appLanguage, `지금은 ${heroPost.title}처럼 가볍게 볼 수 있는 포스트가 잘 맞아요.`, `A short post like "${heroPost.title}" fits your rest right now.`)}</h3>
            </div>
            <div className="connect-rest-actions">
              <button className="inline-action primary-dark" type="button" onClick={() => handleOpenModal(heroPost.id)}>
                {tx(appLanguage, '지금 보기', 'Open now')}
              </button>
            </div>
          </article>
        ) : null}

        <section className="connect-social-feed">
          {visiblePosts.map((post) => (
            <ConnectFeedPostCard
              key={post.id}
              appLanguage={appLanguage}
              post={post}
              isLiked={likedPostIds.includes(post.id)}
              isSaved={savedPostIds.includes(post.id)}
              isFollowing={followedAuthors.includes(getAuthorName(post))}
              onOpen={() => handleOpenModal(post.id)}
              onPrimaryAction={() => handlePrimaryAction(post)}
              onSave={() => toggleSavePost(post.id)}
              onLike={() => likePost(post.id)}
              onComment={() => handleOpenModal(post.id)}
              onToggleFollow={() => toggleFollowAuthor(getAuthorName(post))}
              authorName={getAuthorName(post)}
              timeLabel={formatPostTime(appLanguage, post.createdAt)}
              categoryLabel={getPostCategoryLabel(appLanguage, post)}
              primaryActionLabel={getPrimaryActionLabel(appLanguage, post)}
              secondaryMeta={getSecondaryMeta(appLanguage, post)}
            />
          ))}
        </section>

        {visiblePosts.length === 0 ? (
          <article className="connect-empty-state">
            <h2>{tx(appLanguage, '아직 비어 있어요. 첫 공유를 남겨보세요.', 'It feels empty here. Share the first post.')}</h2>
            <p>{tx(appLanguage, '간단한 운동 후기, 식단 사진, 짧은 팁만으로도 충분합니다.', 'A short workout update, meal photo, or quick tip is enough to start.')}</p>
          </article>
        ) : null}

        <ConnectDiscoverySection
          appLanguage={appLanguage}
          items={discoveryItems}
          onOpen={handleOpenModal}
          onPrimaryAction={handlePrimaryActionById}
        />
      </section>

      {modalPost ? (
        <div className="connect-modal-backdrop" role="presentation" onClick={() => setSelectedPostId(null)}>
          <article className="connect-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="connect-modal-close" onClick={() => setSelectedPostId(null)}>
              {tx(appLanguage, '닫기', 'Close')}
            </button>

            <div className={`connect-modal-visual tone-${getVisualTone(modalPost)}`}>
              <div className="connect-modal-badges">
                <span className="connect-card-tag">{getPostCategoryLabel(appLanguage, modalPost)}</span>
                <span className="connect-card-tag">{getAuthorName(modalPost)}</span>
                {modalPost.aiMeta?.isAIGenerated ? <span className="connect-card-tag accent">{modalPost.aiMeta.label}</span> : null}
              </div>
            </div>

            <div className="connect-modal-body">
              {modalPost.media?.length ? <ConnectPostMedia appLanguage={appLanguage} media={modalPost.media} mode="detail" /> : null}

              <div className="connect-modal-heading">
                <h2>{modalPost.title}</h2>
                <div className="connect-card-footnote">
                  <span>{getAuthorName(modalPost)}</span>
                  <span>{formatPostTime(appLanguage, modalPost.createdAt)}</span>
                  <span>{postTypeLabels[modalPost.type] || 'Post'}</span>
                  <span>{modalPost.comments || 0} {tx(appLanguage, '댓글', 'comments')}</span>
                </div>
                <p>{getPostDescription(modalPost)}</p>
              </div>

              {modalPost.routineData ? (
                <div className="connect-modal-panel">
                  <strong>{tx(appLanguage, 'Routine structure', 'Routine structure')}</strong>
                  <p>{modalPost.routineData.exercises.map((item) => `${item.name} · ${item.sets} ${tx(appLanguage, '세트', 'sets')}`).join(' · ')}</p>
                </div>
              ) : null}

              {modalPost.mealData ? (
                <div className="connect-modal-panel">
                  <strong>{tx(appLanguage, 'Meal summary', 'Meal summary')}</strong>
                  <p>{modalPost.mealData.kcal} kcal · C {modalPost.mealData.carbs} / P {modalPost.mealData.protein} / F {modalPost.mealData.fat}</p>
                </div>
              ) : null}

              {modalPost.carouselSlides?.length ? (
                <div className="connect-modal-panel">
                  <strong>{tx(appLanguage, 'Card slides', 'Card slides')}</strong>
                  <div className="simple-list">
                    {modalPost.carouselSlides.map((slide, index) => (
                      <div className="simple-row compact" key={`${modalPost.id}-slide-${index}`}>
                        <strong>{slide.title || tx(appLanguage, `슬라이드 ${index + 1}`, `Slide ${index + 1}`)}</strong>
                        <span>{slide.body}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="connect-modal-actions">
                <button className="inline-action primary-dark" type="button" onClick={() => handlePrimaryAction(modalPost)}>
                  {getPrimaryActionLabel(appLanguage, modalPost)}
                </button>
                <button
                  className={savedPostIds.includes(modalPost.id) ? 'inline-action active-soft' : 'inline-action'}
                  type="button"
                  onClick={() => toggleSavePost(modalPost.id)}
                >
                  {savedPostIds.includes(modalPost.id) ? tx(appLanguage, '저장됨', 'Saved') : tx(appLanguage, '저장', 'Save')}
                </button>
                <button
                  className={likedPostIds.includes(modalPost.id) ? 'inline-action active-soft' : 'inline-action'}
                  type="button"
                  onClick={() => likePost(modalPost.id)}
                >
                  {tx(appLanguage, '좋아요', 'Like')} {modalPost.likes || 0}
                </button>
                <button
                  className={reportedPostIds.includes(modalPost.id) ? 'inline-action active-soft' : 'inline-action'}
                  type="button"
                  onClick={() => reportPost(modalPost.id)}
                >
                  {tx(appLanguage, '신고', 'Report')}
                </button>
              </div>

              <div className="connect-modal-caption">
                {modalPost.aiMeta?.isAIGenerated
                  ? tx(appLanguage, '이 콘텐츠는 AI 생성 콘텐츠이며 라벨링되어 있습니다.', 'This content is AI generated and clearly labeled.')
                  : tx(appLanguage, '사용자 또는 에디토리얼 콘텐츠입니다.', 'This is user or editorial content.')}
              </div>

              <div className="connect-modal-panel">
                <div className="connect-modal-comments-head">
                  <strong>{tx(appLanguage, '짧게 남기고 저장해둘 수 있는 메모', 'Quick notes from the community')}</strong>
                </div>

                <form className="connect-comment-form" onSubmit={handleSubmitComment}>
                  <input
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder={tx(appLanguage, '이 게시물에 대한 한 줄 의견을 남겨보세요', 'Leave a quick note on this post')}
                  />
                  <button className="inline-action primary-dark" type="submit">
                    {tx(appLanguage, '댓글 남기기', 'Comment')}
                  </button>
                </form>

                {modalComments.length > 0 ? (
                  <div className="connect-comment-list">
                    {modalComments.map((comment) => (
                      <div className="connect-comment-item" key={comment.id}>
                        <div className="connect-comment-meta">
                          <strong>{comment.author}</strong>
                          <span>{formatPostTime(appLanguage, comment.createdAt)}</span>
                        </div>
                        <p>{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mini-panel">
                    {tx(appLanguage, '아직 댓글이 없습니다. 첫 반응을 남겨보세요.', 'No comments yet. Be the first to respond.')}
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default CommunityPage
