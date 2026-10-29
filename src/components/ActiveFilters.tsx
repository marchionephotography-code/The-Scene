import {
  AGE_LABELS,
  CATEGORIES,
  DATE_LABELS,
  DEFAULT_FILTERS,
  MOODS,
  PRICE_LABELS,
  type Filters,
} from '../lib/discovery'

interface Props {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  onReset: () => void
}

interface Active {
  key: string
  label: string
  clear: Partial<Filters>
}

function describeDate(f: Filters): string {
  if (f.date.kind !== 'custom') return DATE_LABELS[f.date.kind]
  const fmt = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  return f.date.from === f.date.to ? fmt(f.date.from) : `${fmt(f.date.from)} – ${fmt(f.date.to)}`
}

export function ActiveFilters({ filters, onChange, onReset }: Props) {
  const active: Active[] = []
  if (filters.query.trim()) active.push({ key: 'q', label: `“${filters.query.trim()}”`, clear: { query: '' } })
  if (filters.mood) active.push({ key: 'mood', label: MOODS.find((m) => m.id === filters.mood)!.label, clear: { mood: null } })
  if (filters.date.kind !== 'any') active.push({ key: 'date', label: describeDate(filters), clear: { date: { kind: 'any' } } })
  for (const c of filters.categories) {
    active.push({
      key: `cat-${c}`,
      label: CATEGORIES.find((x) => x.id === c)!.label,
      clear: { categories: filters.categories.filter((x) => x !== c) },
    })
  }
  if (filters.maxMiles !== DEFAULT_FILTERS.maxMiles)
    active.push({ key: 'mi', label: filters.maxMiles === null ? 'Any distance' : `Within ${filters.maxMiles} mi`, clear: { maxMiles: DEFAULT_FILTERS.maxMiles } })
  if (filters.price !== 'any') active.push({ key: 'price', label: PRICE_LABELS[filters.price], clear: { price: 'any' } })
  if (filters.age !== 'any') active.push({ key: 'age', label: AGE_LABELS[filters.age], clear: { age: 'any' } })

  if (!active.length) return null

  return (
    <div className="active" aria-label="Active filters">
      <ul className="active__list">
        {active.map((a) => (
          <li key={a.key}>
            <button type="button" className="tag tag--removable" onClick={() => onChange(a.clear)} aria-label={`Remove filter: ${a.label}`}>
              {a.label} <span aria-hidden="true">✕</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="link-btn" onClick={onReset}>Reset all</button>
    </div>
  )
}
