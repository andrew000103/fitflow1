import { useEffect, useMemo, useState } from 'react'
import CommentList from './CommentList.jsx'
import ReactionBar from './ReactionBar.jsx'
import { resolveHydratedProfileName } from '../../utils/profileHydration.js'

const EDITABLE_POST_TYPES = new Set(['general', 'workout_summary', 'pr', 'routine', 'meal', 'update'])

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

function formatRelativeTime(value) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()

  if (Number.isNaN(date.getTime()) || diffMs < 0) {
    return ''
  }

  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) return '방금 전'
  if (diffMinutes < 60) return `${diffMinutes}분 전`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}시간 전`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}일 전`

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

function isMeaningfullyUpdated(createdAt, updatedAt) {
  if (!createdAt || !updatedAt) {
    return false
  }

  const createdMs = new Date(createdAt).getTime()
  const updatedMs = new Date(updatedAt).getTime()

  if (Number.isNaN(createdMs) || Number.isNaN(updatedMs)) {
    return false
  }

  return updatedMs - createdMs >= 60000
}

function PostCard({ item, currentUserId, profileMap = {}, onUpdate, onDelete }) {
  const targetUserId = item.userId || item.authorId || item.actorUserId || item.user_id
  const isMine = currentUserId && targetUserId === currentUserId
  const isEditable = EDITABLE_POST_TYPES.has(item.postType || 'general')
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reacting, setReacting] = useState(false)
  const [commenting, setCommenting] = useState(false)
  const [showCommentEditor, setShowCommentEditor] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState(item.title || '')
  const [body, setBody] = useState(item.body || '')
  const [commentBody, setCommentBody] = useState('')

  useEffect(() => {
    setTitle(item.title || '')
    setBody(item.body || '')
  }, [item.body, item.title])

  const timeLabel = useMemo(() => formatRelativeTime(item.createdAt), [item.createdAt])
  const updated = useMemo(() => isMeaningfullyUpdated(item.createdAt, item.updatedAt), [item.createdAt, item.updatedAt])
  const actorName = useMemo(() => {
    const resolved = resolveHydratedProfileName(profileMap, targetUserId)
    if (!targetUserId || resolved === '사용자' || resolved === 'User') {
      return item.author || item.authorName || resolved
    }
    return resolved
  }, [profileMap, targetUserId, item.author, item.authorName])

  async function handleSave() {
    const nextTitle = title.trim()
    const nextBody = body.trim()

    if (!nextTitle || !nextBody) {
      setError('제목과 내용을 모두 입력해 주세요.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await onUpdate?.(item, {
        title: nextTitle,
        body: nextBody,
      })
      setIsEditing(false)
      setShowActions(false)
    } catch (saveError) {
      setError(saveError.message || '게시물 수정 중 오류가 발생했어요.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    setError('')

    try {
      await onDelete?.(item)
    } catch (deleteError) {
      setError(deleteError.message || '게시물 삭제 중 오류가 발생했어요.')
      setSaving(false)
      return
    }
  }

  async function handleReact(reactionType) {
    if (!onUpdate) {
      return
    }

    setReacting(true)
    setError('')

    try {
      await onUpdate(item, { mode: 'react', reactionType })
    } catch (reactionError) {
      setError(reactionError.message || '반응 처리에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setReacting(false)
    }
  }

  async function handleCommentSubmit() {
    if (!onUpdate) {
      return
    }

    setCommenting(true)
    setError('')

    try {
      await onUpdate(item, { mode: 'comment', body: commentBody })
      setCommentBody('')
      setShowCommentEditor(false)
    } catch (commentError) {
      setError(commentError.message || '댓글 등록에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setCommenting(false)
    }
  }

  return (
    <article className="social-feed-card post">
      <div className="social-feed-card-head">
        <div>
          <span className="social-feed-badge">{getPostBadge(item)}</span>
          <strong>{actorName}</strong>
          <div className="social-post-meta">
            <span className="social-feed-time">{timeLabel}</span>
            {updated ? <span className="social-post-edited">수정됨</span> : null}
          </div>
        </div>

        {isMine ? (
          <div className="social-post-actions-wrap">
            <button
              type="button"
              className="social-post-action-trigger"
              onClick={() => {
                setShowActions((current) => !current)
                setIsDeleting(false)
              }}
              aria-label="게시물 작업"
            >
              ⋯
            </button>
            {showActions ? (
              <div className="social-post-action-menu">
                {isEditable ? (
                  <button
                    type="button"
                    className="social-post-action-button"
                    onClick={() => {
                      setIsEditing(true)
                      setIsDeleting(false)
                    }}
                  >
                    수정
                  </button>
                ) : null}
                <button
                  type="button"
                  className="social-post-action-button danger"
                  onClick={() => {
                    setIsDeleting(true)
                    setIsEditing(false)
                  }}
                >
                  삭제
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="social-post-editor">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="제목"
            disabled={saving}
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="내용"
            rows={4}
            disabled={saving}
          />
          <div className="social-post-editor-actions">
            <button type="button" className="inline-action" onClick={() => setIsEditing(false)} disabled={saving}>
              취소
            </button>
            <button type="button" className="inline-action primary-dark" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      ) : (
        <div className="social-feed-copy">
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </div>
      )}

      {isDeleting ? (
        <>
          <button
            type="button"
            className="confirm-backdrop"
            aria-label="게시물 삭제 확인 닫기"
            onClick={() => !saving && setIsDeleting(false)}
          />
          <section className="content-card confirm-modal" aria-label="게시물 삭제 확인">
            <div className="confirm-copy">
              <h2>게시물을 삭제할까요?</h2>
              <p>삭제 후에는 되돌릴 수 없어요.</p>
            </div>
            <div className="confirm-actions">
              <button type="button" className="inline-action" onClick={() => setIsDeleting(false)} disabled={saving}>
                취소
              </button>
              <button type="button" className="inline-action social-post-delete-button" onClick={handleDelete} disabled={saving}>
                {saving ? '삭제 중...' : '확인'}
              </button>
            </div>
          </section>
        </>
      ) : null}

      {error ? <div className="social-post-inline-error">{error}</div> : null}

      <ReactionBar
        reactionCount={item.reactionCount}
        reactionCounts={item.reactionCounts}
        commentCount={item.commentCount}
        viewerReactionType={item.viewerReactionType}
        reactionDisabled={reacting}
        onReact={handleReact}
        onComment={() => setShowCommentEditor((current) => !current)}
      />

      {showCommentEditor ? (
        <div className="social-post-comment-editor">
          <label className="social-post-comment-label">댓글 쓰기</label>
          <textarea
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            placeholder="댓글을 입력하세요"
            rows={3}
            disabled={commenting}
          />
          <div className="social-post-editor-actions">
            <button type="button" className="inline-action" onClick={() => setShowCommentEditor(false)} disabled={commenting}>
              취소
            </button>
            <button type="button" className="inline-action primary-dark" onClick={handleCommentSubmit} disabled={commenting}>
              {commenting ? '등록 중...' : '등록'}
            </button>
          </div>
        </div>
      ) : null}

      <CommentList comments={item.comments} profileMap={profileMap} />
    </article>
  )
}

export default PostCard
