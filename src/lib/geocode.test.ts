import { describe, expect, it } from 'vitest'
import { parsePlaces } from './geocode'

describe('city search', () => {
  it('labels cities with state abbreviations and skips non-towns and repeats', () => {
    const places = parsePlaces({
      results: [
        { name: 'Charlotte', latitude: 35.22, longitude: -80.84, admin1: 'North Carolina', admin2: 'Mecklenburg', feature_code: 'PPLA2' },
        { name: 'Charlotte', latitude: 35.3, longitude: -80.8, admin1: 'North Carolina', feature_code: 'PPL' },
        { name: 'Charlotte Lake', latitude: 1, longitude: 1, admin1: 'Maine', feature_code: 'LK' },
        { name: 'Charlotte', latitude: 42.5, longitude: -84.8, admin1: 'Michigan', feature_code: 'PPL' },
      ],
    })
    expect(places.map((p) => p.label)).toEqual(['Charlotte, NC', 'Charlotte, MI'])
    expect(places[0].point).toEqual({ lat: 35.22, lng: -80.84 })
  })
})
