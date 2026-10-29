import { useCallback, useState } from 'react'
import type { GeoPoint } from '../types/event'

export type LocationState =
  | { status: 'unset' }
  | { status: 'locating' }
  | { status: 'device'; point: GeoPoint; label: string }
  | { status: 'manual'; point: GeoPoint; label: string }
  | { status: 'denied' | 'unavailable'; message: string }

/**
 * Device location only after the user taps "Use my location" — we never
 * prompt for permission on page load. Manual pick is always available.
 */
export function useLocation() {
  const [state, setState] = useState<LocationState>({ status: 'unset' })

  const requestDevice = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'unavailable', message: "This browser can't share location. Pick a town instead." })
      return
    }
    setState({ status: 'locating' })
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: 'device',
          point: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          label: 'Near you',
        }),
      (err) =>
        setState(
          err.code === err.PERMISSION_DENIED
            ? { status: 'denied', message: 'Location is off. Pick a town instead.' }
            : { status: 'unavailable', message: "Couldn't find your location. Pick a town instead." },
        ),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    )
  }, [])

  const setManual = useCallback((label: string, point: GeoPoint) => {
    setState({ status: 'manual', point, label })
  }, [])

  const point = state.status === 'device' || state.status === 'manual' ? state.point : null
  return { state, point, requestDevice, setManual }
}
