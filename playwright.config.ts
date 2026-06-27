import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests: drive the BUILT bundle (`dist/material-thermostat-card.js`)
 * in a real browser against a mock `hass`, exercising full user journeys.
 * Run `npm run build` first (the CI workflow does this before `test:e2e`).
 *
 * Locally we use the system Chrome channel (no browser download); in CI we use
 * Playwright's bundled chromium (installed via `playwright install chromium`).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list']],
  use: {
    baseURL: 'http://localhost:8765',
    trace: 'on-first-retry',
    ...(process.env.CI ? {} : { channel: 'chrome' }),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'python3 -m http.server 8765',
    url: 'http://localhost:8765/e2e/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
