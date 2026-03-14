import { useEffect, useState } from 'react'
import AppIcon from '../AppIcon.jsx'
import { generateAppImage } from '../../utils/imageStudioApi.js'

const IMAGE_STUDIO_STORAGE_KEY = 'fitflow-image-studio-history'
const IMAGE_CATEGORIES = [
  { key: 'workout', label: 'Workout' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'challenge', label: 'Challenge' },
  { key: 'community', label: 'Connect' },
]

function loadRecentImages() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(IMAGE_STUDIO_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecentImages(images) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(IMAGE_STUDIO_STORAGE_KEY, JSON.stringify(images.slice(0, 4)))
}

function createHistoryItem(result, prompt, category) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    prompt,
    category,
    imageUrl: result.imageUrl,
    revisedPrompt: result.revisedPrompt,
    createdAt: new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

function ImageStudioCard() {
  const [prompt, setPrompt] = useState('Minimal poster for today’s lower body challenge')
  const [category, setCategory] = useState('challenge')
  const [recentImages, setRecentImages] = useState(() => loadRecentImages())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastRequest, setLastRequest] = useState(null)

  useEffect(() => {
    saveRecentImages(recentImages)
  }, [recentImages])

  async function handleGenerate(nextPrompt = prompt, nextCategory = category) {
    if (!nextPrompt.trim()) {
      setError('프롬프트를 입력해 주세요.')
      return
    }

    setIsLoading(true)
    setError('')
    setLastRequest({ prompt: nextPrompt, category: nextCategory })

    try {
      const result = await generateAppImage({
        prompt: nextPrompt,
        category: nextCategory,
      })
      setRecentImages((current) => [createHistoryItem(result, nextPrompt, nextCategory), ...current].slice(0, 4))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '이미지 생성에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <article className="content-card side-card">
      <div className="feed-head">
        <div>
          <span className="card-kicker">Image studio</span>
          <h2>OpenAI image generation</h2>
        </div>
        <span className="pill-tag accent">Beta</span>
      </div>

      <div className="stack-form">
        <label className="field-label">
          Prompt
          <textarea
            rows="3"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="운동, 식단, 챌린지, 커뮤니티용 이미지 설명을 입력합니다."
          />
        </label>

        <label className="field-label">
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {IMAGE_CATEGORIES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="program-chip-list">
        <button
          className="inline-action primary-dark"
          type="button"
          disabled={isLoading}
          onClick={() => handleGenerate()}
        >
          {isLoading ? 'Generating...' : 'Generate image'}
        </button>
        {lastRequest ? (
          <button
            className="inline-action"
            type="button"
            disabled={isLoading}
            onClick={() => handleGenerate(lastRequest.prompt, lastRequest.category)}
          >
            Regenerate
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="image-error-card">
          <strong>{error}</strong>
          <button
            className="inline-action"
            type="button"
            disabled={isLoading || !lastRequest}
            onClick={() => {
              if (lastRequest) {
                handleGenerate(lastRequest.prompt, lastRequest.category)
              }
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="image-result-grid">
        {recentImages.length > 0 ? (
          recentImages.map((item) => (
            <div className="image-result-card" key={item.id}>
              <img src={item.imageUrl} alt={item.prompt} className="image-result-preview" />
              <div className="image-result-copy">
                <strong>{item.prompt}</strong>
                <span>{item.category} · {item.createdAt}</span>
                {item.revisedPrompt ? <small>{item.revisedPrompt}</small> : null}
              </div>
              <button
                className="inline-action"
                type="button"
                onClick={() => handleGenerate(item.prompt, item.category)}
              >
                <AppIcon name="image" size="sm" /> Regenerate
              </button>
            </div>
          ))
        ) : (
          <div className="mini-panel">아직 생성된 이미지가 없습니다. 첫 이미지를 생성해 보세요.</div>
        )}
      </div>
    </article>
  )
}

export default ImageStudioCard
