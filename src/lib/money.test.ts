import { describe, expect, it } from 'vitest'
import { formatMoney, formatPriceRange } from './money'

const usd = (amountCents: number) => ({ amountCents, currency: 'USD' })

describe('formatMoney', () => {
  it('drops cents on whole dollars and keeps them otherwise', () => {
    expect(formatMoney(usd(1200), 'en-US')).toBe('$12')
    expect(formatMoney(usd(1250), 'en-US')).toBe('$12.50')
    expect(formatMoney(usd(5), 'en-US')).toBe('$0.05')
  })
})

describe('formatPriceRange', () => {
  it('handles free, single, range, and missing', () => {
    expect(formatPriceRange({ min: null, max: null, status: 'sample' }, 'en-US')).toBe('Free')
    expect(formatPriceRange({ min: usd(900), max: null, status: 'sample' }, 'en-US')).toBe('$9')
    expect(formatPriceRange({ min: usd(900), max: usd(2400), status: 'sample' }, 'en-US')).toBe('$9–$24')
    expect(formatPriceRange({ min: null, max: null, status: 'missing' }, 'en-US')).toBe('Price unknown')
  })
})
