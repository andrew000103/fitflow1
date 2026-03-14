const FEED_TABS = ['recommended', 'crew', 'challenge', 'popular']

const FEED_LABELS = {
  recommended: '추천',
  crew: '내 크루',
  challenge: '챌린지',
  popular: '인기',
}

function FeedTabs({ activeTab, onChange }) {
  return (
    <article className="social-feed-tabs">
      {FEED_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          className={activeTab === tab ? 'social-feed-tab active' : 'social-feed-tab'}
          onClick={() => onChange(tab)}
        >
          {FEED_LABELS[tab]}
        </button>
      ))}
    </article>
  )
}

export default FeedTabs
