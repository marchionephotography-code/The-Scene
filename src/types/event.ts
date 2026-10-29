/** Where a piece of data came from. Never show "sample" data as live or verified. */
export type DataSource = 'sample' | 'live'

export type Category =
  | 'music'
  | 'sports'
  | 'shows'
  | 'arts'
  | 'food'
  | 'outdoors'
  | 'family'

/** Price status labels from the SCENE budget rules. */
export type PriceStatus = 'confirmed' | 'estimate' | 'missing' | 'manual' | 'sample'

export interface Money {
  /** Whole cents, never decimals. */
  amountCents: number
  currency: string
}

export interface EventPrice {
  /** null = free. */
  min: Money | null
  max: Money | null
  status: PriceStatus
}

export type AgeSuitability = 'all-ages' | 'family' | '18+' | '21+'

export interface GeoPoint {
  lat: number
  lng: number
}

export interface SceneEvent {
  id: string
  title: string
  category: Category
  /** Short mood tags used for recommendations, e.g. "chill", "lively". */
  tags: string[]
  venue: string
  town: string
  location: GeoPoint
  /** ISO 8601 with offset. */
  start: string
  end?: string
  price: EventPrice
  age: AgeSuitability
  /** True for small, local, or lesser-known events. */
  local: boolean
  description: string
  source: DataSource
}
