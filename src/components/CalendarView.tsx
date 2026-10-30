import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import {
  addDays,
  addMonths,
  dayKey,
  formatWeekRange,
  monthGrid,
  sameDay,
  startOfDay,
  weekDays,
  type CalendarMode,
} from '../lib/calendar'
import type { Recommendation } from '../lib/discovery'
import { formatPriceRange } from '../lib/money'

interface Props {
  /** Already filtered by mood/category/price/etc., but not by date. */
  items: Recommendation[]
  now: Date
  mode: CalendarMode
  selected: Date
  onMode: (m: CalendarMode) => void
  onSelect: (d: Date) => void
  onOpen: (eventId: string) => void
}

const MODES: { id: CalendarMode; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function CalendarView({ items, now, mode, selected, onMode, onSelect, onOpen }: Props) {
  const byDay = useMemo(() => {
    const m = new Map<string, Recommendation[]>()
    for (const r of items) {
      const k = dayKey(new Date(r.event.start))
      const list = m.get(k) ?? []
      list.push(r)
      m.set(k, list)
    }
    for (const list of m.values()) list.sort((a, b) => a.event.start.localeCompare(b.event.start))
    return m
  }, [items])

  const today = startOfDay(now)
  const week = weekDays(selected)

  const step = (dir: -1 | 1) => {
    if (mode === 'day') onSelect(addDays(selected, dir))
    else if (mode === 'week') onSelect(addDays(selected, dir * 7))
    else onSelect(addMonths(selected, dir))
  }

  const heading =
    mode === 'day'
      ? selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
      : mode === 'week'
        ? formatWeekRange(week)
        : selected.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const stepLabel = mode === 'day' ? 'day' : mode === 'week' ? 'week' : 'month'

  return (
    <section className="cal" aria-labelledby="cal-heading">
      <h1 className="title">Your calendar</h1>

      <div className="segmented" role="group" aria-label="Calendar view">
        {MODES.map((m) => (
          <button key={m.id} type="button" className={`segmented__btn${mode === m.id ? ' segmented__btn--on' : ''}`} aria-pressed={mode === m.id} onClick={() => onMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="cal__nav">
        <button type="button" className="icon-btn icon-btn--ring" onClick={() => step(-1)} aria-label={`Previous ${stepLabel}`}>
          <ChevronLeft size={20} strokeWidth={2.25} aria-hidden="true" />
        </button>
        <h2 id="cal-heading" className="cal__heading" aria-live="polite">{heading}</h2>
        <button type="button" className="icon-btn icon-btn--ring" onClick={() => step(1)} aria-label={`Next ${stepLabel}`}>
          <ChevronRight size={20} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>
      {!sameDay(selected, today) && (
        <button type="button" className="link-btn cal__today" onClick={() => onSelect(today)}>Jump to today</button>
      )}

      {mode !== 'month' && (
        <div className="week" role="group" aria-label="Pick a day">
          {week.map((d) => {
            const on = sameDay(d, selected)
            const count = byDay.get(dayKey(d))?.length ?? 0
            return (
              <button
                key={dayKey(d)}
                type="button"
                className={`week__day${on ? ' week__day--on' : ''}${sameDay(d, today) ? ' week__day--today' : ''}`}
                aria-pressed={on}
                aria-label={`${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}, ${count} ${count === 1 ? 'idea' : 'ideas'}`}
                onClick={() => onSelect(d)}
              >
                <span className="week__dow">{d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                <span className="week__num">{d.getDate()}</span>
                <span className="week__dots" aria-hidden="true">
                  {Array.from({ length: Math.min(count, 3) }, (_, i) => <i key={i} />)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {mode === 'month' && (
        <div className="month">
          <div className="month__dow" aria-hidden="true">
            {weekDays(today).map((d) => <span key={d.getDay()}>{d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>)}
          </div>
          <div className="month__grid" role="group" aria-label="Pick a day">
            {monthGrid(selected).map((d) => {
              const inMonth = d.getMonth() === selected.getMonth()
              const on = sameDay(d, selected)
              const count = byDay.get(dayKey(d))?.length ?? 0
              return (
                <button
                  key={dayKey(d)}
                  type="button"
                  className={`month__day${on ? ' month__day--on' : ''}${inMonth ? '' : ' month__day--out'}${sameDay(d, today) ? ' month__day--today' : ''}`}
                  aria-pressed={on}
                  aria-label={`${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}, ${count} ${count === 1 ? 'idea' : 'ideas'}`}
                  onClick={() => onSelect(d)}
                >
                  <span className="month__num">{d.getDate()}</span>
                  {count > 0 && <span className="month__count">{count}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="agenda">
        {mode === 'week' && week[6] < today && (
          <p className="agenda__empty">This week has passed. Use the arrows to look ahead.</p>
        )}
        {mode === 'week' && week[0] < today && week[6] >= today && (
          <p className="agenda__note">Earlier days this week have passed, so they're hidden.</p>
        )}
        {(mode === 'week' ? week.filter((d) => d >= today) : [selected]).map((d) => {
          const list = byDay.get(dayKey(d)) ?? []
          const on = mode === 'week' && sameDay(d, selected)
          return (
            <div key={dayKey(d)} className={`agenda__day${on ? ' agenda__day--on' : ''}`}>
              <h3 className="agenda__date">
                {sameDay(d, today) ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              {list.length === 0 ? (
                <p className="agenda__empty">
                  {d < today ? 'This day has passed.' : 'Nothing here with your filters. Try another day or fewer filters.'}
                </p>
              ) : (
                <ul className="agenda__list">
                  {list.map((r) => (
                    <li key={r.event.id}>
                      <button type="button" className={`agenda__item agenda__item--${r.event.category}`} onClick={() => onOpen(r.event.id)}>
                        <span className="agenda__time">{timeOf(r.event.start)}</span>
                        <span className="agenda__text">
                          <span className="agenda__title">{r.event.title}</span>
                          <span className="agenda__meta">{r.event.town} · {formatPriceRange(r.event.price)}</span>
                        </span>
                        <ChevronRight size={18} strokeWidth={2.25} className="agenda__chev" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
