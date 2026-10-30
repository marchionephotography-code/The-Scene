import { Check, MapPin, Navigation } from 'lucide-react'
import { SAMPLE_TOWNS } from '../data/sampleEvents'
import type { LocationState } from '../hooks/useLocation'
import type { GeoPoint } from '../types/event'

interface Props {
  state: LocationState
  onUseDevice: () => void
  onPickTown: (label: string, point: GeoPoint) => void
}

/** Uber-style list of location choices: current location first, then towns. */
export function LocationBar({ state, onUseDevice, onPickTown }: Props) {
  const deviceOn = state.status === 'device'
  const deviceSub =
    state.status === 'locating' ? 'Finding you…'
    : state.status === 'device' ? 'Using your location'
    : state.status === 'denied' || state.status === 'unavailable' ? state.message
    : 'Asks your browser for permission'

  return (
    <ul className="rows" aria-label="Location">
      <li>
        <button type="button" className="row" aria-pressed={deviceOn} onClick={onUseDevice} disabled={state.status === 'locating'}>
          <span className="row__icon row__icon--dark"><Navigation size={18} strokeWidth={2.25} aria-hidden="true" /></span>
          <span className="row__text">
            <span className="row__main">Use my current location</span>
            <span className={`row__sub${state.status === 'denied' || state.status === 'unavailable' ? ' row__sub--warn' : ''}`} role="status">
              {deviceSub}
            </span>
          </span>
          {deviceOn && <Check size={20} strokeWidth={2.5} className="row__check" aria-hidden="true" />}
        </button>
      </li>
      {SAMPLE_TOWNS.map((t) => {
        const on = state.status === 'manual' && state.label === t.name
        return (
          <li key={t.name}>
            <button type="button" className="row" aria-pressed={on} onClick={() => onPickTown(t.name, { lat: t.lat, lng: t.lng })}>
              <span className="row__icon"><MapPin size={18} strokeWidth={2.25} aria-hidden="true" /></span>
              <span className="row__text">
                <span className="row__main">{t.name}</span>
              </span>
              {on && <Check size={20} strokeWidth={2.5} className="row__check" aria-hidden="true" />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
