/**
 * The one place screens get events from: sample events plus every live source
 * that answers (local WordPress calendars, Ticketmaster, SeatGeek). Each source
 * reports its own status so the app can say what is connected.
 */
import type { DataSource, SceneEvent } from '../types/event'
import { distanceMiles } from '../lib/discovery'
import { AREA } from './feeds/area'
import { fetchSeatGeek } from './feeds/seatgeek'
import { fetchTicketmaster } from './feeds/ticketmaster'
import { fetchLibrary, LIBRARY_FEEDS } from './libraryFeeds'
import { buildSampleEvents } from './sampleEvents'

export type SourceState = 'ok' | 'unavailable' | 'needs-key'

export interface SourceStatus {
  id: string
  name: string
  kind: 'library' | 'museum' | 'ticketing'
  status: SourceState
  count: number
}

/** Kept for the "Hosted by" filter, which only lists library calendars. */
export type LibraryStatus = SourceStatus

export interface EventFeed {
  events: SceneEvent[]
  /** "sample" when everything is demo data, "mixed" when live events are included. */
  source: DataSource | 'mixed'
  sources: SourceStatus[]
  libraries: LibraryStatus[]
  /** When the live sources were checked. */
  checkedAt: string
}

async function settle(
  id: string,
  name: string,
  kind: SourceStatus['kind'],
  run: () => Promise<SceneEvent[]>,
): Promise<{ status: SourceStatus; events: SceneEvent[] }> {
  try {
    const events = await run()
    return { status: { id, name, kind, status: 'ok', count: events.length }, events }
  } catch (err) {
    const status: SourceState = err instanceof Error && err.message === 'needs-key' ? 'needs-key' : 'unavailable'
    return { status: { id, name, kind, status, count: 0 }, events: [] }
  }
}

/** The same show can come from Ticketmaster and SeatGeek; keep the first one. */
function dedupe(events: SceneEvent[]): SceneEvent[] {
  const seen = new Set<string>()
  return events.filter((e) => {
    const key = `${e.title.toLowerCase().replace(/[^a-z0-9]/g, '')}|${e.start.slice(0, 13)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function fetchEvents(now: Date = new Date()): Promise<EventFeed> {
  const [results] = await Promise.all([
    Promise.all([
      ...LIBRARY_FEEDS.map((f) =>
        settle(f.id, f.name, f.kind ?? 'library', async () => {
          const r = await fetchLibrary(f, now)
          if (r.status !== 'ok') throw new Error('unavailable')
          return r.events
        }),
      ),
      settle('ticketmaster', 'Ticketmaster', 'ticketing', () => fetchTicketmaster(now)),
      settle('seatgeek', 'SeatGeek', 'ticketing', () => fetchSeatGeek(now)),
    ]),
    // Short floor so the loading state never flashes.
    new Promise((r) => setTimeout(r, 300)),
  ])

  const live = dedupe(results.flatMap((r) => r.events)).filter(
    (e) => distanceMiles(AREA.center, e.location) <= AREA.radiusMiles,
  )
  const sources = results.map((r) => r.status)
  return {
    events: [...live, ...buildSampleEvents(now)],
    source: live.length ? 'mixed' : 'sample',
    sources,
    libraries: sources.filter((s) => s.kind === 'library'),
    checkedAt: now.toISOString(),
  }
}
