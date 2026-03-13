import PageHeader from '../components/PageHeader.jsx'
import { useOutletContext } from 'react-router-dom'
import { useState } from 'react'

function CommunityPage() {
  const { posts, likePost, addPost, timeLeft, goal, aiCoach } = useOutletContext()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [filter, setFilter] = useState('all')

  function handleSubmit(event) {
    event.preventDefault()
    if (!title || !body) {
      return
    }
    addPost({ title, body })
    setTitle('')
    setBody('')
  }

  const restClock = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`
  const filteredPosts = posts.filter((post) => filter === 'all' || post.category === filter)

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Community"
        title="운동 인증과 숏폼 소비가 습관 형성으로 이어지는 피드"
        description="Instagram형 피드 구조를 기반으로 운동 인증, 식단 공유, 숏폼, 댓글, 추천 알고리즘이 돌아가는 메인 커뮤니티 탭입니다."
      />

      <div className="card-grid split">
        <article className="content-card">
          <span className="card-kicker">Quick share</span>
          <h2>오늘 운동이나 식단 후기를 바로 올리기</h2>
          <form className="stack-form" onSubmit={handleSubmit}>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="게시물 제목" />
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows="4" placeholder="운동 인증, 식단 후기, 팁을 적어보세요" />
            <button className="inline-action primary-dark" type="submit">
              게시하기
            </button>
          </form>
        </article>

        <article className="content-card">
          <span className="card-kicker">Live context</span>
          <h2>현재 목표와 휴식 타이머가 피드 소비와 연결됩니다</h2>
          <p>현재 목표는 {goal}. 휴식 타이머가 돌고 있다면 숏폼 시청 중에도 복귀 타이밍을 놓치지 않도록 흐름을 붙입니다.</p>
          <div className={timeLeft > 0 ? 'status-chip active' : 'status-chip'}>
            {timeLeft > 0 ? `Rest ends in ${restClock}` : 'No active rest timer'}
          </div>
          <div className="mini-panel">{aiCoach.community}</div>
        </article>
      </div>

      <div className="filter-row">
        {['all', 'diet', 'maintain', 'bulk'].map((item) => (
          <button
            key={item}
            type="button"
            className={filter === item ? 'inline-action active-soft' : 'inline-action'}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="feed-list">
        {filteredPosts.map((post) => (
          <article className="content-card" key={post.id}>
            <div className="feed-head">
              <div>
                <span className="card-kicker">{post.category}</span>
                <h2>{post.title}</h2>
              </div>
              <span className="pill-tag">{post.author}</span>
            </div>
            <p>{post.body}</p>
            <div className="feed-actions">
              <button className="inline-action" type="button" onClick={() => likePost(post.id)}>
                추천 {post.likes}
              </button>
              <span>댓글 {post.comments}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default CommunityPage
