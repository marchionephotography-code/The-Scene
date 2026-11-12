import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests: real browsers clicking through the app like a person.
 * Runs against the production build (npm run build first). Outside data
 * (weather, maps, event feeds) is blocked so tests use the sample events.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4319', trace: 'retain-on-failure' },
  projects: [
    { name: 'phone', use: { ...devices['iPhone 14'], browserName: 'chromium' } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 860 } } },
  ],
  webServer: {
    command: 'npx vite preview --port 4319 --strictPort',
    url: 'http://localhost:4319',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
