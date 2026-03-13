import './App.css'

const pillars = [
  {
    title: 'Workout OS',
    description:
      '세트 기록과 동시에 휴식 타이머가 시작되고, 루틴 종료 직후 운동 칼로리와 부위별 피로도가 자동 계산됩니다.',
    points: ['세트당 횟수 입력 즉시 휴식 카운트', '운동 종료 후 소모 칼로리 계산', '부위별 피로도 히트맵'],
  },
  {
    title: 'Daily Metabolism',
    description:
      '만보기, 활동 대사, 운동 데이터, 식단 로그를 합쳐 자정 기준으로 하루의 에너지 흐름을 정산합니다.',
    points: ['걸음수와 활동 대사 누적', '섭취 칼로리 자동 집계', '자정 Net 칼로리 리포트'],
  },
  {
    title: 'AI Coaching Loop',
    description:
      '오늘의 회복 상태와 목표에 맞춰 운동 부위, 휴식 여부, 점심/저녁 메뉴, 커뮤니티 콘텐츠까지 개인화합니다.',
    points: ['휴식 또는 운동 부위 추천', '벌크업/감량 메뉴 추천', '목표 기반 피드 알고리즘'],
  },
]

const roadmap = [
  {
    label: 'During Workout',
    title: '기록과 휴식이 동시에 돌아가는 운동 화면',
    text: '한 세트의 횟수를 입력하는 순간 다음 세트까지의 타이머가 시작되고, 남은 시간이 10초 이하가 되면 커뮤니티 숏폼 위에 복귀 알림이 올라옵니다.',
  },
  {
    label: 'End of Day',
    title: '자정에 하루의 칼로리 손익을 자동 정산',
    text: '운동, 걸음수, 활동 대사와 식단 기록을 합산해 Net 칼로리를 계산하고, 체중 유지/감량/증량 기준 권장 섭취량을 다시 제안합니다.',
  },
  {
    label: 'Long-term Growth',
    title: '주차별 시각화와 챌린지로 유지율 강화',
    text: '주간 볼륨, 오운완 streak, 부위별 피로 누적, 프로그램 진행률을 하나의 대시보드에서 확인할 수 있습니다.',
  },
]

const communitySignals = [
  '운동 숏폼과 게시물 피드',
  '추천, 댓글, 일간/주간/월간 인기글',
  '다이어트·벌크업·유지 목표별 노출 최적화',
  '운동 프로그램 무료 배포 및 판매',
]

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-mark">FF</span>
          <span className="brand-copy">
            <strong>FitFlow</strong>
            <span>Adaptive health operating system</span>
          </span>
        </a>

        <nav className="topnav" aria-label="Primary">
          <a href="#pillars">Core</a>
          <a href="#engine">Engine</a>
          <a href="#community">Community</a>
          <a href="#market">Marketplace</a>
        </nav>

        <a className="nav-cta" href="#launch">
          MVP 설계 시작
        </a>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Unified fitness, nutrition, recovery, and community</p>
            <h1>운동 기록 앱이 아니라 하루 전체 대사와 회복을 관리하는 헬스케어 홈 베이스.</h1>
            <p className="hero-text">
              FitFlow는 세트 기록, 휴식 타이머, 걸음수, 식단, AI 추천, 커뮤니티, 프로그램 마켓을
              하나의 루프 안에 묶어 매일의 행동과 결과를 연결합니다.
            </p>

            <div className="hero-actions">
              <a className="button-primary" href="#launch">
                정보 구조 보기
              </a>
              <a className="button-secondary" href="#engine">
                핵심 계산 흐름
              </a>
            </div>

            <div className="hero-metrics">
              <article>
                <strong>14</strong>
                <span>핵심 기능 축</span>
              </article>
              <article>
                <strong>4</strong>
                <span>데이터 루프</span>
              </article>
              <article>
                <strong>24h</strong>
                <span>자정 정산 사이클</span>
              </article>
            </div>
          </div>

          <div className="hero-panel">
            <section className="device-card primary-card">
              <div className="panel-header">
                <span>Today Engine</span>
                <span>06:42 PM</span>
              </div>

              <div className="live-set">
                <div>
                  <p>Bench Press</p>
                  <strong>8 reps logged</strong>
                </div>
                <span className="pulse-badge">Rest 01:20</span>
              </div>

              <div className="stack-list">
                <article>
                  <span>Workout burn</span>
                  <strong>462 kcal</strong>
                </article>
                <article>
                  <span>Steps today</span>
                  <strong>11,284</strong>
                </article>
                <article>
                  <span>Net calories</span>
                  <strong>-318 kcal</strong>
                </article>
              </div>
            </section>

            <section className="device-card secondary-card">
              <div className="panel-header">
                <span>AI Coach</span>
                <span>Recovery 78%</span>
              </div>

              <div className="coach-chip">오늘은 하체 휴식, 등 + 코어 추천</div>
              <div className="meal-card">
                <p>Dinner suggestion</p>
                <strong>연어 포케 + 미소 수프</strong>
                <span>고단백 / 유지 칼로리 대비 -120 kcal</span>
              </div>
              <div className="countdown-note">휴식 종료 10초 전, 숏폼 시청 중에도 복귀 알림 제공</div>
            </section>
          </div>
        </section>

        <section className="pillars-section" id="pillars">
          <div className="section-heading">
            <p className="eyebrow">Platform pillars</p>
            <h2>기능을 나열하지 않고, 사용자의 하루를 움직이는 3개의 엔진으로 묶었습니다.</h2>
          </div>

          <div className="pillar-grid">
            {pillars.map((pillar) => (
              <article className="pillar-card" key={pillar.title}>
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
                <ul>
                  {pillar.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="engine-section" id="engine">
          <div className="section-heading narrow">
            <p className="eyebrow">Experience architecture</p>
            <h2>운동 중, 하루 마감, 주간 성장의 세 타이밍에서 제품 가치가 선명하게 보여야 합니다.</h2>
          </div>

          <div className="roadmap-grid">
            {roadmap.map((item) => (
              <article className="roadmap-card" key={item.title}>
                <span className="roadmap-label">{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="community-section" id="community">
          <div className="community-copy">
            <p className="eyebrow">Community + retention</p>
            <h2>휴식 시간의 짧은 공백을 커뮤니티 소비로 바꾸고, 다시 운동 복귀로 자연스럽게 연결합니다.</h2>
            <p>
              짧은 세션 기반 피드, 인기글 랭킹, 목표별 추천, 오운완 챌린지와 streak를 한 흐름으로
              설계하면 콘텐츠 소비가 운동 이탈이 아니라 유지율 장치가 됩니다.
            </p>
          </div>

          <div className="signal-board">
            {communitySignals.map((signal) => (
              <div className="signal-chip" key={signal}>
                {signal}
              </div>
            ))}
          </div>
        </section>

        <section className="market-section" id="market">
          <article className="market-card">
            <p className="eyebrow">Creator marketplace</p>
            <h2>운동 프로그램을 구성해 무료 배포하거나 판매할 수 있는 트레이너/크리에이터 레이어.</h2>
            <p>
              사용자 기록 데이터와 연결된 프로그램은 단순 PDF보다 실행력이 높고, 구매 후 수행률과
              후기까지 플랫폼 내에서 다시 순환시킬 수 있습니다.
            </p>
          </article>

          <article className="market-stats">
            <div>
              <strong>Weekly Progress</strong>
              <span>볼륨, 칼로리, 걸음수, streak 가시화</span>
            </div>
            <div>
              <strong>Recommendation Graph</strong>
              <span>목표에 따라 피드와 메뉴 추천이 바뀌는 알고리즘 레이어</span>
            </div>
            <div>
              <strong>Recovery Forecast</strong>
              <span>운동 기록 기반 부위별 피로도 추정</span>
            </div>
          </article>
        </section>

        <section className="launch-section" id="launch">
          <div>
            <p className="eyebrow">Homepage foundation</p>
            <h2>MVP 첫 화면은 “오늘 무엇을 해야 하는지”와 “어제 무엇이 쌓였는지”를 동시에 보여줘야 합니다.</h2>
          </div>
          <a className="button-primary" href="#home">
            상단으로 이동
          </a>
        </section>
      </main>
    </div>
  )
}

export default App
