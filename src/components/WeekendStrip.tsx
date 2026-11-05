import { Cloud, CloudRain, Drama, Mountain, Music, Palette, Smile, Sun, Trophy, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { Recommendation } from '../lib/discovery'
import { formatPriceRange } from '../lib/money'
import { describe, RAINY, type Forecast, dayKey } from '../lib/weather'
import type { Category } from '../types/event'

interface Props {
  items: Recommendation[]
  forecast: Forecast | null
  now: Date
  onOpen: (id: string) => void
  onSeeAll: () => void
  /** Shows every event on one day ("YYYY-MM-DD"). */
  onSeeDay: (day: string) => void
}

const ICON: Record<Category, LucideIcon> = {
  music: Music, sports: Trophy, shows: Drama, arts: Palette, food: UtensilsCrossed, outdoors: Mountain, family: Smile,
}

/** How many events a day shows before "See all". */
const PER_DAY = 3

/** Fri/Sat/Sun of the coming (or current) weekend, skipping days already past. */
function weekendDays(now: Date): Date[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dow = today.getDay()
  const toFri = dow === 0 ? -2 : dow === 6 ? -1 : 5 - dow
  return [0, 1, 2]
    .map((i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + toFri + i))
    .filter((x) => x >= today)
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(':00', '')

/**
 * "This weekend": Fri / Sat / Sun tabs that carry the forecast, and the top
 * few events for the chosen day as compact rows.
 */
export function WeekendStrip({ items, forecast, now, onOpen, onSeeAll, onSeeDay }: Props) {
  const days = weekendDays(now)
  const byDay = days.map((d) => items.filter((r) => dayKey(new Date(r.event.start)) === dayKey(d)))
  const firstWithEvents = Math.max(0, byDay.findIndex((l) => l.length > 0))
  const [picked, setPicked] = useState<number | null>(null)
  const active = picked ?? firstWithEvents

  if (!items.length) return null
  const list = byDay[active] ?? []
  const more = list.length - PER_DAY

  return (
    <section className="weekend" aria-labelledby="weekend-h">
      <div className="weekend__head">
        <h2 id="weekend-h" className="results__heading">This weekend</h2>
        <button type="button" className="link-btn" onClick={onSeeAll}>See all</button>
      </div>

      <div className="wkd" role="tablist" aria-label="Weekend days">
        {days.map((d, i) => {
          const f = forecast?.[dayKey(d)]
          const wet = !!f && f.rainPct >= RAINY
          const on = i === active
          return (
            <button
              key={d.toISOString()}
              type="button"
              role="tab"
              id={`wkd-${i}`}
              aria-selected={on}
              aria-controls="wkd-panel"
              className={`wkd__tab${on ? ' is-on' : ''}${wet ? ' is-wet' : ''}`}
              onClick={() => setPicked(i)}
            >
              <strong>{d.toLocaleDateString(undefined, { weekday: 'short' })}</strong>
              {f && (
                <>
                  {wet ? <CloudRain size={15} strokeWidth={2.25} aria-hidden="true" /> : f.code <= 1 ? <Sun size={15} strokeWidth={2.25} aria-hidden="true" /> : <Cloud size={15} strokeWidth={2.25} aria-hidden="true" />}
                  <span>{f.highF}°</span>
                  {wet && <span className="wkd__rain">{f.rainPct}% rain</span>}
                  <span className="sr-only">{wet ? ' rain likely' : ` ${describe(f.code)}`}</span>
                </>
              )}
            </button>
          )
        })}
      </div>

      <div id="wkd-panel" role="tabpanel" aria-labelledby={`wkd-${active}`} className="wkl">
        {list.length === 0 ? (
          <p className="hint">Nothing on this day yet. Try another day.</p>
        ) : (
          <ul key={active}>
            {list.slice(0, PER_DAY).map(({ event: e }) => {
              const Icon = ICON[e.category]
              return (
                <li key={e.id}>
                  <button type="button" className="wkl__row" onClick={() => onOpen(e.id)}>
                    <span className={`wkl__icon wkc--${e.category}`}><Icon size={18} strokeWidth={2.25} aria-hidden="true" /></span>
                    <span className="wkl__time">{time(e.start)}</span>
                    <span className="wkl__title">{e.title}</span>
                    <span className="wkl__meta">{e.town.replace(/, SC$/, '')} · {formatPriceRange(e.price)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {more > 0 && (
          <button type="button" className="link-btn wkl__more" onClick={() => onSeeDay(dayKey(days[active]))}>
            +{more} more on {days[active].toLocaleDateString(undefined, { weekday: 'long' })}
          </button>
        )}
      </div>
    </section>
  )
}
