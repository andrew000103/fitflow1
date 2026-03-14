import AppIcon from '../components/AppIcon.jsx'
import PageHeader from '../components/PageHeader.jsx'

function ShopPage() {
  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Shop"
        title="Shop"
        description="운동 프로그램, 운동 용품, 운동복을 판매하는 마켓으로 확장될 예정이며 추후 입점도 받을 예정입니다."
      />

      <div className="launcher-stat-row">
        <article className="launcher-stat-card">
          <span className="card-kicker">Status</span>
          <strong>Coming soon</strong>
          <p>마켓 기능과 입점 흐름은 추후 단계적으로 연결됩니다.</p>
        </article>
        <article className="launcher-stat-card">
          <span className="card-kicker">Categories</span>
          <strong>3 core verticals</strong>
          <p>운동 프로그램, 운동 용품, 운동복 카테고리로 시작할 예정입니다.</p>
        </article>
        <article className="launcher-stat-card">
          <span className="card-kicker">Seller onboarding</span>
          <strong>Vendor ready</strong>
          <p>추후 브랜드와 크리에이터의 입점을 받을 수 있는 구조로 확장합니다.</p>
        </article>
      </div>

      <div className="train-action-grid">
        <article className="train-action-card is-static">
          <span className="train-action-icon" aria-hidden="true">
            <AppIcon name="program" />
          </span>
          <div className="train-action-copy">
            <strong>Training Programs</strong>
            <span>크리에이터와 코치가 운동 프로그램을 판매하거나 배포하는 영역</span>
          </div>
          <span className="train-action-cta">Soon</span>
        </article>

        <article className="train-action-card is-static">
          <span className="train-action-icon" aria-hidden="true">
            <AppIcon name="equipment" />
          </span>
          <div className="train-action-copy">
            <strong>Fitness Equipment</strong>
            <span>운동 기구, 소도구, 액세서리 판매를 위한 영역</span>
          </div>
          <span className="train-action-cta">Soon</span>
        </article>

        <article className="train-action-card is-static">
          <span className="train-action-icon" aria-hidden="true">
            <AppIcon name="style" />
          </span>
          <div className="train-action-copy">
            <strong>Activewear</strong>
            <span>운동복과 퍼포먼스 웨어를 판매하는 영역</span>
          </div>
          <span className="train-action-cta">Soon</span>
        </article>

        <article className="train-action-card is-static">
          <span className="train-action-icon" aria-hidden="true">
            <AppIcon name="seller" />
          </span>
          <div className="train-action-copy">
            <strong>Seller Center</strong>
            <span>추후 입점 신청, 상품 등록, 정산 관리를 위한 공간</span>
          </div>
          <span className="train-action-cta">Soon</span>
        </article>
      </div>

      <article className="content-card">
        <span className="card-kicker">Roadmap</span>
        <div className="bullet-stack">
          <div className="mini-panel">프로그램 상품 등록과 무료 배포 / 유료 판매 옵션</div>
          <div className="mini-panel">운동 용품 / 운동복 상품 상세와 장바구니 흐름</div>
          <div className="mini-panel">입점 신청, 판매자 승인, 셀러 센터 관리</div>
          <div className="mini-panel">결제, 주문, 후기, 추천 정렬</div>
        </div>
      </article>
    </section>
  )
}

export default ShopPage
