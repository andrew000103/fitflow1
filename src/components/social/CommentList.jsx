function formatCommentDate(createdAt) {
  if (!createdAt) {
    return ''
  }

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

function CommentList({ comments = [] }) {
  if (!comments.length) {
    return null
  }

  return (
    <div className="social-comment-list">
      {comments.map((comment) => (
        <div key={comment.id} className="social-comment-item">
          <div className="social-comment-meta">
            <strong>{comment.authorName}</strong>
            <span>{formatCommentDate(comment.createdAt)}</span>
          </div>
          <p>{comment.body}</p>
        </div>
      ))}
    </div>
  )
}

export default CommentList
