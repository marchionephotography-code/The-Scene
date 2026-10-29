import { DATE_LABELS, type DateFilter } from '../lib/discovery'

interface Props {
  value: DateFilter
  today: string // YYYY-MM-DD
  onChange: (d: DateFilter) => void
}

const KINDS: DateFilter['kind'][] = ['any', 'tonight', 'tomorrow', 'weekend', 'custom']

export function DateShortcuts({ value, today, onChange }: Props) {
  return (
    <section aria-label="When" className="dates">
      <div className="chips" role="group" aria-label="Date shortcuts">
        {KINDS.map((k) => {
          const on = value.kind === k
          return (
            <button
              key={k}
              type="button"
              className={`chip${on ? ' chip--on' : ''}`}
              aria-pressed={on}
              onClick={() =>
                onChange(k === 'custom' ? { kind: 'custom', from: today, to: today } : ({ kind: k } as DateFilter))
              }
            >
              {DATE_LABELS[k]}
            </button>
          )
        })}
      </div>
      {value.kind === 'custom' && (
        <div className="dates__custom">
          <label>
            From
            <input
              type="date"
              className="input"
              min={today}
              value={value.from}
              onChange={(e) => {
                const from = e.target.value || today
                onChange({ kind: 'custom', from, to: value.to < from ? from : value.to })
              }}
            />
          </label>
          <label>
            To
            <input
              type="date"
              className="input"
              min={value.from}
              value={value.to}
              onChange={(e) => onChange({ kind: 'custom', from: value.from, to: e.target.value || value.from })}
            />
          </label>
        </div>
      )}
    </section>
  )
}
