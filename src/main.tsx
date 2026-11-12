import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource-variable/figtree'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './index.css'
import App from './App.tsx'
import { installLinkGuard } from './lib/links'
import { ErrorBoundary } from './components/ErrorBoundary'
import { reportError, startMonitoring } from './lib/monitoring'
import { applyTheme, watchSystemTheme } from './lib/theme'

startMonitoring()
window.addEventListener('unhandledrejection', (e) => reportError(e.reason, 'promise'))

installLinkGuard()

// Earthy version: aurora card art in the earth palette.
document.documentElement.dataset.art = 'a'
document.documentElement.dataset.pal = 'earth'
applyTheme()
watchSystemTheme()


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Offline support and installability, on the real site only (not in dev or embedded previews).
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext && window.top === window.self) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
