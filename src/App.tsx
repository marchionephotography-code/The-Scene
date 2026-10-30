import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ActiveFilters } from './components/ActiveFilters'
import { CalendarView } from './components/CalendarView'
import { DateShortcuts } from './components/DateShortcuts'
import { EventCard } from './components/EventCard'
import { EventDetail } from './components/EventDetail'
import { FilterPanel } from './components/FilterPanel'
import { LocationBar } from './components/LocationBar'
import { MoodPicker } from './components/MoodPicker'
import { SavedView } from './components/SavedView'
import { SearchPill } from './components/SearchPill'
import { Sheet } from './components/Sheet'
import { TabBar, type Tab } from './components/TabBar'
import { APP_NAME } from './config'
import { fetchEvents, type EventFeed } from './data/eventSource'
import { useLocation } from './hooks/useLocation'
import { useSaved } from './hooks/useSaved'
import { startOfDay, type CalendarMode } from './lib/calendar'
import {
  activeFilterCount,
  DATE_LABELS,
  DEFAULT_FILTERS,
  MOODS,
  recommend,
  type Filters,
} from './lib/discovery'
import { withViewTransition } from './lib/motion'

type FeedState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; feed: EventFeed }

type OpenSheet = 'none' | 'where' | 'filters' | 'event'

const TAB_IDS: Tab[] = ['explore', 'calendar', 'saved']

function tabFromHash(): Tab {
  const h = window.location.hash.replace('#', '') as Tab
  return TAB_IDS.includes(h) ? h : 'explore'
}

function toDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function ideasLabel(n: number) {
  return n === 0 ? 'No ideas yet' : `Show ${n} ${n === 1 ? 'idea' : 'ideas'}`
}

export default function App() {
  const [now] = useState(() => new Date())
  const [feed, setFeed] = useState<FeedState>({ status: 'loading' })
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [sheet, setSheet] = useState<OpenSheet>('none')
  const [openEventId, setOpenEventId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>(tabFromHash)
  const [calMode, setCalMode] = useState<CalendarMode>('week')
  const [calDay, setCalDay] = useState<Date>(() => startOfDay(new Date()))
  const location = useLocation()
  const saved = useSaved()

  const load = useCallback(() => {
    fetchEvents(now)
      .then((f) => setFeed({ status: 'ready', feed: f }))
      .catch(() => setFeed({ status: 'error', message: "We couldn't load events right now." }))
  }, [now])

  useEffect(load, [load])

  // Tabs live in the URL hash (#calendar, #saved) so they survive a reload.
  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const goTab = useCallback((t: Tab) => {
    withViewTransition(() => setTab(t))
    if (window.location.hash !== `#${t}`) history.replaceState(null, '', `#${t}`)
    window.scrollTo({ top: 0 })
  }, [])

  const retry = () => {
    setFeed({ status: 'loading' })
    load()
  }

  // The first load gets a short staggered entrance; after that, changes
  // animate through View Transitions instead.
  const [intro, setIntro] = useState(true)

  const update = useCallback(
    (next: (f: Filters) => Filters) => {
      const apply = () => {
        setIntro(false)
        setFilters(next)
      }
      // Inside an open sheet the grid is hidden behind it, so skip the transition.
      if (sheet === 'none') withViewTransition(apply)
      else apply()
    },
    [sheet],
  )
  const patch = useCallback((p: Partial<Filters>) => update((f) => ({ ...f, ...p })), [update])
  const reset = useCallback(() => update(() => DEFAULT_FILTERS), [update])
  const closeSheet = useCallback(() => setSheet('none'), [])
  const openEvent = useCallback((id: string) => {
    setOpenEventId(id)
    setSheet('event')
  }, [])

  const events = useMemo(() => (feed.status === 'ready' ? feed.feed.events : []), [feed])
  const results = useMemo(() => recommend(events, filters, now, location.point), [events, filters, now, location.point])
  // The calendar picks its own days, so it ignores the date filter.
  const calendarItems = useMemo(
    () => recommend(events, { ...filters, date: { kind: 'any' } }, now, location.point),
    [events, filters, now, location.point],
  )
  const openEventData = events.find((e) => e.id === openEventId) ?? null

  const panelFilterCount =
    filters.categories.length +
    (filters.maxMiles !== DEFAULT_FILTERS.maxMiles ? 1 : 0) +
    (filters.price !== 'any' ? 1 : 0) +
    (filters.age !== 'any' ? 1 : 0)

  const isSample = feed.status === 'ready' && feed.feed.source === 'sample'
  const loc = location.state
  const place =
    loc.status === 'device' || loc.status === 'manual' ? loc.label
    : loc.status === 'locating' ? 'Finding you…'
    : null
  const mood = MOODS.find((m) => m.id === filters.mood)
  const pillDetail = [
    tab === 'calendar' ? 'Calendar' : filters.date.kind === 'any' ? 'Any time' : DATE_LABELS[filters.date.kind],
    mood ? mood.label : 'Any mood',
  ].join(' · ')
  const savedCount = saved.favorites.length + saved.wishlist.filter((w) => !w.done).length

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="topbar__brand">
            <button
              type="button"
              className="brand"
              aria-label={`${APP_NAME}, go to home`}
              onClick={() => {
                goTab('explore')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              {APP_NAME}
            </button>
            {isSample && (
              <span className="badge-sample" title="These events are made up for the demo. Prices and times are not real.">
                Sample data
              </span>
            )}
          </div>
          {tab !== 'saved' && (
            <SearchPill
              place={place}
              detail={pillDetail}
              filterCount={panelFilterCount}
              onOpenSearch={() => setSheet('where')}
              onOpenFilters={() => setSheet('filters')}
            />
          )}
          <TabBar tab={tab} savedCount={savedCount} onChange={goTab} />
        </div>
      </header>

      <main className="main">
        {feed.status === 'error' && (
          <div className="state" role="alert">
            <p className="state__title">Something went wrong</p>
            <p>{feed.message}</p>
            <button type="button" className="btn" onClick={retry}>Try again</button>
          </div>
        )}

        {tab === 'explore' && (
          <>
            <MoodPicker value={filters.mood} onChange={(m) => patch({ mood: m })} />

            <DateShortcuts value={filters.date} today={toDateInput(now)} onChange={(date) => patch({ date })} />

            <ActiveFilters filters={filters} onChange={patch} onReset={reset} />

            <section aria-labelledby="results-heading" className="results" aria-busy={feed.status === 'loading'}>
              <div className="results__head">
                <h2 id="results-heading" className="results__heading">Ideas for you</h2>
                {feed.status === 'ready' && (
                  <span key={results.length} className="results__count">
                    {results.length} {results.length === 1 ? 'result' : 'results'}
                  </span>
                )}
              </div>
              {location.point === null && feed.status === 'ready' && (
                <button type="button" className="nudge" onClick={() => setSheet('where')}>
                  Add a location to see what’s nearby
                </button>
              )}

              {feed.status === 'loading' && (
                <ul className="grid" aria-label="Loading events">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="skeleton" aria-hidden="true">
                      <div className="skeleton__media" />
                      <div className="skeleton__line" />
                      <div className="skeleton__line skeleton__line--short" />
                    </li>
                  ))}
                </ul>
              )}

              {feed.status === 'ready' && results.length === 0 && (
                <div className="state" role="status">
                  <p className="state__title">Nothing matches these filters</p>
                  <p>
                    {filters.maxMiles !== null && location.point
                      ? 'Try a wider distance or a different day.'
                      : 'Try a different day or fewer filters.'}
                  </p>
                  {activeFilterCount(filters) > 0 && (
                    <button type="button" className="btn" onClick={reset}>Reset filters</button>
                  )}
                </div>
              )}

              {feed.status === 'ready' && results.length > 0 && (
                <ul className={`grid${intro ? ' grid--intro' : ''}`}>
                  {results.map((r, i) => (
                    <li
                      key={r.event.id}
                      style={{ viewTransitionName: `card-${r.event.id}`, '--i': i } as CSSProperties}
                    >
                      <EventCard
                        rec={r}
                        now={now}
                        favorite={saved.isFavorite(r.event.id)}
                        onToggleFavorite={() => saved.toggleFavorite(r.event.id)}
                        onOpen={() => openEvent(r.event.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {tab === 'calendar' && feed.status !== 'error' && (
          <CalendarView
            items={calendarItems}
            now={now}
            mode={calMode}
            selected={calDay}
            onMode={(m) => withViewTransition(() => setCalMode(m))}
            onSelect={(d) => withViewTransition(() => setCalDay(startOfDay(d)))}
            onOpen={openEvent}
          />
        )}

        {tab === 'saved' && (
          <SavedView saved={saved} events={events} onOpen={openEvent} onBrowse={() => goTab('explore')} />
        )}

        {isSample && (
          <p className="footnote">
            All events, venues, times, and prices shown are sample data for this demo. They are not real listings.
          </p>
        )}
      </main>

      <Sheet
        open={sheet === 'where'}
        title="Where & when"
        onClose={closeSheet}
        footer={
          <>
            <button type="button" className="link-btn" onClick={() => patch({ date: { kind: 'any' }, query: '' })}>
              Clear
            </button>
            <button type="button" className="btn btn--lg" onClick={closeSheet}>{ideasLabel(results.length)}</button>
          </>
        }
      >
        <section className="sheet__section">
          <h3 className="sheet__label">Where</h3>
          <LocationBar state={location.state} onUseDevice={location.requestDevice} onPickTown={location.setManual} />
        </section>
        {tab !== 'calendar' && (
          <section className="sheet__section">
            <h3 className="sheet__label">When</h3>
            <DateShortcuts value={filters.date} today={toDateInput(now)} onChange={(date) => patch({ date })} wrap />
          </section>
        )}
        <section className="sheet__section">
          <h3 className="sheet__label"><label htmlFor="search">Anything specific?</label></h3>
          <input
            id="search"
            type="search"
            className="input"
            placeholder="Event, venue, or town"
            value={filters.query}
            onChange={(e) => patch({ query: e.target.value })}
          />
        </section>
      </Sheet>

      <Sheet
        open={sheet === 'filters'}
        title="Filters"
        onClose={closeSheet}
        footer={
          <>
            <button
              type="button"
              className="link-btn"
              onClick={() => patch({ categories: [], maxMiles: DEFAULT_FILTERS.maxMiles, price: 'any', age: 'any', mood: null })}
            >
              Clear all
            </button>
            <button type="button" className="btn btn--lg" onClick={closeSheet}>
              {tab === 'calendar' ? 'Done' : ideasLabel(results.length)}
            </button>
          </>
        }
      >
        {tab === 'calendar' && (
          <section className="sheet__section">
            <h3 className="sheet__label">Mood</h3>
            <div className="chips">
              {MOODS.map((m) => {
                const on = filters.mood === m.id
                return (
                  <button key={m.id} type="button" className={`chip${on ? ' chip--on' : ''}`} aria-pressed={on} onClick={() => patch({ mood: on ? null : m.id })}>
                    {m.label}
                  </button>
                )
              })}
            </div>
          </section>
        )}
        <FilterPanel filters={filters} hasLocation={location.point !== null} onChange={patch} />
      </Sheet>

      <Sheet open={sheet === 'event'} title="Event details" onClose={closeSheet}>
        {openEventData && <EventDetail key={openEventData.id} event={openEventData} saved={saved} />}
      </Sheet>
    </div>
  )
}
