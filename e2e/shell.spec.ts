import type { Page } from '@playwright/test'

import { expectNoPageErrors, expect, test } from './fixtures'
import { waitForHydration } from './helpers'

/**
 * The shell: the header, the theme switch and the way the page fits a phone.
 */

/** The colour of the content surface, which the theme has to change. */
async function surfaceColour(page: Page): Promise<string> {
  return page.evaluate(() => {
    const main = document.querySelector('main')
    const surface = main?.parentElement ?? document.body
    return getComputedStyle(surface).backgroundColor
  })
}

test('the dark-mode toggle changes the surface of the page', async ({ page, pageErrors }) => {
  await page.goto('/')
  await waitForHydration(page)

  const before = await surfaceColour(page)

  await page.getByRole('button', { name: /тема/i }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  const after = await surfaceColour(page)

  expect(after, 'the page surface should change with the theme').not.toBe(before)

  expectNoPageErrors(pageErrors)
})

test('the header fits a 390px phone without overflowing', async ({ page, pageErrors }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await waitForHydration(page)

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))

  expect(
    overflow.scrollWidth,
    'the page should not scroll sideways on a phone',
  ).toBeLessThanOrEqual(overflow.clientWidth + 1)

  // Every control of the header has to stay reachable.
  await expect(page.getByRole('searchbox')).toBeVisible()
  await expect(page.getByRole('button', { name: /тема/i })).toBeVisible()

  expectNoPageErrors(pageErrors)
})
