import { MOODS, type MoodId } from '../lib/discovery'

interface Props {
  value: MoodId | null
  onChange: (mood: MoodId | null) => void
}

export function MoodPicker({ value, onChange }: Props) {
  return (
    <section aria-labelledby="mood-heading" className="moods">
      <h1 id="mood-heading" className="moods__heading">What do you feel like doing?</h1>
      <div className="moods__grid">
        {MOODS.map((m) => {
          const on = value === m.id
          return (
            <button
              key={m.id}
              type="button"
              className={`mood${on ? ' mood--on' : ''}`}
              aria-pressed={on}
              onClick={() => onChange(on ? null : m.id)}
            >
              <span className="mood__emoji" aria-hidden="true">{m.emoji}</span>
              <span className="mood__label">{m.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
