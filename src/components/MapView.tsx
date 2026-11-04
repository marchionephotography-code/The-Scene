import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { CATEGORIES, type Recommendation } from '../lib/discovery'
import { formatPriceRange } from '../lib/money'
import type { GeoPoint } from '../types/event'

interface Props {
  items: Recommendation[]
  /** The viewer's location, drawn as a dot when known. */
  origin: GeoPoint | null
  center: GeoPoint
  onOpen: (id: string) => void
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function when(iso: string) {
  return new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/**
 * Events as pins. Several events at one venue share a pin, and its popup
 * lists them all. Map tiles come from OpenStreetMap.
 */
export function MapView({ items, origin, center, onOpen }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const openRef = useRef(onOpen)

  useEffect(() => {
    openRef.current = onOpen
  }, [onOpen])

  // Create the map once.
  useEffect(() => {
    if (!host.current || map.current) return
    const m = L.map(host.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false }).setView([center.lat, center.lng], 9)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    // Event buttons inside popups open the event sheet.
    const onClick = (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-event-id]')
      if (b) openRef.current(b.dataset.eventId!)
    }
    host.current.addEventListener('click', onClick)
    const el = host.current
    return () => {
      el.removeEventListener('click', onClick)
      m.remove()
      map.current = null
    }
  }, [center.lat, center.lng])

  // Redraw pins when results change.
  useEffect(() => {
    const m = map.current
    const g = layer.current
    if (!m || !g) return
    g.clearLayers()

    const byPlace = new Map<string, Recommendation[]>()
    for (const r of items) {
      const k = `${r.event.location.lat.toFixed(4)},${r.event.location.lng.toFixed(4)}`
      byPlace.set(k, [...(byPlace.get(k) ?? []), r])
    }

    const bounds: L.LatLngTuple[] = []
    for (const group of byPlace.values()) {
      const first = group[0].event
      const pos: L.LatLngTuple = [first.location.lat, first.location.lng]
      bounds.push(pos)
      const icon = L.divIcon({
        className: '',
        html: `<span class="pin pin--${first.category}"><b>${group.length > 1 ? group.length : ''}</b></span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 28],
        popupAnchor: [0, -26],
      })
      const html =
        `<div class="pop"><p class="pop__venue">${esc(first.venue)} · ${esc(first.town)}</p>` +
        group
          .slice(0, 6)
          .map(
            ({ event: e }) =>
              `<button type="button" class="pop__event" data-event-id="${esc(e.id)}">` +
              `<span class="pop__title">${esc(e.title)}</span>` +
              `<span class="pop__meta">${esc(when(e.start))} · ${esc(formatPriceRange(e.price))} · ${esc(CATEGORIES.find((c) => c.id === e.category)!.label)}</span>` +
              `</button>`,
          )
          .join('') +
        (group.length > 6 ? `<p class="pop__more">+${group.length - 6} more here</p>` : '') +
        `</div>`
      L.marker(pos, { icon, title: `${first.venue}: ${group.length} ${group.length === 1 ? 'event' : 'events'}`, keyboard: true })
        .bindPopup(html, { maxWidth: 280, closeButton: true })
        .addTo(g)
    }

    if (origin) {
      L.circleMarker([origin.lat, origin.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#3D6BFF', fillOpacity: 1 })
        .bindTooltip('You')
        .addTo(g)
      bounds.push([origin.lat, origin.lng])
    }

    if (bounds.length) m.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 })
  }, [items, origin])

  return (
    <div className="mapview">
      <div ref={host} className="mapview__map" role="region" aria-label="Map of events" />
      <p className="hint">{items.length ? 'Tap a pin to see what’s on there.' : 'No events to map with these filters.'}</p>
    </div>
  )
}
