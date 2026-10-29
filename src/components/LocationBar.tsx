import { SAMPLE_TOWNS } from '../data/sampleEvents'
import type { LocationState } from '../hooks/useLocation'
import type { GeoPoint } from '../types/event'

interface Props {
  state: LocationState
  onUseDevice: () => void
  onPickTown: (label: string, point: GeoPoint) => void
}

export function LocationBar({ state, onUseDevice, onPickTown }: Props) {
  const label =
    state.status === 'device' || state.status === 'manual'
      ? state.label
      : state.status === 'locating'
        ? 'Finding you…'
        : 'Choose a location'

  const selected = state.status === 'manual' ? state.label : ''

  return (
    <section className="location" aria-label="Location">
      <div className="location__row">
        <span className="location__pin" aria-hidden="true">📍</span>
        <span className="location__label">{label}</span>
      </div>
      <div className="location__controls">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onUseDevice}
          disabled={state.status === 'locating'}
        >
          Use my location
        </button>
        <label className="sr-only" htmlFor="town-pick">Or pick a town</label>
        <select
          id="town-pick"
          className="select"
          value={selected}
          onChange={(e) => {
            const town = SAMPLE_TOWNS.find((t) => t.name === e.target.value)
            if (town) onPickTown(town.name, { lat: town.lat, lng: town.lng })
          }}
        >
          <option value="" disabled>Pick a town…</option>
          {SAMPLE_TOWNS.map((t) => (
            <option key={t.name} value={t.name}>{t.name}</option>
          ))}
        </select>
      </div>
      {(state.status === 'denied' || state.status === 'unavailable') && (
        <p className="location__note" role="status">{state.message}</p>
      )}
    </section>
  )
}
