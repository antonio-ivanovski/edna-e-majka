import { defineConfig, devices } from '@playwright/test'

/**
 * The smoke suite runs against a real dev server so it exercises the same
 * thing a visitor gets: server-rendered HTML, hydrated React and the real
 * local D1 and R2.
 *
 * The port is the one the app is configured for (`BETTER_AUTH_URL` and
 * `APP_URL` both point at it), because the magic-link e-mail contains an
 * absolute URL on that host.
 */
const PORT = Number(process.env.E2E_PORT ?? 3002)
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.artifacts',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm dev --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
