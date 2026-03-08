import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

import { ThemeProvider } from './contexts/ThemeContext'

// Preconnect to backend for faster first chat/TTS request
;(function () {
  const u = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/api\/chat\/?$/, '')
  const url = u.startsWith('http') ? u : 'http://' + u
  try {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = new URL(url).origin
    document.head.appendChild(link)
  } catch {}
})()
import { AuthProvider } from './contexts/AuthContext'
import { initErrorTracking } from './lib/errorTracking'
import { initAnalytics } from './lib/analytics'

initErrorTracking()
initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
