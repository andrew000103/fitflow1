import '../styles/loader.css'

function BrandLoader({ fullScreen = true }) {
  return (
    <div className={fullScreen ? 'brand-loader-shell full-screen' : 'brand-loader-shell'}>
      <div className="brand-loader-mark" aria-label="FitFlow loading" role="img">
        <span>FF</span>
      </div>
    </div>
  )
}

export default BrandLoader
