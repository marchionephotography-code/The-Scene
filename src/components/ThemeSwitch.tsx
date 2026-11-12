import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { readChoice, setChoice, type ThemeChoice } from '../lib/theme'

const OPTIONS: { id: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'auto', label: 'Auto', Icon: Monitor },
]

/** Light / Dark / Auto, as one segmented control. */
export function ThemeSwitch() {
  const id = useId()
  const [choice, setLocal] = useState<ThemeChoice>(() => readChoice())
  useEffect(() => {
    const on = (e: Event) => setLocal((e as CustomEvent<ThemeChoice>).detail)
    window.addEventListener('scene:theme', on)
    return () => window.removeEventListener('scene:theme', on)
  }, [])
  return (
    <fieldset className="seg">
      <legend className="sr-only">Appearance</legend>
      {OPTIONS.map(({ id: opt, label, Icon }) => (
        <label key={opt} className="seg__opt">
          <input type="radio" name={`${id}-theme`} value={opt} checked={choice === opt} onChange={() => { setLocal(opt); setChoice(opt) }} />
          <Icon size={16} strokeWidth={2.25} aria-hidden="true" />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  )
}
