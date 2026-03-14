import ConnectPostMedia from './ConnectPostMedia.jsx'
import { tx } from '../../utils/appLanguage.js'

function ConnectFeedPostCard({
  appLanguage,
  post,
  isLiked,
  isSaved,
  isFollowing,
  onOpen,
  onPrimaryAction,
  onSave,
  onLike,
  onComment,
  onToggleFollow,
  authorName,
  timeLabel,
  categoryLabel,
  primaryActionLabel,
  secondaryMeta,
}) {
  const avatarLabel = (authorName || 'F').slice(0, 1).toUpperCase()
  const isAiSource = authorName.includes('AI') || authorName.includes('Editorial')

  return (
    <article className="connect-feed-card">
      <div className="connect-feed-card-head">
        <button className="connect-feed-author" type="button" onClick={onOpen}>
          <span className="connect-feed-avatar">{avatarLabel}</span>
          <span className="connect-feed-author-copy">
            <strong>{authorName}</strong>
            <span>
              {timeLabel} · {categoryLabel}
            </span>
          </span>
        </button>

        {!isAiSource ? (
          <button className={isFollowing ? 'inline-action active-soft' : 'inline-action'} type="button" onClick={onToggleFollow}>
            {isFollowing ? tx(appLanguage, '팔로잉', 'Following') : tx(appLanguage, '팔로우', 'Follow')}
          </button>
        ) : (
          <span className="connect-feed-source-badge">{tx(appLanguage, '가이드', 'Guide')}</span>
        )}
      </div>

      <button className="connect-feed-card-copy" type="button" onClick={onOpen}>
        <strong>{post.title}</strong>
        <p>{post.body || post.caption || post.description || ''}</p>
      </button>

      {post.media?.length ? <ConnectPostMedia appLanguage={appLanguage} media={post.media} mode="feed" /> : null}

      {post.routineData ? (
        <button className="connect-attached-card routine" type="button" onClick={onPrimaryAction}>
          <strong>{post.routineData.title}</strong>
          <span>{secondaryMeta}</span>
        </button>
      ) : null}

      {post.mealData ? (
        <button className="connect-attached-card meal" type="button" onClick={onPrimaryAction}>
          <strong>{post.mealData.title}</strong>
          <span>{secondaryMeta}</span>
        </button>
      ) : null}

      <div className="connect-feed-action-row">
        <button className={isLiked ? 'connect-action-pill active' : 'connect-action-pill'} type="button" onClick={onLike}>
          {tx(appLanguage, '좋아요', 'Like')} {post.likes || 0}
        </button>
        <button className="connect-action-pill" type="button" onClick={onComment}>
          {tx(appLanguage, '댓글', 'Comment')} {post.comments || 0}
        </button>
        <button className={isSaved ? 'connect-action-pill active' : 'connect-action-pill'} type="button" onClick={onSave}>
          {isSaved ? tx(appLanguage, '저장됨', 'Saved') : tx(appLanguage, '저장', 'Save')}
        </button>
        <button className="connect-action-pill primary" type="button" onClick={onPrimaryAction}>
          {primaryActionLabel}
        </button>
      </div>
    </article>
  )
}

export default ConnectFeedPostCard
