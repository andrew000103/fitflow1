import { tx } from '../../utils/appLanguage.js'

function ConnectHeroHeader({ appLanguage, isResting, restClock, onOpenComposer }) {
  return (
    <article className="connect-social-hero">
      <div className="connect-social-hero-copy">
        <h2>{tx(appLanguage, '오늘 사람들은 어떻게 운동하고, 먹고, 공유하고 있을까요?', 'See what people are training, eating, and sharing today.')}</h2>
        <p>
          {tx(
            appLanguage,
            '운동 기록, 식단, 짧은 팁, 진행 상황을 가볍게 올리고 저장해보세요.',
            'Share workouts, meals, quick tips, and progress in a way that feels easy to join.',
          )}
        </p>

        <div className="connect-social-hero-pills">
          <span className="connect-social-pill">{tx(appLanguage, '루틴 저장 가능', 'Saveable routines')}</span>
          <span className="connect-social-pill">{tx(appLanguage, '식단 바로 추가', 'Meals you can add')}</span>
          <span className="connect-social-pill">{tx(appLanguage, '짧은 팁과 클립', 'Short clips and tips')}</span>
          {isResting ? <span className="connect-social-pill accent">{tx(appLanguage, `휴식 ${restClock}`, `Rest ${restClock}`)}</span> : null}
        </div>
      </div>

      <div className="connect-social-hero-side">
        <div className="connect-social-note">
          <strong>{tx(appLanguage, '오늘의 흐름', 'Today on Connect')}</strong>
          <span>{tx(appLanguage, '사람들이 공유한 루틴, 식단, 오운완, 회복 아이디어를 한 번에 봅니다.', 'Browse routines, meals, gym moments, and recovery ideas in one scroll.')}</span>
        </div>
        <button className="inline-action primary-dark" type="button" onClick={onOpenComposer}>
          {tx(appLanguage, '나도 공유하기', 'Share something')}
        </button>
      </div>
    </article>
  )
}

export default ConnectHeroHeader
