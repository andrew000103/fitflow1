import { tx } from '../../utils/appLanguage.js'

function ConnectDiscoverySection({ appLanguage, items, onOpen, onPrimaryAction }) {
  if (!items.length) {
    return null
  }

  return (
    <section className="connect-discovery-section">
      <div className="feed-head">
        <h2>{tx(appLanguage, 'Useful picks to save', 'Useful picks to save')}</h2>
      </div>

      <div className="connect-discovery-row">
        {items.map((item) => (
          <article className="connect-discovery-mini-card" key={item.id}>
            <div>
              <span className="connect-copy-tag">{item.kicker}</span>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
            <div className="connect-discovery-mini-actions">
              <button className="inline-action" type="button" onClick={() => onOpen(item.postId)}>
                {tx(appLanguage, '보기', 'Open')}
              </button>
              <button className="inline-action primary-dark" type="button" onClick={() => onPrimaryAction(item.postId)}>
                {item.actionLabel}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ConnectDiscoverySection
