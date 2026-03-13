import PageHeader from '../components/PageHeader.jsx'
import { Link, useOutletContext } from 'react-router-dom'

function ProfilePage() {
  const { goal, setGoal, steps, setSteps, streakDays, aiCoach, resetAllData } = useOutletContext()

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Profile / Me"
        title="계정, 목표, 개인화 설정을 관리하는 Me 영역"
        description="신체 정보, 감량/유지/벌크 목표, 알림, 추천 선호도를 관리하고 Nutrition으로도 진입합니다."
      />

      <div className="card-grid split">
        <article className="content-card">
          <span className="card-kicker">User</span>
          <h2>Donghyun An</h2>
          <p>목표, 기본 활동량, 알림 설정을 조정하는 Me 허브입니다.</p>
          <div className="summary-grid tight">
            <div>
              <span>Current streak</span>
              <strong>{streakDays} days</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>{goal}</strong>
            </div>
          </div>
        </article>
        <article className="content-card">
          <span className="card-kicker">Preferences</span>
          <h2>알림과 추천 설정</h2>
          <div className="stack-form">
            <label className="field-label">
              Goal
              <select value={goal} onChange={(event) => setGoal(event.target.value)}>
                <option value="diet">diet</option>
                <option value="maintain">maintain</option>
                <option value="bulk">bulk</option>
              </select>
            </label>
            <label className="field-label">
              Steps today
              <input value={steps} onChange={(event) => setSteps(Number(event.target.value) || 0)} inputMode="numeric" />
            </label>
          </div>
          <div className="mini-panel">{aiCoach.training}</div>
          <Link className="inline-action" to="/profile/nutrition">
            Nutrition 설정 및 기록 보기
          </Link>
          <button className="inline-action" type="button" onClick={resetAllData}>
            로컬 데이터 초기화
          </button>
        </article>
      </div>
    </section>
  )
}

export default ProfilePage
