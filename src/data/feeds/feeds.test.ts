import { describe, expect, it } from 'vitest'
import { sgToScene } from './seatgeek'
import { tmToScene } from './ticketmaster'

describe('Ticketmaster mapping', () => {
  it('maps a concert with venue, price, and a wide image', () => {
    const e = tmToScene({
      id: 'abc',
      name: 'Big Band Night',
      url: 'https://www.ticketmaster.com/event/abc',
      dates: { start: { localDate: '2026-11-07', localTime: '20:00:00', dateTime: '2026-11-08T01:00:00Z' } },
      classifications: [{ segment: { name: 'Music' }, genre: { name: 'Jazz' } }],
      priceRanges: [{ min: 25, max: 65.5, currency: 'USD' }],
      images: [
        { url: 'https://img/small.jpg', width: 305, ratio: '16_9' },
        { url: 'https://img/wide.jpg', width: 1024, ratio: '16_9' },
      ],
      _embedded: { venues: [{ name: 'Peace Center', city: { name: 'Greenville' }, state: { stateCode: 'SC' }, location: { latitude: '34.8487', longitude: '-82.4001' } }] },
    })!
    expect(e.id).toBe('tm-abc')
    expect(e.category).toBe('music')
    expect(e.town).toBe('Greenville, SC')
    expect(e.price).toEqual({ min: { amountCents: 2500, currency: 'USD' }, max: { amountCents: 6550, currency: 'USD' }, status: 'confirmed' })
    expect(e.image).toBe('https://img/wide.jpg')
    expect(e.source).toBe('live')
  })

  it('marks missing prices and skips undated events', () => {
    expect(tmToScene({ id: 'x', name: 'TBA' })).toBeNull()
    const e = tmToScene({ id: 'y', name: 'Kids Show', dates: { start: { localDate: '2026-11-07' } }, classifications: [{ segment: { name: 'Family' } }] })!
    expect(e.price.status).toBe('missing')
    expect(e.category).toBe('family')
  })
})

describe('SeatGeek mapping', () => {
  it('treats resale prices as estimates', () => {
    const e = sgToScene({
      id: 9,
      title: 'Greenville vs. Asheville',
      type: 'minor_league_baseball',
      datetime_local: '2026-11-07T19:05:00',
      venue: { name: 'Fluor Field', city: 'Greenville', state: 'SC', location: { lat: 34.84, lon: -82.40 } },
      stats: { lowest_price: 12, highest_price: 40 },
    })!
    expect(e.category).toBe('sports')
    expect(e.price.status).toBe('estimate')
    expect(sgToScene({ id: 1, title: 'TBD', datetime_local: '2026-11-07T19:00:00', datetime_tbd: true })).toBeNull()
  })
})
