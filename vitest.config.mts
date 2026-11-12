// Unit tests only; the browser tests in e2e/ run with Playwright (npm run test:e2e).
export default {
  test: { exclude: ['e2e/**', 'node_modules/**', 'dist/**'] },
}
