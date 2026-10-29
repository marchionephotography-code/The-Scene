import { describe, expect, it } from 'vitest'
import { buildSampleEvents } from '../data/sampleEvents'
import type { SceneEvent } from '../types/event'
import { dateWindow, DEFAULT_FILTERS, distanceMiles, formatMiles, recommend, type Filters } from './discovery'

// Wednesday, Oct 28 2026, 12:00 local
const WED_NOON = new Date(2026, 9, 28, 12, 0)
const CLEMSON = { lat: 34.6834, lng: -82.8374 }

function ev(partial: Partial<SceneEvent> & { start: string }): SceneEvent {
  return {
    id: partial.id ?? 'x',
    title: 'Test',
    category: 'music',
    tags: [],
    venue: 'V',
    town: 'T',
    location: CLEMSON,
    price: { min: null, max: null, status: 'sample' },
    age: 'all-ages',
    local: false,
    description: '',
    source: 'sample',
    ...partial,
  }
}

const f = (p: Partial<Filters>): Filters => ({ ...DEFAULT_FILTERS, maxMiles: null, ...p })

describe('dateWindow', () => {
  it('tonight runs 4 PM today to 3 AM tomorrow', () => {
    const [a, b] = dateWindow({ kind: 'tonight' }, WED_NOON)!
    expect(a).toEqual(new Date(2026, 9, 28, 16))
    expect(b).toEqual(new Date(2026, 9, 29, 3))
  })

  it('weekend on a weekday is Friday 4 PM through Sunday', () => {
    const [a, b] = dateWindow({ kind: 'weekend' }, WED_NOON)!
    expect(a).toEqual(new Date(2026, 9, 30, 16))
    expect(b).toEqual(new Date(2026, 10, 2, 0))
  })

  it('weekend on Saturday starts today', () => {
    const sat = new Date(2026, 9, 31, 10)
    const [a, b] = dateWindow({ kind: 'weekend' }, sat)!
    expect(a).toEqual(new Date(2026, 9, 31))
    expect(b).toEqual(new Date(2026, 10, 2))
  })

  it('custom range includes the whole last day', () => {
    const [a, b] = dateWindow({ kind: 'custom', from: '2026-11-03', to: '2026-11-05' }, WED_NOON)!
    expect(a).toEqual(new Date(2026, 10, 3))
    expect(b).toEqual(new Date(2026, 10, 6))
  })
})

describe('recommend', () => {
  const tonight = ev({ id: 'tonight', start: new Date(2026, 9, 28, 19).toISOString(), end: new Date(2026, 9, 28, 21).toISOString() })
  const over = ev({ id: 'over', start: new Date(2026, 9, 28, 8).toISOString(), end: new Date(2026, 9, 28, 10).toISOString() })
  const sat = ev({
    id: 'sat',
    start: new Date(2026, 9, 31, 10).toISOString(),
    category: 'family',
    tags: ['family'],
    age: '21+',
    price: { min: { amountCents: 2500, currency: 'USD' }, max: null, status: 'sample' },
    location: { lat: 34.8526, lng: -82.394 }, // Greenville, ~28 mi
  })

  it('drops events that already ended', () => {
    expect(recommend([over, tonight], f({}), WED_NOON, null).map((r) => r.event.id)).toEqual(['tonight'])
  })

  it('filters by date shortcut', () => {
    expect(recommend([tonight, sat], f({ date: { kind: 'weekend' } }), WED_NOON, null).map((r) => r.event.id)).toEqual(['sat'])
  })

  it('filters by price: free and under $20', () => {
    expect(recommend([tonight, sat], f({ price: 'free' }), WED_NOON, null).map((r) => r.event.id)).toEqual(['tonight'])
    expect(recommend([tonight, sat], f({ price: 'under50' }), WED_NOON, null)).toHaveLength(2)
  })

  it('filters by distance only when a location is set', () => {
    expect(recommend([tonight, sat], f({ maxMiles: 10 }), WED_NOON, CLEMSON).map((r) => r.event.id)).toEqual(['tonight'])
    expect(recommend([tonight, sat], f({ maxMiles: 10 }), WED_NOON, null)).toHaveLength(2)
  })

  it('filters by age suitability', () => {
    expect(recommend([tonight, sat], f({ age: 'kids' }), WED_NOON, null).map((r) => r.event.id)).toEqual(['tonight'])
    expect(recommend([tonight, sat], f({ age: 'adults' }), WED_NOON, null).map((r) => r.event.id)).toEqual(['sat'])
  })

  it('filters by mood and explains why', () => {
    const [r] = recommend([tonight, sat], f({ mood: 'family' }), WED_NOON, CLEMSON)
    expect(r.event.id).toBe('sat')
    expect(r.reasons).toContain('family time')
    expect(r.reasons.some((x) => x.endsWith('mi away'))).toBe(true)
  })

  it('searches title, venue, town, and tags', () => {
    const named = ev({ id: 'named', title: 'Bluegrass Jam', start: tonight.start, end: tonight.end })
    expect(recommend([tonight, named], f({ query: 'bluegrass' }), WED_NOON, null).map((r) => r.event.id)).toEqual(['named'])
  })
})

describe('sample data', () => {
  it('is always labeled as sample and stored in whole cents', () => {
    for (const e of buildSampleEvents(WED_NOON)) {
      expect(e.source).toBe('sample')
      expect(e.price.status).toBe('sample')
      if (e.price.min) expect(Number.isInteger(e.price.min.amountCents)).toBe(true)
    }
  })

  it('has something for tonight, tomorrow, and the weekend', () => {
    const events = buildSampleEvents(WED_NOON)
    for (const kind of ['tonight', 'tomorrow', 'weekend'] as const) {
      expect(recommend(events, f({ date: { kind } }), WED_NOON, null).length).toBeGreaterThan(0)
    }
  })
})

describe('distance', () => {
  it('Clemson to Greenville is about 28 miles', () => {
    expect(distanceMiles(CLEMSON, { lat: 34.8526, lng: -82.394 })).toBeGreaterThan(25)
    expect(distanceMiles(CLEMSON, { lat: 34.8526, lng: -82.394 })).toBeLessThan(31)
  })
  it('formats short and long distances', () => {
    expect(formatMiles(0.2)).toBe('under ½ mi')
    expect(formatMiles(2)).toBe('2 mi')
    expect(formatMiles(2.46)).toBe('2.5 mi')
    expect(formatMiles(27.6)).toBe('28 mi')
  })
})
