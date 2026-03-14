import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { captureRecoveryTokensFromUrl } from './features/auth/authRecovery.js'
import './index.css'
import App from './App.jsx'

captureRecoveryTokensFromUrl()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
