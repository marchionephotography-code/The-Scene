import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource-variable/figtree'
import './index.css'
import App from './App.tsx'

// Mockup switch for card artwork: ?art=a|b|c (temporary).
const artLook = new URLSearchParams(window.location.search).get('art')
if (artLook) document.documentElement.dataset.art = artLook


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Offline support and installability, on the real site only (not in dev or embedded previews).
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext && window.top === window.self) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
