import { describe, expect, it } from 'vitest'
import { mergePlaces, parsePlaces, searchLocal } from './geocode'

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


describe('built-in city lookup', () => {
  it('finds cities by the start of the name, best match first', () => {
    expect(searchLocal('char').map((p) => p.label)).toEqual(expect.arrayContaining(['Charlotte, NC', 'Charleston, SC']))
    expect(searchLocal('nashville')[0].label).toBe('Nashville, TN')
  })
  it('narrows by state code or name', () => {
    expect(searchLocal('charleston wv').map((p) => p.label)).toEqual(['Charleston, WV'])
    expect(searchLocal('portland, oregon').map((p) => p.label)).toEqual(['Portland, OR'])
    expect(searchLocal('rock')[0].label).toBe('Rock Hill, SC')
  })
  it('merges online results without repeats', () => {
    const a = searchLocal('athens')
    expect(mergePlaces(a, [{ label: 'Athens, GA', point: { lat: 0, lng: 0 } }, { label: 'Athens, OH', point: { lat: 1, lng: 1 } }]).map((p) => p.label)).toEqual(['Athens, GA', 'Athens, OH'])
  })
})
