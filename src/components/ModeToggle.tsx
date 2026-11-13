import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { setChoice, type Theme } from '../lib/theme'

const current = (): Theme => (document.documentElement.dataset.sceneTheme === 'dark' ? 'dark' : 'light')

/** One-tap light/dark switch for the top bar. The You tab also has Auto. */
export function ModeToggle() {
  const [theme, setTheme] = useState<Theme>(current)
  useEffect(() => {
    const sync = () => setTheme(current())
    window.addEventListener('scene:theme', sync)
    const mq = matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', sync)
    return () => { window.removeEventListener('scene:theme', sync); mq.removeEventListener('change', sync) }
  }, [])
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      className="mode-toggle"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      onClick={() => setTheme(setChoice(dark ? 'light' : 'dark'))}
    >
      {dark ? <Sun size={19} strokeWidth={2.25} aria-hidden="true" /> : <Moon size={19} strokeWidth={2.25} aria-hidden="true" />}
    </button>
  )
}
