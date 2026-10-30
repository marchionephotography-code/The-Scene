import { CalendarDays, Compass, Heart, type LucideIcon } from 'lucide-react'

export type Tab = 'explore' | 'calendar' | 'saved'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'saved', label: 'Saved', icon: Heart },
]

interface Props {
  tab: Tab
  savedCount: number
  onChange: (t: Tab) => void
}

/** Bottom bar on phones, inline in the header on wider screens. */
export function TabBar({ tab, savedCount, onChange }: Props) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ id, label, icon: Icon }) => {
        const on = tab === id
        return (
          <button
            key={id}
            type="button"
            className={`tabbar__btn${on ? ' tabbar__btn--on' : ''}`}
            aria-current={on ? 'page' : undefined}
            onClick={() => onChange(id)}
          >
            <span className="tabbar__icon">
              <Icon size={22} strokeWidth={on ? 2.5 : 2} aria-hidden="true" />
              {id === 'saved' && savedCount > 0 && (
                <span key={savedCount} className="tabbar__count" aria-hidden="true">{savedCount}</span>
              )}
            </span>
            <span className="tabbar__label">
              {label}
              {id === 'saved' && savedCount > 0 && <span className="sr-only">, {savedCount} saved</span>}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
