import type { EventPrice, Money } from '../types/event'

const formatters = new Map<string, Intl.NumberFormat>()

function formatter(currency: string, wholeUnits: boolean, locale?: string) {
  const key = `${locale ?? ''}|${currency}|${wholeUnits}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      ...(wholeUnits ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
    })
    formatters.set(key, f)
  }
  return f
}

/** Formats whole cents, e.g. 1200 → "$12", 1250 → "$12.50". */
export function formatMoney(m: Money, locale?: string): string {
  const whole = m.amountCents % 100 === 0
  return formatter(m.currency, whole, locale).format(m.amountCents / 100)
}

/** "Free", "$12", or "$9–$24". Status is shown separately as a label. */
export function formatPriceRange(price: EventPrice, locale?: string): string {
  if (price.status === 'missing') return 'Price unknown'
  if (!price.min) return 'Free'
  const low = formatMoney(price.min, locale)
  if (!price.max || price.max.amountCents === price.min.amountCents) return low
  return `${low}–${formatMoney(price.max, locale)}`
}

export const PRICE_STATUS_LABEL: Record<EventPrice['status'], string> = {
  confirmed: 'Confirmed',
  estimate: 'Estimate',
  missing: 'Missing',
  manual: 'Manual',
  sample: 'Sample',
}
