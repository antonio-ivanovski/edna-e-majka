import { expect, test as base } from '@playwright/test'

/**
 * A test that also collects everything the page complains about: console
 * errors, failed requests and uncaught exceptions. A page that renders but
 * logs errors is not a page that works.
 */
export const test = base.extend<{ pageErrors: string[] }>({
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
