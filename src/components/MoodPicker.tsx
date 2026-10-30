import {
  Laugh,
  Leaf,
  Palette,
  PartyPopper,
  Footprints,
  Music,
  Sparkles,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import type { UIEvent } from 'react'
import hero900 from '../assets/hero-900.webp'
import hero1800 from '../assets/hero-1800.webp'
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
      {/* Hero v2: a Tile S collage. The photo sits in one big quarter-round tile,
          with brand-color tiles carrying the headline and two small icons. */}
      <div className="collage">
        <div className="collage__photo">
          <img
            src={hero900}
            srcSet={`${hero900} 900w, ${hero1800} 1800w`}
            sizes="(min-width: 760px) 640px, 100vw"
            alt=""
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="collage__tile collage__tile--a" aria-hidden="true">
          <Music size={30} strokeWidth={2.25} />
        </div>
        <div className="collage__tile collage__tile--b" aria-hidden="true">
          <Sparkles size={30} strokeWidth={2.25} />
        </div>
        <div className="collage__head">
          <h1 id="mood-heading" className="title collage__title">What do you feel like doing?</h1>
          <p className="collage__sub">Find something fun nearby, then plan it together.</p>
        </div>
      </div>
      <div
        className="moods__grid"
        onScroll={(e: UIEvent<HTMLDivElement>) => {
          // Drop the "more this way" fade once the row is scrolled to its end.
          const el = e.currentTarget
          el.toggleAttribute('data-at-end', el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
        }}
      >
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
