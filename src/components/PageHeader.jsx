function PageHeader({ eyebrow, title, description }) {
  return (
    <header className="page-header">
      <span className="page-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  )
}

export default PageHeader
