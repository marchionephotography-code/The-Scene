import { describe, expect, it } from 'vitest'
import { buildSampleEvents } from '../data/sampleEvents'
import type { Recommendation } from './discovery'
import { EMPTY_PROFILE, interestsFor, likesSummary, personalize } from './profile'

const events = buildSampleEvents(new Date(2026, 10, 12, 12))
const recs: Recommendation[] = events.map((event) => ({ event, miles: null, reasons: [] }))
const byTitle = (t: string) => events.find((e) => e.title.startsWith(t))!

describe('interests', () => {
  it('reads interests from category, tags, and words', () => {
    expect(interestsFor(byTitle('Improv Comedy'))).toContain('comedy')
    expect(interestsFor(byTitle('Trivia Night'))).toEqual(expect.arrayContaining(['trivia', 'drinks']))
    expect(interestsFor(byTitle('Sunset Kayak'))).toEqual(expect.arrayContaining(['outdoors', 'active']))
  })
})

describe('personalize', () => {
  it('puts liked interests first and says why', () => {
    const out = personalize(recs, { ...EMPTY_PROFILE, likes: ['comedy'] }).recs
    expect(interestsFor(out[0].event)).toContain('comedy')
    expect(out[0].reasons).toContain('you like comedy')
  })

  it('hides skipped interests and Not-for-me events, and can show them again', () => {
    const kayak = byTitle('Sunset Kayak')
    const p = { ...EMPTY_PROFILE, skips: ['family' as const], hiddenEvents: [kayak.id] }
    const { recs: out, hiddenCount } = personalize(recs, p)
    expect(out.some((r) => r.event.id === kayak.id)).toBe(false)
    expect(out.some((r) => interestsFor(r.event).includes('family'))).toBe(false)
    expect(hiddenCount).toBeGreaterThan(1)
    expect(personalize(recs, p, [], true).recs).toHaveLength(recs.length)
  })

  it('pushes over-budget events down without hiding them', () => {
    const out = personalize(recs, { ...EMPTY_PROFILE, budget: 'free' }).recs
    expect(out).toHaveLength(recs.length)
    const lastFree = out.map((r) => r.event.price.min === null).lastIndexOf(true)
    const firstPaid = out.findIndex((r) => r.event.price.min !== null)
    expect(lastFree).toBeLessThan(firstPaid)
  })

  it('summarizes likes', () => {
    expect(likesSummary({ ...EMPTY_PROFILE, likes: ['comedy', 'food', 'film', 'art'] })).toBe('Into comedy, food, and 2 more')
  })
})
