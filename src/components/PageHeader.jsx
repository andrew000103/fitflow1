function PageHeader({ eyebrow, title, description }) {
  return (
    <header className="page-header">
      {eyebrow ? <span className="page-eyebrow">{eyebrow}</span> : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </header>
  )
}

export default PageHeader
