import { Cloud, CloudRain, Sun } from 'lucide-react'
import type { Recommendation } from '../lib/discovery'
import { formatPriceRange } from '../lib/money'
import { describe, RAINY, type Forecast, dayKey } from '../lib/weather'

interface Props {
  items: Recommendation[]
  forecast: Forecast | null
  now: Date
  onOpen: (id: string) => void
  onSeeAll: () => void
}

/** Fri/Sat/Sun dates for the coming (or current) weekend. */
function weekendDays(now: Date): Date[] {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dow = d.getDay()
  const toFri = dow === 0 ? -2 : dow === 6 ? -1 : 5 - dow
  return [0, 1, 2].map((i) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + toFri + i)).filter((x) => x >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
}

/** "This weekend": a quick lineup across the top of Explore, with the forecast. */
export function WeekendStrip({ items, forecast, now, onOpen, onSeeAll }: Props) {
  if (!items.length) return null
  const days = weekendDays(now)
  return (
    <section className="weekend" aria-labelledby="weekend-h">
      <div className="weekend__head">
        <h2 id="weekend-h" className="results__heading">This weekend</h2>
        <button type="button" className="link-btn" onClick={onSeeAll}>See all</button>
      </div>
      {forecast && (
        <ul className="weekend__wx" aria-label="Weekend forecast">
          {days.map((d) => {
            const f = forecast[dayKey(d)]
            if (!f) return null
            const wet = f.rainPct >= RAINY
            return (
              <li key={d.toISOString()} className={wet ? 'is-wet' : undefined}>
                <strong>{d.toLocaleDateString(undefined, { weekday: 'short' })}</strong>
                {wet ? <CloudRain size={15} strokeWidth={2.25} aria-hidden="true" /> : f.code <= 1 ? <Sun size={15} strokeWidth={2.25} aria-hidden="true" /> : <Cloud size={15} strokeWidth={2.25} aria-hidden="true" />}
                <span>{f.highF}°</span>
                {wet && <span className="weekend__wx-desc">{f.rainPct}% rain</span>}
                <span className="sr-only">{wet ? '' : describe(f.code)}</span>
              </li>
            )
          })}
        </ul>
      )}
      <ul className="weekend__row">
        {items.slice(0, 8).map(({ event: e }) => (
          <li key={e.id}>
            <button type="button" className={`wk wk--${e.category}`} onClick={() => onOpen(e.id)}>
              <span className="wk__day">
                {new Date(e.start).toLocaleDateString(undefined, { weekday: 'short' })}{' '}
                {new Date(e.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </span>
              <span className="wk__title">{e.title}</span>
              <span className="wk__meta">{e.town.replace(/, SC$/, '')} · {formatPriceRange(e.price)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
