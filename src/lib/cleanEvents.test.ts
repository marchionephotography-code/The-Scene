import { describe, expect, it } from 'vitest'
import type { SceneEvent } from '../types/event'
import { cleanEvents, readStatus, sameEvent, titleSimilarity } from './cleanEvents'
import { tmStatus } from '../data/feeds/ticketmaster'

const base: SceneEvent = {
  id: 'a', title: 'Jazz on the Lawn', category: 'music', tags: [], venue: 'Amphitheater Commons', town: 'Anderson, SC',
  location: { lat: 34.5, lng: -82.65 }, start: '2026-11-14T19:00:00-05:00', price: { min: null, max: null, status: 'confirmed' },
  age: 'all-ages', local: true, description: 'Bring a blanket.', source: 'live',
}
const ev = (p: Partial<SceneEvent>): SceneEvent => ({ ...base, ...p })

describe('event status', () => {
  it('reads Ticketmaster codes', () => {
    expect(tmStatus('cancelled')).toBe('cancelled')
    expect(tmStatus('canceled')).toBe('cancelled')
    expect(tmStatus('postponed')).toBe('postponed')
    expect(tmStatus('onsale')).toBe('scheduled')
  })
  it('reads and removes notes in titles', () => {
    expect(readStatus(ev({ title: 'POSTPONED: Jazz on the Lawn' }))).toMatchObject({ title: 'Jazz on the Lawn', status: 'postponed' })
    expect(readStatus(ev({ title: 'Jazz on the Lawn (Cancelled)' }))).toMatchObject({ title: 'Jazz on the Lawn', status: 'cancelled' })
    expect(readStatus(ev({ title: 'Jazz on the Lawn - RESCHEDULED' })).status).toBe('rescheduled')
    expect(readStatus(base)).toBe(base)
  })
})

describe('near-duplicates', () => {
  it('scores similar titles', () => {
    expect(titleSimilarity('Jazz on the Lawn', 'Jazz on the Lawn – Free Concert')).toBeGreaterThanOrEqual(0.6)
    expect(titleSimilarity('Jazz on the Lawn', 'Bluegrass on the Porch')).toBeLessThan(0.6)
  })
  it('matches the same show at nearly the same time and place', () => {
    expect(sameEvent(base, ev({ id: 'b', title: 'Jazz On The Lawn: Live', start: '2026-11-14T19:30:00-05:00' }))).toBe(true)
    expect(sameEvent(base, ev({ id: 'c', start: '2026-11-15T19:00:00-05:00' }))).toBe(false)
    expect(sameEvent(base, ev({ id: 'd', location: { lat: 34.85, lng: -82.39 }, venue: 'Other Place' }))).toBe(false)
  })
})

describe('cleanEvents', () => {
  it('drops cancelled events, merges duplicates, keeps the richer copy and any warning', () => {
    const out = cleanEvents([
      base,
      ev({ id: 'tm', title: 'Jazz on the Lawn – Free Concert', image: 'https://x/y.jpg', start: '2026-11-14T19:15:00-05:00' }),
      ev({ id: 'pp', title: 'POSTPONED: Jazz on the Lawn' }),
      ev({ id: 'gone', title: 'Trivia Night (CANCELLED)', venue: 'Taproom', location: { lat: 34.6, lng: -82.8 } }),
    ])
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('tm')
    expect(out[0].status).toBe('postponed')
  })
})
