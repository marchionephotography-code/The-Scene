import { CATEGORIES, formatMiles, type Recommendation } from '../lib/discovery'
import { formatPriceRange, PRICE_STATUS_LABEL } from '../lib/money'

const AGE_TEXT = { 'all-ages': 'All ages', family: 'Family friendly', '18+': '18+', '21+': '21+' } as const

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

export function EventCard({ rec, now }: { rec: Recommendation; now: Date }) {
  const { event, miles, reasons } = rec
  const category = CATEGORIES.find((c) => c.id === event.category)!.label
  return (
    <article className="card" aria-labelledby={`${event.id}-title`}>
      <div className="card__top">
        <span className={`card__cat card__cat--${event.category}`}>{category}</span>
        {event.local && <span className="card__local">Local pick</span>}
      </div>
      <h3 id={`${event.id}-title`} className="card__title">{event.title}</h3>
      <p className="card__when">{formatWhen(event.start, now)}</p>
      <p className="card__where">
        {event.venue} · {event.town}
        {miles !== null && <> · {formatMiles(miles)}</>}
      </p>
      <p className="card__desc">{event.description}</p>
      <div className="card__meta">
        <span className="card__price">
          {formatPriceRange(event.price)}{' '}
          <span className={`status status--${event.price.status}`}>{PRICE_STATUS_LABEL[event.price.status]}</span>
        </span>
        <span className="card__age">{AGE_TEXT[event.age]}</span>
      </div>
      {reasons.length > 0 && (
        <p className="card__why">
          <span className="card__why-label">Matches:</span> {reasons.join(', ')}
        </p>
      )}
    </article>
  )
}
