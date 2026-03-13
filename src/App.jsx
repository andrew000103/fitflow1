import './App.css'

function App() {
  return (
    <div className="app">
      <header className="navbar">
        <div className="logo">FitFlow</div>
        <nav className="nav-links">
          <a href="#features">기능</a>
          <a href="#programs">프로그램</a>
          <a href="#contact">문의</a>
        </nav>
      </header>

      <main className="hero-section">
        <div className="hero-text">
          <p className="eyebrow">FITNESS MEETS PRODUCTIVITY</p>
          <h1>
            운동 루틴을
            <br />
            더 쉽게, 더 꾸준하게.
          </h1>
          <p className="description">
            FitFlow는 운동 계획, 진행 기록, 습관 관리를 한 곳에서 도와주는
            스마트 피트니스 서비스입니다.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn">지금 시작하기</button>
            <button className="secondary-btn">데모 보기</button>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-top">
            <span>오늘의 루틴</span>
            <span>07:30 AM</span>
          </div>
          <div className="workout-item">
            <p>워밍업</p>
            <strong>10분 스트레칭</strong>
          </div>
          <div className="workout-item">
            <p>메인 운동</p>
            <strong>상체 집중 45분</strong>
          </div>
          <div className="workout-item">
            <p>마무리</p>
            <strong>가벼운 유산소 15분</strong>
          </div>
        </div>
      </main>

      <section className="features" id="features">
        <div className="feature-box">
          <h3>루틴 관리</h3>
          <p>요일별 운동 계획을 만들고 쉽게 관리할 수 있어요.</p>
        </div>
        <div className="feature-box">
          <h3>진행 추적</h3>
          <p>운동 기록과 성과를 한눈에 확인할 수 있어요.</p>
        </div>
        <div className="feature-box">
          <h3>습관 형성</h3>
          <p>꾸준한 운동을 위한 리마인더와 동기부여를 제공합니다.</p>
        </div>
      </section>

      <section className="programs" id="programs">
        <h2>추천 프로그램</h2>
        <div className="program-grid">
          <div className="program-card">
            <h3>Beginner Flow</h3>
            <p>운동 초보자를 위한 4주 기초 프로그램</p>
          </div>
          <div className="program-card">
            <h3>Strength Up</h3>
            <p>근력 향상 중심의 주 5회 트레이닝 루틴</p>
          </div>
          <div className="program-card">
            <h3>Lean Cardio</h3>
            <p>체지방 감량을 위한 유산소 + 인터벌 프로그램</p>
          </div>
        </div>
      </section>

      <footer className="footer" id="contact">
        <h2>FitFlow</h2>
        <p>더 건강한 루틴을 만드는 가장 쉬운 시작</p>
        <p className="footer-small">contact@fitflow.app</p>
      </footer>
    </div>
  )
}

export default App