/**
 * The one place screens get events from: sample events plus any public
 * library calendars that answer. Screens only depend on the return shape.
 */
import type { DataSource, SceneEvent } from '../types/event'
import { fetchLibrary, LIBRARY_FEEDS, type LibraryResult } from './libraryFeeds'
import { buildSampleEvents } from './sampleEvents'

export interface LibraryStatus {
  id: string
  name: string
  status: LibraryResult['status']
  count: number
}

export interface EventFeed {
  events: SceneEvent[]
  /** "sample" when everything is demo data, "mixed" when live events are included. */
  source: DataSource | 'mixed'
  libraries: LibraryStatus[]
  /** When the live calendars were checked. */
  checkedAt: string
}

export async function fetchEvents(now: Date = new Date()): Promise<EventFeed> {
  const [libraries] = await Promise.all([
    Promise.all(LIBRARY_FEEDS.map((f) => fetchLibrary(f, now))),
    // Short floor so the loading state never flashes.
    new Promise((r) => setTimeout(r, 300)),
  ])
  const live = libraries.flatMap((l) => l.events)
  const events = [...live, ...buildSampleEvents(now)]
  return {
    events,
    source: live.length ? 'mixed' : 'sample',
    libraries: libraries.map((l) => ({ id: l.feed.id, name: l.feed.name, status: l.status, count: l.events.length })),
    checkedAt: now.toISOString(),
  }
}
