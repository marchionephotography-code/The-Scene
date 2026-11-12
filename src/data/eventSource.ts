/**
 * The one place screens get events from: sample events plus every live source
 * that answers (local WordPress calendars, Ticketmaster, SeatGeek). Each source
 * reports its own status so the app can say what is connected.
 */
import type { DataSource, SceneEvent } from '../types/event'
import { distanceMiles } from '../lib/discovery'
import { cleanEvents } from '../lib/cleanEvents'
import { AREA, type SearchArea } from './feeds/area'
import { fetchLocalist, LOCALIST_FEEDS } from './feeds/localist'
import { fetchSeatGeek } from './feeds/seatgeek'
import { fetchTicketmaster } from './feeds/ticketmaster'
import { fetchLibrary, LIBRARY_FEEDS } from './libraryFeeds'
import { buildSampleEvents } from './sampleEvents'

export type SourceState = 'ok' | 'unavailable' | 'needs-key'

export interface SourceStatus {
  id: string
  name: string
  kind: 'library' | 'museum' | 'ticketing' | 'campus'
  status: SourceState
  count: number
}

/** Kept for the "Hosted by" filter, which only lists library calendars. */
export type LibraryStatus = SourceStatus

export interface EventFeed {
  events: SceneEvent[]
  /** "sample" when everything is demo data, "live" when real listings loaded. */
  source: DataSource
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

/**
 * Everything on in the default region, or (with `area`) around one chosen
 * city anywhere in the US.
 */
export async function fetchEvents(now: Date = new Date(), area?: SearchArea): Promise<EventFeed> {
  const where = area ?? AREA
  const [results] = await Promise.all([
    Promise.all([
      ...LIBRARY_FEEDS.map((f) =>
        settle(f.id, f.name, f.kind ?? 'library', async () => {
          const r = await fetchLibrary(f, now)
          if (r.status !== 'ok') throw new Error('unavailable')
          return r.events
        }),
      ),
      ...LOCALIST_FEEDS.map((f) => settle(f.id, f.name, 'campus', () => fetchLocalist(f))),
      settle('ticketmaster', 'Ticketmaster', 'ticketing', () => fetchTicketmaster(now, area)),
      settle('seatgeek', 'SeatGeek', 'ticketing', () => fetchSeatGeek(now, area)),
    ]),
    // Short floor so the loading state never flashes.
    new Promise((r) => setTimeout(r, 300)),
  ])

  const live = cleanEvents(dedupe(results.flatMap((r) => r.events))).filter(
    (e) => distanceMiles(where.center, e.location) <= where.radiusMiles,
  )
  const sources = results.map((r) => r.status)
  return {
    // Real listings only once any arrive; sample events are just for demos
    // and previews where no live source can be reached.
    events: live.length ? live : buildSampleEvents(now),
    source: live.length ? 'live' : 'sample',
    sources,
    libraries: sources.filter((s) => s.kind === 'library'),
    checkedAt: now.toISOString(),
  }
}
