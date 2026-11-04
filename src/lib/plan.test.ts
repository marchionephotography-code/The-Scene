import { describe, expect, it } from 'vitest'
import { buildSampleEvents } from '../data/sampleEvents'
import { cleanHandle, dinnerNearby, directionsHref, googleCalendarHref, icsFile, paybackLinks, splitCost } from './plan'

const events = buildSampleEvents(new Date(2026, 10, 4, 12))
const paid = events.find((e) => e.price.min && e.price.min.amountCents > 0)!

describe('plan helpers', () => {
  it('builds a calendar file with escaped text and a reminder', () => {
    const ics = icsFile({ ...paid, title: 'Rock, Paper; Scissors' }, 'The Scene', new Date('2026-11-04T12:00:00Z'))
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain(String.raw`SUMMARY:Rock\, Paper\; Scissors`)
    expect(ics).toMatch(/DTSTART:\d{8}T\d{6}Z/)
    expect(ics).toContain('TRIGGER:-PT2H')
    expect(ics.split('\r\n').length).toBeGreaterThan(10)
  })

  it('links to Google Calendar and the right maps app', () => {
    expect(googleCalendarHref(paid)).toContain('action=TEMPLATE')
    expect(directionsHref(paid.location, 'X', 'ios')).toMatch(/^https:\/\/maps\.apple\.com/)
    expect(directionsHref(paid.location, 'X', 'android')).toMatch(/google\.com\/maps\/dir/)
  })

  it('splits the cost and builds pay-back links', () => {
    const s = splitCost(paid, 4)
    expect(s.totalCents).toBe(s.eachCents! * 4)
    expect(cleanHandle(' @carla-m ')).toBe('carla-m')
    const links = paybackLinks({ venmo: '@carla', cashapp: '$carla' }, 1250, 'Show')
    expect(links.map((l) => l.href)).toEqual([
      'https://venmo.com/carla?txn=pay&amount=12.50&note=Show',
      'https://cash.app/$carla/12.50',
    ])
  })

  it('suggests only earlier food events nearby on the same day', () => {
    for (const e of events) {
      for (const d of dinnerNearby(e, events)) {
        expect(d.category).toBe('food')
        expect(new Date(d.start).toDateString()).toBe(new Date(e.start).toDateString())
        expect(new Date(d.start).getTime()).toBeLessThan(new Date(e.start).getTime())
      }
    }
  })
})
