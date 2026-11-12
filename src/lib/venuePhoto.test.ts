import { describe, expect, it } from 'vitest'
import { creditLine, venueKey, wantsVenuePhoto } from './venuePhoto'
import type { SceneEvent } from '../types/event'

const ev = (over: Partial<SceneEvent>) => ({ venue: 'Copper Kettle Taproom', town: 'Clemson, SC', source: 'live', ...over }) as SceneEvent

describe('venue photos', () => {
  it('only looks up live events with a real venue and no photo', () => {
    expect(wantsVenuePhoto(ev({}))).toBe(true)
    expect(wantsVenuePhoto(ev({ image: 'https://x/y.jpg' }))).toBe(false)
    expect(wantsVenuePhoto(ev({ source: 'sample' }))).toBe(false)
    expect(wantsVenuePhoto(ev({ venue: 'TBA' }))).toBe(false)
    expect(wantsVenuePhoto(ev({ venue: 'Online event' }))).toBe(false)
  })
  it('keys by venue and town', () => {
    expect(venueKey(ev({ venue: ' Copper  Kettle ' }))).toBe(venueKey(ev({ venue: 'copper kettle' })))
  })
  it('credits the photographer', () => {
    expect(creditLine({ url: 'https://x', credit: [{ name: 'Sam Lee' }] })).toBe('Photo: Sam Lee')
    expect(creditLine({ url: 'https://x', credit: [] })).toBe('Photo')
  })
})
