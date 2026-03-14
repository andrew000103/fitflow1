import { tx } from '../../utils/appLanguage.js'

const quickTypes = ['image_post', 'video_post', 'routine_post', 'meal_post', 'text_post']

function getQuickTypeLabel(appLanguage, type) {
  const labels = {
    image_post: tx(appLanguage, '사진', 'Photo'),
    video_post: tx(appLanguage, '영상', 'Video'),
    routine_post: tx(appLanguage, '루틴', 'Routine'),
    meal_post: tx(appLanguage, '식단', 'Meal'),
    text_post: tx(appLanguage, '팁', 'Tip'),
  }

  return labels[type] || type
}

function ConnectComposerEntry({ appLanguage, userName, videoUploadEnabled, onOpenComposer }) {
  return (
    <article className="connect-composer-entry">
      <button className="connect-composer-entry-main" type="button" onClick={() => onOpenComposer('text_post')}>
        <span className="connect-composer-avatar">{(userName || 'Y').slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{tx(appLanguage, '무엇을 공유할까요?', 'What do you want to share?')}</strong>
          <span>
            {tx(
              appLanguage,
              '오늘 한 운동, 식단, 짧은 팁, 진행 상황을 가볍게 올려보세요.',
              'Share today’s workout, meal, quick tip, or a small progress update.',
            )}
          </span>
        </div>
      </button>

      <div className="connect-composer-quick-actions">
        {quickTypes
          .filter((type) => (type === 'video_post' ? videoUploadEnabled : true))
          .map((type) => (
            <button key={type} className="connect-composer-quick-chip" type="button" onClick={() => onOpenComposer(type)}>
              {getQuickTypeLabel(appLanguage, type)}
            </button>
          ))}
      </div>
    </article>
  )
}

export default ConnectComposerEntry
