import PageHeader from '../../../components/PageHeader.jsx'

function InsightsPage() {
  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Insights"
        title="Insights"
        description="근육 피로도와 회복 상태를 확인하는 페이지입니다."
      />

      <div style={{ padding: '40px', textAlign: 'center' }}>
        Insights page is working.
      </div>
    </section>
  )
}

export default InsightsPage