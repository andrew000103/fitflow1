import { useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { tx } from '../utils/appLanguage.js'

function TrainProgramDetailPage() {
  const { programId } = useParams()
  const { appLanguage, programs, activeProgram, programLikes, programReviews, useProgram, toggleProgramLike, addProgramReview, startWorkout } =
    useOutletContext()
  const navigate = useNavigate()
  const [reviewText, setReviewText] = useState('')
  const [rating, setRating] = useState('5')

  const program = programs.find((item) => item.id === programId) || null
  const isActiveProgram = activeProgram?.programId === programId
  const isLiked = programLikes.some((item) => item.programId === programId && item.userId === 'me')
  const reviews = useMemo(
    () => programReviews.filter((item) => item.programId === programId),
    [programId, programReviews],
  )

  if (!program) {
    return null
  }

  const activeWeek = isActiveProgram ? activeProgram.currentWeek : 1
  const activeDay = isActiveProgram ? activeProgram.currentDay : 1

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={tx(appLanguage, '운동 / 프로그램', 'Train / Program')}
        title={program.title}
        description={tx(appLanguage, '프로그램 개요, 주차 구조, 좋아요, 후기, 사용 흐름을 한곳에서 확인합니다.', 'See overview, weekly structure, likes, reviews, and use flow in one place.')}
      />

      <div className="card-grid split">
        <article className="content-card">
          <span className="card-kicker">{program.category}</span>
          <p>{program.description}</p>
          <div className="summary-grid tight">
            <div>
              <span>{tx(appLanguage, '목표', 'Goal')}</span>
              <strong>{program.goal}</strong>
            </div>
            <div>
              <span>{tx(appLanguage, '난이도', 'Difficulty')}</span>
              <strong>{program.difficulty}</strong>
            </div>
            <div>
              <span>{tx(appLanguage, '기간', 'Duration')}</span>
              <strong>{program.durationWeeks} {tx(appLanguage, '주', 'weeks')}</strong>
            </div>
            <div>
              <span>{tx(appLanguage, '빈도', 'Frequency')}</span>
              <strong>{program.sessionsPerWeek}/week</strong>
            </div>
            <div>
              <span>{tx(appLanguage, '작성자', 'Creator')}</span>
              <strong>{program.authorName}</strong>
            </div>
            <div>
              <span>{tx(appLanguage, '공개 설정', 'Visibility')}</span>
              <strong>{program.visibility}</strong>
            </div>
          </div>
          <div className="program-chip-list">
            <button className={isLiked ? 'inline-action active-soft' : 'inline-action'} type="button" onClick={() => toggleProgramLike(program.id)}>
              {isLiked ? tx(appLanguage, '좋아요함', 'Liked') : tx(appLanguage, '좋아요', 'Like')} · {program.likes || 0}
            </button>
            <button className="inline-action" type="button" onClick={() => useProgram(program.id)}>
              {isActiveProgram ? tx(appLanguage, '현재 프로그램', 'Current Program') : tx(appLanguage, '프로그램 사용', 'Use Program')}
            </button>
            <button
              className="inline-action primary-dark"
              type="button"
              onClick={() => {
                useProgram(program.id)
                startWorkout('program', {
                  ...program,
                  currentWeek: activeWeek,
                  currentDay: activeDay,
                })
                navigate('/train/workout')
              }}
            >
              {tx(appLanguage, '운동 시작', 'Start workout')}
            </button>
          </div>
        </article>

        <article className="content-card">
          <span className="card-kicker">{tx(appLanguage, '주차 구조', 'Weekly structure')}</span>
          <div className="simple-list">
            {program.weeks.map((week) => (
              <details key={week.id} open={week.weekIndex === activeWeek}>
                <summary>{tx(appLanguage, `주차 ${week.weekIndex}`, `Week ${week.weekIndex}`)}</summary>
                <div className="simple-list">
                  {week.days.map((day) => (
                    <div className="simple-row" key={day.id}>
                      <strong>{tx(appLanguage, `요일 ${day.dayIndex}`, `Day ${day.dayIndex}`)} · {day.title}</strong>
                      <span>{day.focus}</span>
                      <span>{day.exercises.map((exercise) => exercise.exerciseName).join(' · ')}</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </article>
      </div>

      <div className="card-grid split">
        <article className="content-card">
          <div className="feed-head">
            <div>
              <span className="card-kicker">{tx(appLanguage, '후기', 'Reviews')}</span>
              <h2>{tx(appLanguage, `${reviews.length}개 후기`, `${reviews.length} reviews`)}</h2>
            </div>
            <span className="pill-tag">{program.averageRating || 0} / 5</span>
          </div>
          <div className="simple-list">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div className="simple-row" key={review.id}>
                  <strong>{review.authorName}</strong>
                  <span>{review.rating} / 5</span>
                  <span>{review.content}</span>
                </div>
              ))
            ) : (
              <div className="mini-panel">{tx(appLanguage, '아직 등록된 후기가 없습니다.', 'No reviews yet.')}</div>
            )}
          </div>
        </article>

        <article className="content-card">
          <span className="card-kicker">{tx(appLanguage, '후기 작성', 'Write a review')}</span>
          <div className="stack-form">
            <label className="field-label">
              {tx(appLanguage, '평점', 'Rating')}
              <select value={rating} onChange={(event) => setRating(event.target.value)}>
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
            </label>
            <label className="field-label">
              {tx(appLanguage, '후기', 'Review')}
              <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} rows={4} />
            </label>
            <button
              className="inline-action primary-dark"
              type="button"
              onClick={() => {
                addProgramReview(program.id, Number(rating), reviewText)
                setReviewText('')
                setRating('5')
              }}
            >
              {tx(appLanguage, '후기 등록', 'Submit review')}
            </button>
          </div>
        </article>
      </div>

      <div className="sticky-cta-bar">
        <Link className="inline-action" to="/train/programs">
          {tx(appLanguage, '프로그램 둘러보기', 'Browse Programs')}
        </Link>
        <Link className="inline-action" to="/train/create-program">
          {tx(appLanguage, '프로그램 만들기', 'Create Program')}
        </Link>
      </div>
    </section>
  )
}

export default TrainProgramDetailPage
