import { Cloud, CloudRain, Drama, Mountain, Music, Palette, Smile, Sun, Trophy, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { Category, SceneEvent } from '../types/event'
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

const ICON: Record<Category, LucideIcon> = {
  music: Music, sports: Trophy, shows: Drama, arts: Palette, food: UtensilsCrossed, outdoors: Mountain, family: Smile,
}

/** Mockup switch: ?wk=stub | tile | list (temporary, for choosing a look). */
type Look = 'stub' | 'tile' | 'list'
function lookFromUrl(): Look {
  const v = new URLSearchParams(window.location.search).get('wk')
  return v === 'tile' || v === 'list' ? v : 'stub'
}

const wd = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short' })
const tm = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(':00', '')
const town = (e: SceneEvent) => e.town.replace(/, SC$/, '')

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
  const look = lookFromUrl()
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
      {look === 'list' ? (
        <div className="wkl">
          {days.map((d) => {
            const list = items.filter((r) => dayKey(new Date(r.event.start)) === dayKey(d)).slice(0, 3)
            if (!list.length) return null
            return (
              <div key={d.toISOString()} className="wkl__day">
                <p className="wkl__label">{d.toLocaleDateString(undefined, { weekday: 'long' })}</p>
                <ul>
                  {list.map(({ event: e }) => {
                    const Icon = ICON[e.category]
                    return (
                      <li key={e.id}>
                        <button type="button" className="wkl__row" onClick={() => onOpen(e.id)}>
                          <span className={`wkl__icon wkc--${e.category}`}><Icon size={18} strokeWidth={2.25} aria-hidden="true" /></span>
                          <span className="wkl__time">{tm(e.start)}</span>
                          <span className="wkl__title">{e.title}</span>
                          <span className="wkl__meta">{town(e)} · {formatPriceRange(e.price)}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      ) : (
        <ul className="weekend__row">
          {items.slice(0, 8).map(({ event: e }) => {
            const Icon = ICON[e.category]
            return (
              <li key={e.id}>
                {look === 'stub' ? (
                  <button type="button" className={`wks wkc--${e.category}`} onClick={() => onOpen(e.id)}>
                    <span className="wks__stub">
                      <span className="wks__wd">{wd(e.start)}</span>
                      <span className="wks__tm">{tm(e.start)}</span>
                    </span>
                    <span className="wks__body">
                      <span className="wks__title">{e.title}</span>
                      <span className="wks__meta">{town(e)} · {formatPriceRange(e.price)}</span>
                    </span>
                  </button>
                ) : (
                  <button type="button" className={`wkt wkc--${e.category}`} onClick={() => onOpen(e.id)}>
                    <span className="wkt__art" aria-hidden="true">
                      <span className="wkt__shape"><Icon size={26} strokeWidth={2} /></span>
                      <span className="wkt__when">{wd(e.start)} · {tm(e.start)}</span>
                    </span>
                    <span className="wkt__title">{e.title}</span>
                    <span className="wkt__meta">{town(e)} · {formatPriceRange(e.price)}</span>
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
