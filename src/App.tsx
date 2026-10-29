import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActiveFilters } from './components/ActiveFilters'
import { DateShortcuts } from './components/DateShortcuts'
import { EventCard } from './components/EventCard'
import { FilterPanel } from './components/FilterPanel'
import { LocationBar } from './components/LocationBar'
import { MoodPicker } from './components/MoodPicker'
import { fetchEvents, type EventFeed } from './data/eventSource'
import { useLocation } from './hooks/useLocation'
import { activeFilterCount, DEFAULT_FILTERS, recommend, type Filters } from './lib/discovery'

type FeedState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; feed: EventFeed }

function toDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function App() {
  const [now] = useState(() => new Date())
  const [feed, setFeed] = useState<FeedState>({ status: 'loading' })
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const location = useLocation()

  const load = useCallback(() => {
    fetchEvents(now)
      .then((f) => setFeed({ status: 'ready', feed: f }))
      .catch(() => setFeed({ status: 'error', message: "We couldn't load events right now." }))
  }, [now])

  useEffect(load, [load])

  const retry = () => {
    setFeed({ status: 'loading' })
    load()
  }

  const patch = useCallback((p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p })), [])
  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  const results = useMemo(
    () => (feed.status === 'ready' ? recommend(feed.feed.events, filters, now, location.point) : []),
    [feed, filters, now, location.point],
  )

  const panelFilterCount =
    filters.categories.length +
    (filters.maxMiles !== DEFAULT_FILTERS.maxMiles ? 1 : 0) +
    (filters.price !== 'any' ? 1 : 0) +
    (filters.age !== 'any' ? 1 : 0)

  const isSample = feed.status === 'ready' && feed.feed.source === 'sample'

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">SCENE</span>
        {isSample && (
          <span className="badge-sample" title="These events are made up for the demo. Prices and times are not real.">
            Sample data
          </span>
        )}
      </header>

      <main className="main">
        <LocationBar state={location.state} onUseDevice={location.requestDevice} onPickTown={location.setManual} />

        <MoodPicker value={filters.mood} onChange={(mood) => patch({ mood })} />

        <DateShortcuts value={filters.date} today={toDateInput(now)} onChange={(date) => patch({ date })} />

        <div className="toolbar">
          <label className="sr-only" htmlFor="search">Search events</label>
          <input
            id="search"
            type="search"
            className="input input--search"
            placeholder="Search (optional)"
            value={filters.query}
            onChange={(e) => patch({ query: e.target.value })}
          />
          <button
            type="button"
            className={`btn btn--filters${showFilters ? ' btn--on' : ''}`}
            aria-expanded={showFilters}
            aria-controls="filter-panel"
            onClick={() => setShowFilters((s) => !s)}
          >
            Filters{panelFilterCount > 0 && <span className="count">{panelFilterCount}</span>}
          </button>
        </div>

        {showFilters && <FilterPanel filters={filters} hasLocation={location.point !== null} onChange={patch} />}

        <ActiveFilters filters={filters} onChange={patch} onReset={reset} />

        <section aria-labelledby="results-heading" className="results" aria-busy={feed.status === 'loading'}>
          <h2 id="results-heading" className="results__heading">
            {feed.status === 'ready' ? `${results.length} ${results.length === 1 ? 'idea' : 'ideas'}` : 'Ideas'}
            {location.point === null && feed.status === 'ready' && (
              <span className="results__sub"> · set a location to see distances</span>
            )}
          </h2>

          {feed.status === 'loading' && (
            <ul className="list" aria-label="Loading events">
              {[0, 1, 2].map((i) => <li key={i} className="card card--skeleton" aria-hidden="true" />)}
            </ul>
          )}

          {feed.status === 'error' && (
            <div className="state" role="alert">
              <p>{feed.message}</p>
              <button type="button" className="btn" onClick={retry}>Try again</button>
            </div>
          )}

          {feed.status === 'ready' && results.length === 0 && (
            <div className="state" role="status">
              <p>
                Nothing matches these filters.{' '}
                {filters.maxMiles !== null && location.point ? 'Try a wider distance or a different day.' : 'Try a different day or fewer filters.'}
              </p>
              {activeFilterCount(filters) > 0 && (
                <button type="button" className="btn" onClick={reset}>Reset filters</button>
              )}
            </div>
          )}

          {feed.status === 'ready' && results.length > 0 && (
            <ul className="list">
              {results.map((r) => (
                <li key={r.event.id}><EventCard rec={r} now={now} /></li>
              ))}
            </ul>
          )}
        </section>

        {isSample && (
          <p className="footnote">
            All events, venues, times, and prices shown are sample data for this demo. They are not real listings.
          </p>
        )}
      </main>
    </div>
  )
}
