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

export function resolveTheme(choice: ThemeChoice, systemDark: boolean): Theme {
  return choice === 'auto' ? (systemDark ? 'dark' : 'light') : choice
}

function systemDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
}

function safeStorage(): Storage | null {
  try { return localStorage } catch { return null }
}

export function applyTheme(choice: ThemeChoice = readChoice()): Theme {
  const theme = resolveTheme(choice, systemDark())
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
  const on = () => { if (readChoice() === 'auto') applyTheme('auto') }
  mq.addEventListener('change', on)
  return () => mq.removeEventListener('change', on)
}
