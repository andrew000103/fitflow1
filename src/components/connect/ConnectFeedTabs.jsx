import { tx } from '../../utils/appLanguage.js'

const feedModes = ['for_you', 'following', 'discover']
const topicFilters = ['all', 'routine', 'meal', 'tip', 'athlete', 'recovery']

function getFeedModeLabel(appLanguage, mode) {
  const labels = {
    for_you: tx(appLanguage, 'For You', 'For You'),
    following: tx(appLanguage, 'Following', 'Following'),
    discover: tx(appLanguage, 'Discover', 'Discover'),
  }

  return labels[mode] || mode
}

function getTopicLabel(appLanguage, topic) {
  const labels = {
    all: tx(appLanguage, '전체', 'All'),
    routine: tx(appLanguage, '루틴', 'Routines'),
    meal: tx(appLanguage, '식단', 'Meals'),
    tip: tx(appLanguage, '팁', 'Tips'),
    athlete: tx(appLanguage, '선수', 'Athletes'),
    recovery: tx(appLanguage, '회복', 'Recovery'),
  }

  return labels[topic] || topic
}

function ConnectFeedTabs({
  appLanguage,
  feedMode,
  activeTopic,
  searchQuery,
  onFeedModeChange,
  onTopicChange,
  onSearchChange,
}) {
  return (
    <article className="connect-feed-tabs-shell">
      <div className="connect-feed-mode-row">
        {feedModes.map((mode) => (
          <button
            key={mode}
            type="button"
            className={feedMode === mode ? 'connect-feed-mode active' : 'connect-feed-mode'}
            onClick={() => onFeedModeChange(mode)}
          >
            {getFeedModeLabel(appLanguage, mode)}
          </button>
        ))}
      </div>

      <div className="connect-feed-toolbar">
        <label className="connect-search-field">
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={tx(appLanguage, '사람, 루틴, 식단, 팁 검색', 'Search people, routines, meals, and tips')}
          />
        </label>

        <div className="connect-topic-row">
          {topicFilters.map((topic) => (
            <button
              key={topic}
              type="button"
              className={activeTopic === topic ? 'connect-topic-chip active' : 'connect-topic-chip'}
              onClick={() => onTopicChange(topic)}
            >
              {getTopicLabel(appLanguage, topic)}
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}

export default ConnectFeedTabs
