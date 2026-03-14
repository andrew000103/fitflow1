import { useState } from 'react'
import {
  createSampleGeneralPost,
  createSamplePrPost,
  createSampleWorkoutSummaryPost,
  createStreakMilestoneEvent,
  createWorkoutCompletedEvent,
} from './socialDevSeedApi.ts'

const DEV_ACTIONS = [
  { key: 'general', label: '일반 게시물', action: createSampleGeneralPost },
  { key: 'workout_summary', label: '운동 요약 게시물', action: createSampleWorkoutSummaryPost },
  { key: 'pr_post', label: 'PR 게시물', action: createSamplePrPost },
  { key: 'workout_event', label: '운동 완료 이벤트', action: createWorkoutCompletedEvent },
  { key: 'streak_event', label: '연속 기록 이벤트', action: createStreakMilestoneEvent },
]

function SocialDevSeedPanel({ userId, onCreated }) {
  const [runningKey, setRunningKey] = useState('')
  const [message, setMessage] = useState('')

  async function handleCreate(actionItem) {
    if (!userId || runningKey) {
      return
    }

    setRunningKey(actionItem.key)
    setMessage('')

    try {
      await actionItem.action(userId)
      setMessage(`${actionItem.label} 샘플을 만들었어요.`)
      await onCreated?.()
    } catch (error) {
      setMessage(error.message || '샘플 데이터 생성에 실패했어요.')
    } finally {
      setRunningKey('')
    }
  }

  return (
    <div className="social-dev-seed-panel">
      <div className="social-dev-seed-actions">
        {DEV_ACTIONS.map((actionItem) => (
          <button
            key={actionItem.key}
            type="button"
            className="inline-action"
            onClick={() => handleCreate(actionItem)}
            disabled={!userId || Boolean(runningKey)}
          >
            {runningKey === actionItem.key ? '생성 중...' : actionItem.label}
          </button>
        ))}
      </div>
      {message ? <div className="social-feed-dev-note">{message}</div> : null}
    </div>
  )
}

export default SocialDevSeedPanel
