import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { tx } from '../utils/appLanguage.js'

const categoryOptions = ['All', 'Bodybuilding', 'Powerbuilding', 'Athletic', 'Diet / Cutting', 'General Strength', 'Beginner', 'Home Training']
const sortOptions = ['Popular', 'Highest Rated', 'Most Used', 'Newest']

function getSortOptionLabel(language, option) {
  if (option === 'Highest Rated') {
    return tx(language, '평점 높은 순', 'Highest Rated')
  }
  if (option === 'Most Used') {
    return tx(language, '사용 많은 순', 'Most Used')
  }
  if (option === 'Newest') {
    return tx(language, '최신순', 'Newest')
  }

  return tx(language, '인기순', 'Popular')
}

function TrainTemplatesPage() {
  const { appLanguage, programs, useProgram, activeProgram } = useOutletContext()
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedSort, setSelectedSort] = useState('Popular')

  const visiblePrograms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return programs
      .filter((program) => program.visibility === 'public' || activeProgram?.programId === program.id || program.authorId === 'me')
      .filter((program) => {
        const matchesQuery =
          !normalizedQuery ||
          program.title.toLowerCase().includes(normalizedQuery) ||
          program.description.toLowerCase().includes(normalizedQuery) ||
          program.authorName.toLowerCase().includes(normalizedQuery)
        const matchesCategory = selectedCategory === 'All' || program.category === selectedCategory
        return matchesQuery && matchesCategory
      })
      .sort((left, right) => {
        if (selectedSort === 'Highest Rated') {
          return (right.averageRating || 0) - (left.averageRating || 0)
        }
        if (selectedSort === 'Most Used') {
          return (right.useCount || 0) - (left.useCount || 0)
        }
        if (selectedSort === 'Newest') {
          return right.id.localeCompare(left.id)
        }
        return (right.likes || 0) - (left.likes || 0)
      })
  }, [activeProgram?.programId, programs, query, selectedCategory, selectedSort])

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={tx(appLanguage, '운동 / 프로그램', 'Workout / Programs')}
        title={tx(appLanguage, '프로그램 둘러보기', 'Browse Programs')}
        description={tx(appLanguage, '몇 주짜리 훈련 계획을 탐색하고, 현재 진행할 프로그램을 선택합니다.', 'Browse multi-week programs and choose your current plan.')}
      />

      <article className="content-card">
        <div className="stack-form">
          <label className="field-label">
            {tx(appLanguage, '프로그램 검색', 'Search programs')}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tx(appLanguage, '프로그램명, 목표, 작성자 검색', 'Search by title, goal, or creator')}
            />
          </label>
          <div className="program-chip-list">
            {categoryOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={selectedCategory === item ? 'inline-action active-soft' : 'inline-action'}
                onClick={() => setSelectedCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="program-chip-list">
            {sortOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={selectedSort === item ? 'inline-action active-soft' : 'inline-action'}
                onClick={() => setSelectedSort(item)}
              >
                {getSortOptionLabel(appLanguage, item)}
              </button>
            ))}
          </div>
        </div>
      </article>

      <div className="simple-list">
        {visiblePrograms.map((program) => (
          <article className="content-card" key={program.id}>
            <div className="feed-head">
              <div>
                <span className="card-kicker">{program.category}</span>
                <h2>{program.title}</h2>
              </div>
              <span className="pill-tag">{program.visibility}</span>
            </div>
            <p>{program.description}</p>
            <div className="program-chip-list">
              <span className="pill-tag">
                {tx(appLanguage, '별점', 'Rating')} {program.averageRating || 0} / 5
              </span>
              <span className="pill-tag">
                {tx(appLanguage, '좋아요', 'Likes')} {program.likes || 0}
              </span>
            </div>
            <div className="program-chip-list">
              {(program.tags || []).map((tag) => (
                <span key={tag} className="pill-tag">
                  {tag}
                </span>
              ))}
            </div>
            <div className="program-chip-list">
              <button className="inline-action" type="button" onClick={() => useProgram(program.id)}>
                {tx(appLanguage, '프로그램 사용', 'Use Program')}
              </button>
              <Link className="inline-action" to={`/train/program/${program.id}`}>
                {tx(appLanguage, '상세 보기', 'View details')}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="sticky-cta-bar">
        <Link className="inline-action" to="/train/create-program">
          {tx(appLanguage, '프로그램 만들기', 'Create Program')}
        </Link>
      </div>
    </section>
  )
}

export default TrainTemplatesPage
