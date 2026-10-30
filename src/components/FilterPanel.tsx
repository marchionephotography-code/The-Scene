import {
  AGE_LABELS,
  CATEGORIES,
  DISTANCE_OPTIONS,
  PRICE_LABELS,
  type AgeFilter,
  type Filters,
  type PriceFilter,
} from '../lib/discovery'
import type { LibraryStatus } from '../data/eventSource'
import type { Category } from '../types/event'

interface Props {
  filters: Filters
  hasLocation: boolean
  onChange: (patch: Partial<Filters>) => void
  /** Which library calendars answered, for the "Hosted by" note. */
  libraries?: LibraryStatus[]
}

export function FilterPanel({ filters, hasLocation, onChange, libraries = [] }: Props) {
  const toggleCategory = (c: Category) =>
    onChange({
      categories: filters.categories.includes(c)
        ? filters.categories.filter((x) => x !== c)
        : [...filters.categories, c],
    })

  return (
    <div className="filters">
      <fieldset className="filters__group">
        <legend>Category</legend>
        <div className="chips">
          {CATEGORIES.map((c) => {
            const on = filters.categories.includes(c.id)
            return (
              <button key={c.id} type="button" className={`chip${on ? ' chip--on' : ''}`} aria-pressed={on} onClick={() => toggleCategory(c.id)}>
                {c.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="filters__group">
        <legend>Distance</legend>
        <div className="chips">
          {DISTANCE_OPTIONS.map((mi) => {
            const on = filters.maxMiles === mi
            return (
              <button key={mi} type="button" className={`chip${on ? ' chip--on' : ''}`} aria-pressed={on} disabled={!hasLocation} onClick={() => onChange({ maxMiles: mi })}>
                {mi} mi
              </button>
            )
          })}
          <button type="button" className={`chip${filters.maxMiles === null ? ' chip--on' : ''}`} aria-pressed={filters.maxMiles === null} disabled={!hasLocation} onClick={() => onChange({ maxMiles: null })}>
            Any
          </button>
        </div>
        {!hasLocation && <p className="hint">Set a location to filter by distance.</p>}
      </fieldset>

      <fieldset className="filters__group">
        <legend>Price</legend>
        <div className="chips">
          {(Object.keys(PRICE_LABELS) as PriceFilter[]).map((p) => {
            const on = filters.price === p
            return (
              <button key={p} type="button" className={`chip${on ? ' chip--on' : ''}`} aria-pressed={on} onClick={() => onChange({ price: p })}>
                {PRICE_LABELS[p]}
              </button>
            )
          })}
        </div>
        <p className="hint">Based on the lowest listed ticket price.</p>
      </fieldset>

      <fieldset className="filters__group">
        <legend>Ages</legend>
        <div className="chips">
          {(Object.keys(AGE_LABELS) as AgeFilter[]).map((a) => {
            const on = filters.age === a
            return (
              <button key={a} type="button" className={`chip${on ? ' chip--on' : ''}`} aria-pressed={on} onClick={() => onChange({ age: a })}>
                {AGE_LABELS[a]}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="filters__group">
        <legend>Hosted by</legend>
        <div className="chips">
          <button
            type="button"
            className={`chip${filters.libraryOnly ? ' chip--on' : ''}`}
            aria-pressed={filters.libraryOnly}
            onClick={() => onChange({ libraryOnly: !filters.libraryOnly })}
          >
            Public libraries
          </button>
        </div>
        {libraries.length > 0 && (
          <ul className="lib-status" aria-label="Library calendars">
            {libraries.map((l) => (
              <li key={l.id}>
                <span className={`lib-status__dot lib-status__dot--${l.status}`} aria-hidden="true" />
                {l.name}:{' '}
                {l.status === 'ok' ? `${l.count} upcoming ${l.count === 1 ? 'event' : 'events'} from its calendar` : 'calendar not reachable right now, showing sample library events'}
              </li>
            ))}
          </ul>
        )}
      </fieldset>
    </div>
  )
}
