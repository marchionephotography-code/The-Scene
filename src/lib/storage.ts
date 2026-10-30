/**
 * Small, failure-tolerant wrapper around localStorage. Saved items live only
 * in this browser on this device; reads fall back to a default when storage
 * is blocked (private windows, embedded previews) so the app still works.
 */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: keep working in memory for this visit.
  }
}
