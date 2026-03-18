import { Link, useOutletContext } from 'react-router-dom'
import AppIcon from './AppIcon.jsx'
import PageHeader from './PageHeader.jsx'
import { tx } from '../utils/appLanguage.js'

function ServiceUpdateNotice({ serviceKey = 'connect' }) {
  const { appLanguage } = useOutletContext()
  const isConnect = serviceKey === 'connect'

  const eyebrow = isConnect ? 'Connect' : 'Shop'
  const title = tx(
    appLanguage,
    isConnect ? '커넥트는 추후 업데이트 예정입니다' : '스토어는 추후 업데이트 예정입니다',
    isConnect ? 'Connect will be updated later' : 'Shop will be updated later',
  )
  const description = tx(
    appLanguage,
    isConnect
      ? '현재는 운동과 식단 경험 안정화에 먼저 집중하고 있습니다. 커넥트 서비스는 정리 후 다시 제공합니다.'
      : '현재는 운동과 식단 경험 안정화에 먼저 집중하고 있습니다. 스토어 서비스는 정리 후 다시 제공합니다.',
    isConnect
      ? 'We are focusing on stabilizing workout and nutrition first. Connect will return after cleanup.'
      : 'We are focusing on stabilizing workout and nutrition first. Shop will return after cleanup.',
  )
  const focusTitle = tx(appLanguage, '지금은 이 두 흐름에 집중해 주세요', 'Focus on these two flows for now')
  const cards = [
    {
      to: '/train',
      icon: 'train',
      title: tx(appLanguage, '운동', 'Workout'),
      body: tx(appLanguage, '오늘 운동 시작, 기록, 프로그램 관리에 바로 들어갑니다.', 'Go straight into today workout, logging, and program management.'),
      cta: tx(appLanguage, '운동 열기', 'Open workout'),
    },
    {
      to: '/nutrition',
      icon: 'nutrition',
      title: tx(appLanguage, '식단', 'Nutrition'),
      body: tx(appLanguage, '식사 기록과 음식 추가, 하루 섭취 흐름을 빠르게 관리합니다.', 'Manage meal logging, food entries, and daily intake quickly.'),
      cta: tx(appLanguage, '식단 열기', 'Open nutrition'),
    },
  ]

  return (
    <section className="page-section">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <article className="content-card">
        <div className="feed-head">
          <div>
            <span className="card-kicker">{tx(appLanguage, '업데이트 안내', 'Update notice')}</span>
            <h2>{tx(appLanguage, '서비스를 잠시 정리 중입니다', 'This service is temporarily being reorganized')}</h2>
          </div>
          <span className="mini-panel">{tx(appLanguage, '추후 업데이트 예정', 'Coming later')}</span>
        </div>
        <div className="bullet-stack">
          <div className="mini-panel">
            {tx(
              appLanguage,
              '오류가 많았던 기능은 잠시 닫아 두고 핵심 흐름부터 안정화합니다.',
              'We are pausing error-prone areas and stabilizing the core flow first.',
            )}
          </div>
          <div className="mini-panel">
            {tx(
              appLanguage,
              '운동과 식단 화면은 그대로 사용 가능하며, 이후 정리된 버전으로 다시 연결할 예정입니다.',
              'Workout and nutrition remain available, and this service will be reconnected in a cleaner version later.',
            )}
          </div>
        </div>
      </article>

      <section className="train-home-secondary">
        <div className="feed-head">
          <div>
            <span className="card-kicker">{tx(appLanguage, '현재 권장 흐름', 'Recommended now')}</span>
            <h2>{focusTitle}</h2>
          </div>
        </div>
        <div className="train-home-secondary-grid">
          {cards.map((card) => (
            <Link className="train-action-card" to={card.to} key={card.to}>
              <span className="train-action-icon" aria-hidden="true">
                <AppIcon name={card.icon} />
              </span>
              <div className="train-action-copy">
                <strong>{card.title}</strong>
                <span>{card.body}</span>
              </div>
              <span className="train-action-cta">{card.cta}</span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  )
}

export default ServiceUpdateNotice
