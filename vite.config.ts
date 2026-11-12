import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig, type Connect, type Plugin } from 'vite'

/**
 * Two pages: the landing page at / and the app at /app/. App routes
 * (/app/…, /e/<id> event links) load the app, matching netlify.toml, so
 * dev and preview behave like the live site.
 */
function appRoutes(): Plugin {
  const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
    const url = req.url ?? '/'
    const path = url.split('?')[0]
    if ((path.startsWith('/e/') || path === '/app' || (path.startsWith('/app/') && !/\.[a-z0-9]+$/i.test(path))) && req.headers.accept?.includes('text/html')) {
      req.url = '/app/index.html'
    }
    next()
  }
  return {
    name: 'scene-app-routes',
    configureServer: (s) => { s.middlewares.use(rewrite) },
    configurePreviewServer: (s) => { s.middlewares.use(rewrite) },
  }
}

export default defineConfig({
  appType: 'mpa',
  plugins: [react(), appRoutes()],
  build: {
    rollupOptions: {
      input: {
        landing: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app/index.html'),
      },
    },
  },
})
