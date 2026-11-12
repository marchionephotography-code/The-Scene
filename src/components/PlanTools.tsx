import { CalendarPlus, Car, Minus, Navigation, Plus, UtensilsCrossed, Wallet } from 'lucide-react'
import { useId, useState } from 'react'
import { APP_NAME } from '../config'
import { formatMoney } from '../lib/money'
import {
  dinnerNearby,
  dinnerSearchHref,
  directionsHref,
  googleCalendarHref,
  icsFile,
  parkingNote,
  paybackLine,
  paybackLinks,
  splitCost,
} from '../lib/plan'
import { detectPlatform } from '../lib/share'
import { readJSON, writeJSON } from '../lib/storage'
import type { SceneEvent } from '../types/event'

const HANDLES_KEY = 'scene.payHandles'

interface Props {
  event: SceneEvent
  allEvents: SceneEvent[]
  onOpenEvent: (id: string) => void
  /** Adds a line (the pay-back links) to the invite message. */
  onAddToMessage: (line: string) => void
}

function usd(cents: number) {
  return formatMoney({ amountCents: cents, currency: 'USD' })
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'event'
}

/** "Make it happen": calendar, directions, parking, dinner, and splitting the cost. */
export function PlanTools({ event, allEvents, onOpenEvent, onAddToMessage }: Props) {
  const [platform] = useState(() => detectPlatform())
  const [people, setPeople] = useState(2)
  const [handles, setHandles] = useState<{ venmo: string; cashapp: string }>(() =>
    readJSON(HANDLES_KEY, { venmo: '', cashapp: '' }),
  )
  const [added, setAdded] = useState(false)
  const id = useId()

  const dinner = event.category === 'food' ? [] : dinnerNearby(event, allEvents)
  const split = splitCost(event, people)
  const links = split.eachCents ? paybackLinks(handles, split.eachCents, event.title) : []

  const downloadIcs = () => {
    const blob = new Blob([icsFile(event, APP_NAME)], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug(event.title)}.ics`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  const setHandle = (k: 'venmo' | 'cashapp', v: string) => {
    const next = { ...handles, [k]: v }
    setHandles(next)
    writeJSON(HANDLES_KEY, next)
    setAdded(false)
  }

  return (
    <section className="plan" aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`} className="sheet__label">Make it happen</h3>

      <div className="plan__row">
        {platform === 'android' ? (
          <a className="plan-btn" href={googleCalendarHref(event)} target="_blank" rel="noopener noreferrer">
            <CalendarPlus size={18} strokeWidth={2.25} aria-hidden="true" />
            Add to calendar
          </a>
        ) : (
          <button type="button" className="plan-btn" onClick={downloadIcs}>
            <CalendarPlus size={18} strokeWidth={2.25} aria-hidden="true" />
            Add to calendar
          </button>
        )}
        <a className="plan-btn" href={directionsHref(event.location, event.venue, platform)} target="_blank" rel="noopener noreferrer">
          <Navigation size={18} strokeWidth={2.25} aria-hidden="true" />
          Directions
        </a>
      </div>

      {platform !== 'android' && (
        <p className="plan__alt">
          Use Google Calendar?{' '}
          <a href={googleCalendarHref(event)} target="_blank" rel="noopener noreferrer">Add it there</a>
        </p>
      )}

      <p className="plan__note">
        <Car size={16} strokeWidth={2.25} aria-hidden="true" />
        <span><strong>Parking:</strong> {parkingNote(event)}</span>
      </p>

      {event.category !== 'food' && (
        <div className="plan__block">
          <p className="plan__title"><UtensilsCrossed size={16} strokeWidth={2.25} aria-hidden="true" /> Dinner first?</p>
          {dinner.length > 0 && (
            <ul className="plan__list">
              {dinner.map((d) => (
                <li key={d.id}>
                  <button type="button" className="link-btn" onClick={() => onOpenEvent(d.id)}>{d.title}</button>
                  <span className="plan__meta"> · {d.venue}</span>
                </li>
              ))}
            </ul>
          )}
          <a className="link-btn" href={dinnerSearchHref(event.location, platform)} target="_blank" rel="noopener noreferrer">
            Find restaurants near {event.venue.replace(/ \(sample\)$/, '')}
          </a>
        </div>
      )}

      {split.eachCents !== null && split.eachCents > 0 && (
        <div className="plan__block">
          <p className="plan__title"><Wallet size={16} strokeWidth={2.25} aria-hidden="true" /> Buying tickets for the group?</p>
          <div className="plan__split">
            <div className="stepper" role="group" aria-label="How many people">
              <button type="button" aria-label="One fewer person" disabled={people <= 1} onClick={() => setPeople((n) => Math.max(1, n - 1))}>
                <Minus size={16} strokeWidth={2.5} aria-hidden="true" />
              </button>
              <span aria-live="polite">{people} {people === 1 ? 'person' : 'people'}</span>
              <button type="button" aria-label="One more person" disabled={people >= 20} onClick={() => setPeople((n) => Math.min(20, n + 1))}>
                <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
            <p className="plan__total">
              <strong>{usd(split.totalCents!)}</strong> total · {usd(split.eachCents)} each
              {event.price.max && event.price.max.amountCents !== event.price.min?.amountCents ? ' (cheapest seats)' : ''}
            </p>
          </div>
          <div className="plan__handles">
            <label className="field-label" htmlFor={`${id}-v`}>Your Venmo</label>
            <input id={`${id}-v`} className="input" placeholder="@username" autoComplete="off" value={handles.venmo} onChange={(e) => setHandle('venmo', e.target.value)} />
            <label className="field-label" htmlFor={`${id}-c`}>Your Cash App</label>
            <input id={`${id}-c`} className="input" placeholder="$cashtag" autoComplete="off" value={handles.cashapp} onChange={(e) => setHandle('cashapp', e.target.value)} />
          </div>
          <button
            type="button"
            className="btn"
            disabled={!links.length}
            onClick={() => {
              onAddToMessage(paybackLine(split.eachCents!, links))
              setAdded(true)
            }}
          >
            {added ? 'Added to your message' : 'Add pay-me-back links to the invite'}
          </button>
          <p className="hint">Saved on this device only. Friends tap the link to pay you their share.</p>
        </div>
      )}
    </section>
  )
}
