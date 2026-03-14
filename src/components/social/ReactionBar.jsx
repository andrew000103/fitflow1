function ReactionBar({
  reactionCount = 0,
  reactionCounts = {},
  commentCount = 0,
  viewerReactionType = '',
  reactionDisabled = false,
  onReact,
  onComment,
}) {
  const reactionOptions = [
    { key: 'cheer', label: '응원' },
    { key: 'fire', label: '멋져요' },
    { key: 'respect', label: '존경' },
  ]

  return (
    <div className="social-reaction-bar">
      {reactionOptions.map((reaction) => (
        <button
          key={reaction.key}
          type="button"
          className={viewerReactionType === reaction.key ? 'social-reaction-pill active' : 'social-reaction-pill'}
          onClick={() => onReact?.(reaction.key)}
          disabled={reactionDisabled}
        >
          {reaction.label} {reactionCounts[reaction.key] || 0}
        </button>
      ))}
      <button type="button" className="social-reaction-pill" onClick={onComment}>
        댓글 {commentCount}
      </button>
    </div>
  )
}

export default ReactionBar
