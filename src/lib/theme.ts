/**
 * Light and dark mode. "auto" follows the phone or computer's setting.
 * The choice is kept on this device; public/theme.js applies it before the
 * page paints so there's no flash of the wrong colors.
 */
export type ThemeChoice = 'auto' | 'light' | 'dark'
export type Theme = 'light' | 'dark'

export const THEME_KEY = 'scene:theme'
export const THEME_COLORS: Record<Theme, string> = { light: '#F4EFE6', dark: '#17190F' }

export function readChoice(storage: Pick<Storage, 'getItem'> | null = safeStorage()): ThemeChoice {
  try {
    const v = storage?.getItem(THEME_KEY)
    return v === 'light' || v === 'dark' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

/** Auto follows the host's own setting (e.g. the Claude viewer's data-theme) when there is one, else the system. */
export function resolveTheme(choice: ThemeChoice, systemDark: boolean, host: Theme | null = null): Theme {
  if (choice !== 'auto') return choice
  return host ?? (systemDark ? 'dark' : 'light')
}

function hostTheme(): Theme | null {
  const v = typeof document === 'undefined' ? null : document.documentElement.getAttribute('data-theme')
  return v === 'dark' || v === 'light' ? v : null
}

function systemDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
}

function safeStorage(): Storage | null {
  try { return localStorage } catch { return null }
}

export function applyTheme(choice: ThemeChoice = readChoice()): Theme {
  const theme = resolveTheme(choice, systemDark(), hostTheme())
  const root = document.documentElement
  root.dataset.sceneTheme = theme
  root.style.colorScheme = theme
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) meta.content = THEME_COLORS[theme]
  return theme
}

export function setChoice(choice: ThemeChoice): Theme {
  try {
    if (choice === 'auto') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, choice)
  } catch { /* private mode: still applies for this visit */ }
  const theme = applyTheme(choice)
  window.dispatchEvent(new CustomEvent('scene:theme', { detail: choice }))
  return theme
}

/** Keep "auto" in step when the system setting changes. */
export function watchSystemTheme(): () => void {
  if (typeof matchMedia !== 'function') return () => {}
  const mq = matchMedia('(prefers-color-scheme: dark)')
  const on = () => {
    if (readChoice() !== 'auto') return
    applyTheme('auto')
    window.dispatchEvent(new CustomEvent('scene:theme', { detail: 'auto' }))
  }
  mq.addEventListener('change', on)
  const mo = typeof MutationObserver === 'function' ? new MutationObserver(on) : null
  mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => { mq.removeEventListener('change', on); mo?.disconnect() }
}
