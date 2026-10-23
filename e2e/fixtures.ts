import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { expect, test as base } from '@playwright/test'

const execFileAsync = promisify(execFile)

/**
 * A test that also collects everything the page complains about: console
 * errors, failed requests and uncaught exceptions. A page that renders but
 * logs errors is not a page that works.
 */
export const test = base.extend<{ pageErrors: string[]; isolateRateLimits: void }>({
  isolateRateLimits: [
    async ({ page: _page }, use) => {
      // The whole suite talks to one dev server from one address, so the
      // rate limiter would otherwise throttle later tests for the sins of
      // earlier ones. Each test starts with a clean slate.
      await execFileAsync('pnpm', [
        'exec',
        'wrangler',
        'd1',
        'execute',
        'DB',
        '--local',
        '--command',
        'DELETE FROM rateLimit',
      ]).catch(() => undefined)
      await use()
    },
    { auto: true },
  ],
  pageErrors: async ({ page }, use) => {
    const errors: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    await use(errors)
  },
})

export { expect }

/** Fails with the collected messages, so a failure says what went wrong. */
export function expectNoPageErrors(errors: readonly string[]): void {
  expect(errors, `The page reported errors:\n${errors.join('\n')}`).toEqual([])
}
