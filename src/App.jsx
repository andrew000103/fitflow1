import { useEffect, useMemo, useState } from 'react'
import './App.css'

const pages = [
  { id: 'workout', label: 'Workout' },
  { id: 'diet', label: 'Diet' },
  { id: 'community', label: 'Community' },
  { id: 'weekly-progress', label: 'Weekly Progress' },
]

const starterPosts = [
  {
    id: 1,
    category: 'diet',
    title: '감량기 점심 추천',
    author: 'Mina',
    body: '점심은 단백질 35g 이상, 오후 운동 전에는 탄수화물도 너무 낮추지 않는 조합이 효율적입니다.',
    likes: 128,
    comments: 18,
  },
  {
    id: 2,
    category: 'bulk',
    title: '등 운동 후 회복 루틴',
    author: 'Joon',
    body: '광배 피로도가 높을 때는 다음 날 데드리프트보다 가벼운 로우와 걷기 볼륨 조절이 좋았습니다.',
    likes: 94,
    comments: 11,
  },
  {
    id: 3,
    category: 'maintain',
    title: '휴식 시간에 보는 30초 스트레칭',
    author: 'Sora',
    body: '세트 사이 90초 휴식일 때 흉추 회전 스트레칭 2가지만 넣어도 다음 세트 집중도가 꽤 올라갑니다.',
    likes: 76,
    comments: 9,
  },
]

const weeklyData = [
  { day: 'Mon', workout: 54, intake: 2120, steps: 9120 },
  { day: 'Tue', workout: 62, intake: 1980, steps: 10840 },
  { day: 'Wed', workout: 38, intake: 2240, steps: 8420 },
  { day: 'Thu', workout: 71, intake: 2050, steps: 12610 },
  { day: 'Fri', workout: 66, intake: 2310, steps: 11840 },
  { day: 'Sat', workout: 49, intake: 2460, steps: 9540 },
  { day: 'Sun', workout: 28, intake: 1890, steps: 13210 },
]

function App() {
  const [activePage, setActivePage] = useState('workout')

  const [exerciseName, setExerciseName] = useState('Bench Press')
  const [reps, setReps] = useState('8')
  const [weight, setWeight] = useState('60')
  const [restSeconds, setRestSeconds] = useState(90)
  const [timeLeft, setTimeLeft] = useState(0)
  const [sets, setSets] = useState([
    { id: 1, exercise: 'Bench Press', reps: 8, weight: 60, volume: 480, calories: 38 },
    { id: 2, exercise: 'Bench Press', reps: 8, weight: 60, volume: 480, calories: 38 },
  ])

  const [mealName, setMealName] = useState('닭가슴살 포케')
  const [mealCalories, setMealCalories] = useState('520')
  const [goal, setGoal] = useState('diet')
  const [meals, setMeals] = useState([
    { id: 1, name: '그릭요거트 볼', calories: 320 },
    { id: 2, name: '닭가슴살 포케', calories: 520 },
  ])

  const [steps, setSteps] = useState(11284)
  const [posts, setPosts] = useState(starterPosts)
  const [postTitle, setPostTitle] = useState('')
  const [postBody, setPostBody] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (timeLeft <= 0) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [timeLeft])

  const totalWorkoutCalories = useMemo(
    () => sets.reduce((sum, set) => sum + set.calories, 0),
    [sets],
  )

  const totalVolume = useMemo(
    () => sets.reduce((sum, set) => sum + set.volume, 0),
    [sets],
  )

  const fatigueScore = Math.min(100, Math.round(totalVolume / 18))
  const fatigueLabel = fatigueScore >= 80 ? 'High' : fatigueScore >= 55 ? 'Moderate' : 'Low'

  const consumedCalories = useMemo(
    () => meals.reduce((sum, meal) => sum + meal.calories, 0),
    [meals],
  )

  const stepCalories = Math.round(steps * 0.04)
  const baseMetabolism = 1680
  const totalBurn = baseMetabolism + stepCalories + totalWorkoutCalories
  const netCalories = consumedCalories - totalBurn
  const recommendedCalories =
    goal === 'diet' ? totalBurn - 350 : goal === 'bulk' ? totalBurn + 280 : totalBurn

  const filteredPosts = posts.filter((post) => filter === 'all' || post.category === filter)

  const streak = 5
  const weeklyWorkoutMinutes = weeklyData.reduce((sum, item) => sum + item.workout, 0)
  const weeklyStepAverage = Math.round(
    weeklyData.reduce((sum, item) => sum + item.steps, 0) / weeklyData.length,
  )
  const weeklyIntakeAverage = Math.round(
    weeklyData.reduce((sum, item) => sum + item.intake, 0) / weeklyData.length,
  )

  function handleLogSet(event) {
    event.preventDefault()

    const repsNumber = Number(reps)
    const weightNumber = Number(weight)
    const volume = repsNumber * weightNumber
    const calories = Math.max(12, Math.round(repsNumber * weightNumber * 0.08))

    if (!exerciseName || repsNumber <= 0 || weightNumber <= 0) {
      return
    }

    setSets((current) => [
      {
        id: Date.now(),
        exercise: exerciseName,
        reps: repsNumber,
        weight: weightNumber,
        volume,
        calories,
      },
      ...current,
    ])
    setTimeLeft(restSeconds)
  }

  function handleAddMeal(event) {
    event.preventDefault()

    const calorieNumber = Number(mealCalories)
    if (!mealName || calorieNumber <= 0) {
      return
    }

    setMeals((current) => [
      { id: Date.now(), name: mealName, calories: calorieNumber },
      ...current,
    ])
  }

  function handleCreatePost(event) {
    event.preventDefault()

    if (!postTitle || !postBody) {
      return
    }

    setPosts((current) => [
      {
        id: Date.now(),
        category: goal,
        title: postTitle,
        author: 'You',
        body: postBody,
        likes: 0,
        comments: 0,
      },
      ...current,
    ])
    setPostTitle('')
    setPostBody('')
  }

  function handleLikePost(postId) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post,
      ),
    )
  }

  const restWarning = timeLeft > 0 && timeLeft <= 10
  const restClock = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(
    timeLeft % 60,
  ).padStart(2, '0')}`

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <span className="brand-mark">FF</span>
          <div>
            <strong>FitFlow</strong>
            <p>운동, 식단, 커뮤니티, 주간 리포트를 한 앱에서 운용</p>
          </div>
        </div>

        <div className="header-stats">
          <article>
            <span>Today burn</span>
            <strong>{totalBurn} kcal</strong>
          </article>
          <article>
            <span>Steps</span>
            <strong>{steps.toLocaleString()}</strong>
          </article>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <nav className="page-nav" aria-label="Pages">
            {pages.map((page) => (
              <button
                key={page.id}
                type="button"
                className={page.id === activePage ? 'page-link active' : 'page-link'}
                onClick={() => setActivePage(page.id)}
              >
                {page.label}
              </button>
            ))}
          </nav>

          <section className="summary-card">
            <p className="card-label">Recovery forecast</p>
            <strong>{fatigueLabel} fatigue</strong>
            <span>가슴/삼두 볼륨이 누적되어 내일은 등 또는 하체 추천</span>
          </section>

          <section className="summary-card">
            <p className="card-label">Goal mode</p>
            <strong>{goal === 'diet' ? 'Diet cut' : goal === 'bulk' ? 'Lean bulk' : 'Maintain'}</strong>
            <span>권장 섭취 {recommendedCalories} kcal</span>
          </section>
        </aside>

        <main className="page-panel">
          {activePage === 'workout' && (
            <section className="page-grid">
              <div className="panel-card hero-card">
                <div className="section-title">
                  <div>
                    <p className="card-label">Workout</p>
                    <h1>세트 기록과 휴식 타이머</h1>
                  </div>
                  <div className={restWarning ? 'timer-chip warning' : 'timer-chip'}>
                    {timeLeft > 0 ? `Rest ${restClock}` : 'Ready'}
                  </div>
                </div>

                <form className="form-grid" onSubmit={handleLogSet}>
                  <label>
                    Exercise
                    <input value={exerciseName} onChange={(event) => setExerciseName(event.target.value)} />
                  </label>
                  <label>
                    Reps
                    <input value={reps} onChange={(event) => setReps(event.target.value)} inputMode="numeric" />
                  </label>
                  <label>
                    Weight (kg)
                    <input value={weight} onChange={(event) => setWeight(event.target.value)} inputMode="decimal" />
                  </label>
                  <label>
                    Rest seconds
                    <input
                      value={restSeconds}
                      onChange={(event) => setRestSeconds(Number(event.target.value) || 0)}
                      inputMode="numeric"
                    />
                  </label>
                  <button className="primary-action" type="submit">
                    세트 기록하기
                  </button>
                </form>

                {restWarning && (
                  <div className="alert-banner">
                    휴식 종료 10초 이내입니다. 커뮤니티를 보고 있었다면 다음 세트로 복귀할 시간입니다.
                  </div>
                )}
              </div>

              <div className="dual-column">
                <article className="panel-card">
                  <div className="section-title">
                    <div>
                      <p className="card-label">Live summary</p>
                      <h2>오늘 운동 요약</h2>
                    </div>
                  </div>
                  <div className="stat-grid">
                    <div>
                      <span>Total sets</span>
                      <strong>{sets.length}</strong>
                    </div>
                    <div>
                      <span>Volume</span>
                      <strong>{totalVolume.toLocaleString()} kg</strong>
                    </div>
                    <div>
                      <span>Workout burn</span>
                      <strong>{totalWorkoutCalories} kcal</strong>
                    </div>
                    <div>
                      <span>Fatigue</span>
                      <strong>{fatigueScore}/100</strong>
                    </div>
                  </div>
                </article>

                <article className="panel-card">
                  <div className="section-title">
                    <div>
                      <p className="card-label">Fatigue map</p>
                      <h2>부위별 피로도 예측</h2>
                    </div>
                  </div>
                  <div className="fatigue-list">
                    <div><span>Chest</span><strong>{Math.min(100, fatigueScore + 12)}%</strong></div>
                    <div><span>Triceps</span><strong>{Math.min(100, fatigueScore + 8)}%</strong></div>
                    <div><span>Back</span><strong>{Math.max(20, fatigueScore - 28)}%</strong></div>
                    <div><span>Legs</span><strong>{Math.max(16, fatigueScore - 35)}%</strong></div>
                  </div>
                </article>
              </div>

              <article className="panel-card full-width">
                <div className="section-title">
                  <div>
                    <p className="card-label">Set history</p>
                    <h2>기록된 세트</h2>
                  </div>
                </div>
                <div className="history-list">
                  {sets.map((set) => (
                    <div className="history-row" key={set.id}>
                      <strong>{set.exercise}</strong>
                      <span>{set.reps} reps</span>
                      <span>{set.weight} kg</span>
                      <span>{set.volume} volume</span>
                      <span>{set.calories} kcal</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          )}

          {activePage === 'diet' && (
            <section className="page-grid">
              <div className="panel-card hero-card">
                <div className="section-title">
                  <div>
                    <p className="card-label">Diet</p>
                    <h1>섭취 칼로리와 순소모 계산</h1>
                  </div>
                </div>

                <div className="goal-toggle">
                  {['diet', 'maintain', 'bulk'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={goal === mode ? 'toggle-chip active' : 'toggle-chip'}
                      onClick={() => setGoal(mode)}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <form className="form-grid" onSubmit={handleAddMeal}>
                  <label>
                    Meal name
                    <input value={mealName} onChange={(event) => setMealName(event.target.value)} />
                  </label>
                  <label>
                    Calories
                    <input
                      value={mealCalories}
                      onChange={(event) => setMealCalories(event.target.value)}
                      inputMode="numeric"
                    />
                  </label>
                  <button className="primary-action" type="submit">
                    식단 추가
                  </button>
                </form>
              </div>

              <div className="dual-column">
                <article className="panel-card">
                  <p className="card-label">Daily energy</p>
                  <h2>오늘 에너지 밸런스</h2>
                  <label className="inline-field">
                    Steps today
                    <input
                      value={steps}
                      onChange={(event) => setSteps(Number(event.target.value) || 0)}
                      inputMode="numeric"
                    />
                  </label>
                  <div className="stat-grid compact">
                    <div>
                      <span>Consumed</span>
                      <strong>{consumedCalories} kcal</strong>
                    </div>
                    <div>
                      <span>Workout burn</span>
                      <strong>{totalWorkoutCalories} kcal</strong>
                    </div>
                    <div>
                      <span>Step burn</span>
                      <strong>{stepCalories} kcal</strong>
                    </div>
                    <div>
                      <span>Net</span>
                      <strong>{netCalories} kcal</strong>
                    </div>
                  </div>
                </article>

                <article className="panel-card">
                  <p className="card-label">Recommendation</p>
                  <h2>권장 섭취량</h2>
                  <div className="recommend-box">
                    <strong>{recommendedCalories} kcal</strong>
                    <span>
                      현재 목표는 {goal}. 오늘 총 소모량을 기준으로 권장 섭취량을 자동 계산했습니다.
                    </span>
                  </div>
                </article>
              </div>

              <article className="panel-card full-width">
                <p className="card-label">Meal log</p>
                <h2>오늘 식단 기록</h2>
                <div className="history-list">
                  {meals.map((meal) => (
                    <div className="history-row" key={meal.id}>
                      <strong>{meal.name}</strong>
                      <span>{meal.calories} kcal</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          )}

          {activePage === 'community' && (
            <section className="page-grid">
              <div className="panel-card hero-card">
                <div className="section-title">
                  <div>
                    <p className="card-label">Community</p>
                    <h1>피드, 좋아요, 목표별 추천</h1>
                  </div>
                  <div className={restWarning ? 'timer-chip warning' : 'timer-chip subtle'}>
                    {timeLeft > 0 ? `Rest ends in ${restClock}` : 'No active rest'}
                  </div>
                </div>

                <div className="goal-toggle">
                  {['all', 'diet', 'maintain', 'bulk'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={filter === mode ? 'toggle-chip active' : 'toggle-chip'}
                      onClick={() => setFilter(mode)}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <form className="post-form" onSubmit={handleCreatePost}>
                  <input
                    placeholder="게시물 제목"
                    value={postTitle}
                    onChange={(event) => setPostTitle(event.target.value)}
                  />
                  <textarea
                    placeholder="운동 팁이나 식단 후기를 적어보세요"
                    value={postBody}
                    onChange={(event) => setPostBody(event.target.value)}
                    rows="4"
                  />
                  <button className="primary-action" type="submit">
                    게시하기
                  </button>
                </form>
              </div>

              <article className="panel-card full-width">
                <div className="section-title">
                  <div>
                    <p className="card-label">Feed</p>
                    <h2>{filter === 'all' ? '전체 피드' : `${filter} 맞춤 피드`}</h2>
                  </div>
                </div>
                <div className="post-list">
                  {filteredPosts.map((post) => (
                    <article className="post-card" key={post.id}>
                      <div className="post-head">
                        <div>
                          <strong>{post.title}</strong>
                          <span>{post.author}</span>
                        </div>
                        <span className="post-tag">{post.category}</span>
                      </div>
                      <p>{post.body}</p>
                      <div className="post-actions">
                        <button type="button" onClick={() => handleLikePost(post.id)}>
                          추천 {post.likes}
                        </button>
                        <span>댓글 {post.comments}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </section>
          )}

          {activePage === 'weekly-progress' && (
            <section className="page-grid">
              <div className="panel-card hero-card">
                <div className="section-title">
                  <div>
                    <p className="card-label">Weekly progress</p>
                    <h1>주간 성장과 streak 대시보드</h1>
                  </div>
                </div>
                <div className="stat-grid">
                  <div>
                    <span>Workout minutes</span>
                    <strong>{weeklyWorkoutMinutes} min</strong>
                  </div>
                  <div>
                    <span>Avg steps</span>
                    <strong>{weeklyStepAverage.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Avg intake</span>
                    <strong>{weeklyIntakeAverage} kcal</strong>
                  </div>
                  <div>
                    <span>Streak</span>
                    <strong>{streak} days</strong>
                  </div>
                </div>
              </div>

              <article className="panel-card full-width">
                <p className="card-label">Weekly chart</p>
                <h2>요일별 운동 시간</h2>
                <div className="bar-chart">
                  {weeklyData.map((item) => (
                    <div className="bar-column" key={item.day}>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ height: `${item.workout}%` }} />
                      </div>
                      <strong>{item.day}</strong>
                      <span>{item.workout}m</span>
                    </div>
                  ))}
                </div>
              </article>

              <div className="dual-column">
                <article className="panel-card">
                  <p className="card-label">Highlights</p>
                  <h2>이번 주 성과</h2>
                  <div className="insight-list">
                    <div>오운완 streak {streak}일 유지 중</div>
                    <div>목요일 운동 시간이 가장 길었습니다</div>
                    <div>일요일 걸음수가 최고치였습니다</div>
                  </div>
                </article>

                <article className="panel-card">
                  <p className="card-label">Next action</p>
                  <h2>다음 주 추천</h2>
                  <div className="insight-list">
                    <div>수요일 운동 시간을 15분만 늘리면 주간 볼륨 균형이 좋아집니다</div>
                    <div>평균 섭취량은 유지 구간에 가깝습니다</div>
                    <div>피로도를 고려해 월요일은 하체보다 등 운동이 적절합니다</div>
                  </div>
                </article>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
