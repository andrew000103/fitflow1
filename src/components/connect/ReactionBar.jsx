function ReactionBar({ reactionCount = 0, commentCount = 0, viewerReacted = false }) {
  return (
    <div className="social-reaction-bar">
      <span className={viewerReacted ? 'social-reaction-pill active' : 'social-reaction-pill'}>
        반응 {reactionCount}
      </span>
      <span className="social-reaction-pill">댓글 {commentCount}</span>
    </div>
  )
}

export default ReactionBar
