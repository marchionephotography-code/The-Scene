import { describe, expect, it } from 'vitest'
import { LOCALIST_FEEDS, lxToScene, parseCost } from './localist'

const feed = LOCALIST_FEEDS[0]
const base = {
  id: 7,
  title: 'Clemson Symphony Orchestra Fall Concert',
  location_name: 'Brooks Center',
  geo: { latitude: '34.6767', longitude: '-82.8329', city: 'Clemson', state: 'SC' },
  filters: { event_types: [{ name: 'Performing Arts' }, { name: 'Music' }] },
  ticket_cost: '$5 - $15',
  photo_url: 'https://localist-images.azureedge.net/photos/1/huge/abc.jpg',
  localist_url: 'https://calendar.clemson.edu/event/fall-concert',
  event_instances: [{ event_instance: { start: '2026-11-12T19:30:00-05:00', end: '2026-11-12T21:00:00-05:00' } }],
}

describe('Localist mapping', () => {
  it('keeps a concert with venue, price range, and photo', () => {
    const e = lxToScene(base, feed)!
    expect(e.id).toBe('lx-clemson-7')
    expect(e.category).toBe('music')
    expect(e.town).toBe('Clemson, SC')
    expect(e.price.min?.amountCents).toBe(500)
    expect(e.price.max?.amountCents).toBe(1500)
    expect(e.image).toContain('/big/')
    expect(e.start).toBe('2026-11-13T00:30:00.000Z')
  })

  it('drops lectures, deadlines, and private or all-day items', () => {
    expect(lxToScene({ ...base, title: 'Guest Lecture: Rocks', filters: { event_types: [{ name: 'Lecture' }] } }, feed)).toBeNull()
    expect(lxToScene({ ...base, private: true }, feed)).toBeNull()
    expect(lxToScene({ ...base, event_instances: [{ event_instance: { start: '2026-11-12', all_day: true } }] }, feed)).toBeNull()
  })

  it('reads ticket costs', () => {
    expect(parseCost('Free')).toEqual({ min: null, max: null, status: 'confirmed' })
    expect(parseCost('$10').min?.amountCents).toBe(1000)
    expect(parseCost('See website').status).toBe('missing')
  })
})
