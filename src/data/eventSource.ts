/**
 * The one place screens get events from. Today it returns sample data; replace
 * the body of `fetchEvents` with a real API call when an event source is
 * connected. Screens only depend on the return shape.
 */
import type { DataSource, SceneEvent } from '../types/event'
import { buildSampleEvents } from './sampleEvents'

export interface EventFeed {
  events: SceneEvent[]
  source: DataSource
}

export async function fetchEvents(now: Date = new Date()): Promise<EventFeed> {
  // Simulated network delay so loading states are visible during development.
  await new Promise((r) => setTimeout(r, 400))
  return { events: buildSampleEvents(now), source: 'sample' }
}
