import { Search, SlidersHorizontal } from 'lucide-react'

interface Props {
  place: string | null
  detail: string
  filterCount: number
  onOpenSearch: () => void
  onOpenFilters: () => void
}

export function SearchPill({ place, detail, filterCount, onOpenSearch, onOpenFilters }: Props) {
  return (
    <div className="searchbar">
      <button type="button" className="pill" onClick={onOpenSearch} aria-label={`Change where and when. ${place ?? 'No location set'}, ${detail}`}>
        <Search size={20} strokeWidth={2.5} className="pill__icon" aria-hidden="true" />
        <span className="pill__text">
          <span className="pill__main">{place ?? 'Where to?'}</span>
          <span className="pill__sub">{detail}</span>
        </span>
      </button>
      <button
        type="button"
        className="round-btn"
        onClick={onOpenFilters}
        aria-label={filterCount ? `Filters, ${filterCount} on` : 'Filters'}
      >
        <SlidersHorizontal size={18} strokeWidth={2.25} aria-hidden="true" />
        {filterCount > 0 && <span key={filterCount} className="round-btn__count" aria-hidden="true">{filterCount}</span>}
      </button>
    </div>
  )
}
