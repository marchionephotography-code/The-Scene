import { Check, Globe2, MapPin, Navigation, Search, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { SAMPLE_TOWNS } from '../data/sampleEvents'
import type { LocationState } from '../hooks/useLocation'
import { NEARBY_CITIES, searchPlaces, type Place } from '../lib/geocode'
import type { GeoPoint } from '../types/event'

interface Props {
  state: LocationState
  onUseDevice: () => void
  onPickTown: (label: string, point: GeoPoint) => void
  /** Back to every city in the region. */
  onClear: () => void
}

type Search = { status: 'idle' } | { status: 'loading' } | { status: 'done'; places: Place[] } | { status: 'error' }

/**
 * Where to look: any US city by search, your current location, the whole
 * region, Upstate towns, or a city a day trip away.
 */
export function LocationBar({ state, onUseDevice, onPickTown, onClear }: Props) {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState<Search>({ status: 'idle' })
  const id = useId()
  const picked = state.status === 'manual' ? state.label : null

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    const ctl = new AbortController()
    const t = window.setTimeout(() => {
      setSearch({ status: 'loading' })
      searchPlaces(q, ctl.signal).then(
        (places) => setSearch({ status: 'done', places }),
        (err) => { if (!ctl.signal.aborted) { setSearch({ status: 'error' }); void err } },
      )
    }, 300)
    return () => { window.clearTimeout(t); ctl.abort() }
  }, [query])

  const deviceOn = state.status === 'device'
  const deviceSub =
    state.status === 'locating' ? 'Finding you…'
    : state.status === 'device' ? 'Using your location'
    : state.status === 'denied' || state.status === 'unavailable' ? state.message
    : 'Asks your browser for permission'

  const row = (label: string, point: GeoPoint, sub?: string) => {
    const on = picked === label
    return (
      <li key={label}>
        <button type="button" className="row" aria-pressed={on} onClick={() => onPickTown(label, point)}>
          <span className="row__icon"><MapPin size={18} strokeWidth={2.25} aria-hidden="true" /></span>
          <span className="row__text">
            <span className="row__main">{label}</span>
            {sub && <span className="row__sub">{sub}</span>}
          </span>
          {on && <Check size={20} strokeWidth={2.5} className="row__check" aria-hidden="true" />}
        </button>
      </li>
    )
  }

  const searching = query.trim().length >= 2

  return (
    <div className="where">
      <div className="where__search">
        <Search size={18} strokeWidth={2.25} aria-hidden="true" />
        <label className="sr-only" htmlFor={`${id}-q`}>Search for a city</label>
        <input
          id={`${id}-q`}
          className="where__input"
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Search any city"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.trim().length < 2) setSearch({ status: 'idle' })
          }}
        />
        {query && (
          <button type="button" className="where__clear" aria-label="Clear search" onClick={() => { setQuery(''); setSearch({ status: 'idle' }) }}>
            <X size={16} strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
      </div>

      {searching ? (
        <div aria-live="polite">
          {search.status === 'loading' && <p className="hint">Searching…</p>}
          {search.status === 'error' && <p className="hint">City search isn’t reachable right now. Pick a city below instead.</p>}
          {search.status === 'done' && search.places.length === 0 && <p className="hint">No US city by that name. Check the spelling?</p>}
          {search.status === 'done' && search.places.length > 0 && (
            <ul className="rows" aria-label="Matching cities">
              {search.places.map((p) => row(p.label, p.point, p.detail))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <ul className="rows" aria-label="Location">
            <li>
              <button type="button" className="row" aria-pressed={state.status === 'unset'} onClick={onClear}>
                <span className="row__icon row__icon--dark"><Globe2 size={18} strokeWidth={2.25} aria-hidden="true" /></span>
                <span className="row__text">
                  <span className="row__main">All cities nearby</span>
                  <span className="row__sub">The Upstate plus Asheville, Charlotte, Columbia, Athens, Atlanta, and Charleston</span>
                </span>
                {state.status === 'unset' && <Check size={20} strokeWidth={2.5} className="row__check" aria-hidden="true" />}
              </button>
            </li>
            <li>
              <button type="button" className="row" aria-pressed={deviceOn} onClick={onUseDevice} disabled={state.status === 'locating'}>
                <span className="row__icon row__icon--dark"><Navigation size={18} strokeWidth={2.25} aria-hidden="true" /></span>
                <span className="row__text">
                  <span className="row__main">Use my current location</span>
                  <span className={`row__sub${state.status === 'denied' || state.status === 'unavailable' ? ' row__sub--warn' : ''}`} role="status">
                    {deviceSub}
                  </span>
                </span>
                {deviceOn && <Check size={20} strokeWidth={2.5} className="row__check" aria-hidden="true" />}
              </button>
            </li>
          </ul>
          <p className="where__group">Upstate</p>
          <ul className="rows" aria-label="Upstate towns">
            {SAMPLE_TOWNS.map((t) => row(t.name, { lat: t.lat, lng: t.lng }))}
          </ul>
          <p className="where__group">Day trips</p>
          <ul className="rows" aria-label="Cities a day trip away">
            {NEARBY_CITIES.map((c) => row(c.label, c.point))}
          </ul>
        </>
      )}
    </div>
  )
}
