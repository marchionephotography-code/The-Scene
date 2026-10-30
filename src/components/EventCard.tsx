import {
  Brush,
  CakeSlice,
  Check,
  Clapperboard,
  Coffee,
  Drama,
  Drum,
  Frame,
  Guitar,
  Medal,
  Mic,
  Mountain,
  Music,
  Palette,
  Pizza,
  Popcorn,
  Rocket,
  Sailboat,
  Smile,
  Sparkles,
  Tent,
  Ticket,
  Trees,
  Trophy,
  UtensilsCrossed,
  Volleyball,
  type LucideIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { CATEGORIES, formatMiles, type Recommendation } from '../lib/discovery'
import { formatPriceRange, PRICE_STATUS_LABEL } from '../lib/money'
import type { Category } from '../types/event'

const AGE_TEXT = { 'all-ages': 'All ages', family: 'Family friendly', '18+': '18+', '21+': '21+' } as const

/** A few icons per category; each event picks one so covers don't repeat. */
const CATEGORY_ICONS: Record<Category, LucideIcon[]> = {
  music: [Music, Guitar, Mic, Drum],
  sports: [Trophy, Volleyball, Medal],
  shows: [Drama, Ticket, Clapperboard],
  arts: [Palette, Brush, Frame],
  food: [UtensilsCrossed, Coffee, Pizza, CakeSlice],
  outdoors: [Trees, Mountain, Tent, Sailboat],
  family: [Smile, Popcorn, Rocket],
}

function formatWhen(startIso: string, now: Date): string {
  const start = new Date(startIso)
  const time = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const dayDiff = Math.round(
    (new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86_400_000,
  )
  const day =
    dayDiff === 0 ? 'Today'
    : dayDiff === 1 ? 'Tomorrow'
    : start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  return `${day} · ${time}`
}

/** Small per-event variation so covers in the same category don't look identical. */
function hash(s: string): number {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 9973
  return h
}

export function EventCard({ rec, now }: { rec: Recommendation; now: Date }) {
  const { event, miles, reasons } = rec
  const category = CATEGORIES.find((c) => c.id === event.category)!.label
  const h = hash(event.id + event.title)
  const icons = CATEGORY_ICONS[event.category]
  const Icon = icons[h % icons.length]

  return (
    <article className="card" aria-labelledby={`${event.id}-title`}>
      <div className="card__media">
        <div
          className={`cover cover--${event.category} cover--v${h % 3}`}
          style={{ '--tilt': `${115 + (h % 70)}deg` } as CSSProperties}
          aria-hidden="true"
        >
          <Icon className="cover__icon" strokeWidth={1.25} />
        </div>
        {event.local && (
          <span className="card__badge">
            <Sparkles size={13} strokeWidth={2.5} aria-hidden="true" /> Local pick
          </span>
        )}
      </div>

      <div className="card__body">
        <p className="card__cat">{category}</p>
        <h3 id={`${event.id}-title`} className="card__title">{event.title}</h3>
        <p className="card__line card__line--strong">{formatWhen(event.start, now)}</p>
        <p className="card__line">
          {event.venue} · {event.town}
          {miles !== null && <> · {formatMiles(miles)}</>}
        </p>
        <p className="card__desc">{event.description}</p>
        <p className="card__price">
          <strong>{formatPriceRange(event.price)}</strong>
          <span className={`status status--${event.price.status}`}>{PRICE_STATUS_LABEL[event.price.status]}</span>
          <span className="card__dot" aria-hidden="true">·</span>
          <span className="card__age">{AGE_TEXT[event.age]}</span>
        </p>
        {reasons.length > 0 && (
          <p className="card__why">
            <Check size={14} strokeWidth={2.75} aria-hidden="true" />
            <span><span className="sr-only">Matches: </span>{reasons.join(' · ')}</span>
          </p>
        )}
      </div>
    </article>
  )
}
