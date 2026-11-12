/* The Scene service worker: lets the app open offline and load fast.
   Pages: network first, falling back to the cached copy.
   Built files (hashed names): cache first. Outside data is never cached. */
const CACHE = 'scene-v2'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // App pages (/app/…, /e/…): network first, falling back to the saved app.
  if (req.mode === 'navigate' && (url.pathname.startsWith('/app') || url.pathname.startsWith('/e/'))) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/app/', copy))
          return res
        })
        .catch(() => caches.match('/app/')),
    )
    return
  }

  if (url.pathname.includes('/assets/') || /\.(png|svg|webmanifest|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(req, copy))
            }
            return res
          }),
      ),
    )
  }
})
