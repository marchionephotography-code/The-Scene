/** The area The Scene searches: about a 2-hour drive around Anderson, SC. */
export const AREA = {
  name: 'Upstate SC and nearby',
  center: { lat: 34.5034, lng: -82.6501 }, // Anderson, SC
  radiusMiles: 120,
}

/** "2026-10-31" for API date filters. */
export function isoDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export async function fetchJson<T>(url: string, timeoutMs = 7000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}
