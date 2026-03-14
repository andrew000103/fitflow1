import CommentList from './CommentList.jsx'
import ReactionBar from './ReactionBar.jsx'

function getPostBadge(item) {
  if (item.challenge) {
    return '챌린지'
  }

  if (item.postType?.includes('routine')) {
    return '운동 기록'
  }

  if (item.postType?.includes('meal')) {
    return '식단'
  }

  return '업데이트'
}

function PostCard({ item }) {
  return (
    <article className="social-feed-card post">
      <div className="social-feed-card-head">
        <div>
          <span className="social-feed-badge">{getPostBadge(item)}</span>
          <strong>{item.actorName}</strong>
        </div>
        <span className="social-feed-time">{new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(new Date(item.createdAt))}</span>
      </div>

      <div className="social-feed-copy">
        <h3>{item.title}</h3>
        <p>{item.body}</p>
      </div>

      <ReactionBar
        reactionCount={item.reactionCount}
        commentCount={item.commentCount}
        viewerReacted={item.viewerReacted}
      />

      <CommentList comments={item.comments} />
    </article>
  )
}

export default PostCard
