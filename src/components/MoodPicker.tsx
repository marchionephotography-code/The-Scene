import {
  Laugh,
  Leaf,
  Palette,
  PartyPopper,
  Footprints,
  Sparkles,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import { MOODS, type MoodId } from '../lib/discovery'

const ICONS: Record<MoodId, LucideIcon> = {
  chill: Leaf,
  lively: PartyPopper,
  laugh: Laugh,
  creative: Palette,
  active: Footprints,
  family: Users,
  date: Sparkles,
  eat: UtensilsCrossed,
}

interface Props {
  value: MoodId | null
  onChange: (mood: MoodId | null) => void
}

export function MoodPicker({ value, onChange }: Props) {
  return (
    <section aria-labelledby="mood-heading" className="moods">
      <h1 id="mood-heading" className="title">What do you feel like doing?</h1>
      <div className="moods__grid">
        {MOODS.map((m) => {
          const on = value === m.id
          const Icon = ICONS[m.id]
          return (
            <button
              key={m.id}
              type="button"
              className={`mood${on ? ' mood--on' : ''}`}
              aria-pressed={on}
              onClick={() => onChange(on ? null : m.id)}
            >
              <span className="mood__tile">
                <Icon size={26} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="mood__label">{m.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
