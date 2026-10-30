import {
  Brush,
  CakeSlice,
  Check,
  Clapperboard,
  Coffee,
  Drama,
  Drum,
  BookOpen,
  Frame,
  Heart,
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
import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, formatMiles, type Recommendation } from '../lib/discovery'
import { formatPriceRange, PRICE_STATUS_LABEL } from '../lib/money'
import { prefersReducedMotion } from '../lib/motion'
import { photoFor } from '../data/eventPhotos'
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

/**
 * The cover icon draws its own linework the first time the card scrolls into
 * view. The icon is fully drawn by default; it is only hidden ("armed") once
 * an observer is in place to reveal it, so nothing stays blank if JS or
 * IntersectionObserver is unavailable.
 */
function useDrawOnView() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return
    el.dataset.draw = 'armed'
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.draw = 'go'
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

interface CardProps {
  rec: Recommendation
  now: Date
  favorite: boolean
  onToggleFavorite: () => void
  onOpen: () => void
}

function dayParts(startIso: string, now: Date) {
  const d = new Date(startIso)
  const diff = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86_400_000,
  )
  return {
    top: diff === 0 ? 'Today' : diff === 1 ? 'Tmrw' : d.toLocaleDateString(undefined, { weekday: 'short' }),
    day: d.getDate(),
    month: d.toLocaleDateString(undefined, { month: 'short' }),
    soon: diff <= 1,
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  }
}

/** Reasons already shown elsewhere on the card don't need repeating. */
const SHOWN_ON_CARD = new Set(['local pick', 'library event'])

export function EventCard({ rec, now, favorite, onToggleFavorite, onOpen }: CardProps) {
  const { event, miles, reasons } = rec
  const category = CATEGORIES.find((c) => c.id === event.category)!.label
  const h = hash(event.id + event.title)
  const icons = CATEGORY_ICONS[event.category]
  const Icon = icons[h % icons.length]
  const coverRef = useDrawOnView()
  // Number in the id (sample-7 → 7) keeps neighbouring cards on different photos.
  // The event's own photo comes first; a broken or missing one falls back to the tile art.
  const [photoFailed, setPhotoFailed] = useState(false)
  const photo = photoFailed ? null : (event.image ?? photoFor(event.category, Number(event.id.match(/\d+/)?.[0] ?? h)))

  const when = dayParts(event.start, now)
  const extraReasons = reasons.filter((r) => !SHOWN_ON_CARD.has(r))
  const isLibrary = event.host?.kind === 'library'

  return (
    <article className="card" aria-labelledby={`${event.id}-title`}>
      <div className="card__media">
        {photo ? (
          <div className="cover cover--photo" aria-hidden="true">
            <img
              className="cover__photo"
              src={photo}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setPhotoFailed(true)}
            />
          </div>
        ) : (
          <div ref={coverRef} className={`cover cover--tiles tiles--${event.category} tiles--c${h % 3}`} aria-hidden="true">
            <span className="tiles__main">
              <Icon className="cover__icon" strokeWidth={1.75} />
            </span>
            <span className="tiles__chip" />
          </div>
        )}
        <span className="card__cat">{category}</span>
        <button
          type="button"
          className={`heart${favorite ? ' heart--on' : ''}`}
          aria-pressed={favorite}
          aria-label={favorite ? `Remove ${event.title} from favorites` : `Add ${event.title} to favorites`}
          onClick={onToggleFavorite}
        >
          <Heart size={20} strokeWidth={2.25} fill={favorite ? 'currentColor' : 'rgba(0,0,0,0.25)'} aria-hidden="true" />
        </button>
        <span className={`stub${when.soon ? ' stub--soon' : ''}`} aria-hidden="true">
          <span className="stub__top">{when.top}</span>
          <span className="stub__day">{when.day}</span>
          <span className="stub__month">{when.month}</span>
        </span>
      </div>

      <div className="card__body">
        <h3 id={`${event.id}-title`} className="card__title">
          {/* Stretched button: the whole card opens the details. */}
          <button type="button" className="card__open" onClick={onOpen}>{event.title}</button>
        </h3>
        <p className="card__when">
          <span className="sr-only">{formatWhen(event.start, now)}, </span>
          <strong aria-hidden="true">{when.time}</strong>
          <span className="card__where">
            {event.venue} · {event.town}
            {miles !== null && <> · {formatMiles(miles)}</>}
          </span>
        </p>
        <p className="card__desc">{event.description}</p>
        <div className="card__foot">
          <p className="card__price">
            <strong>{formatPriceRange(event.price)}</strong>
            <span className={`status status--${event.price.status}`}>{PRICE_STATUS_LABEL[event.price.status]}</span>
          </p>
          <p className="card__tags">
            {isLibrary ? (
              <span className="tag-pill"><BookOpen size={13} strokeWidth={2.5} aria-hidden="true" /> Library</span>
            ) : event.local ? (
              <span className="tag-pill"><Sparkles size={13} strokeWidth={2.5} aria-hidden="true" /> Local</span>
            ) : null}
            <span className="tag-pill tag-pill--quiet">{AGE_TEXT[event.age]}</span>
          </p>
        </div>
        {extraReasons.length > 0 && (
          <p className="card__why">
            <Check size={14} strokeWidth={2.75} aria-hidden="true" />
            <span><span className="sr-only">Matches: </span>{extraReasons.join(' · ')}</span>
          </p>
        )}
      </div>
    </article>
  )
}
