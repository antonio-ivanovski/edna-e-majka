import AxeBuilder from '@axe-core/playwright'

import { expectNoPageErrors, expect, test } from './fixtures'
import { firstProducerPath, firstProductPath, waitForHydration } from './helpers'

/**
 * The accessibility sweep: the landmarks, headings, image alternatives and
 * the keyboard path that every page shares.
 */

const PUBLIC_PATHS = ['/', '/search?q=мед', '/producers', '/categories/honey']

test('landmarks, one heading and labelled images hold on every public page', async ({
  page,
  pageErrors,
}) => {
  const productPath = await firstProductPath(page)

  for (const path of [...PUBLIC_PATHS, productPath]) {
    await page.goto(path)
    await waitForHydration(page)

    // One banner, one main, one footer; the skip link points at the main.
    await expect(page.getByRole('banner')).toHaveCount(1)
    await expect(page.getByRole('main')).toHaveCount(1)
    await expect(page.getByRole('contentinfo')).toHaveCount(1)
    await expect(page.getByRole('banner').first()).toBeVisible()
    await expect(page.locator('main#main-content')).toBeVisible()
    await expect(page.getByRole('contentinfo').first()).toBeVisible()

    const skip = page.getByRole('link', { name: 'Скокни на содржината' })
    await expect(skip).toHaveAttribute('href', '#main-content')

    // Exactly one top-level heading, and it names the page.
    const headings = page.locator('h1')
    await expect(headings).toHaveCount(1)
    expect(((await headings.first().textContent()) ?? '').trim().length).toBeGreaterThan(0)

    // The heading order never jumps: down at most one level at a time and
    // back up to the top only through h1, which itself comes first.
    const levels = await page
      .locator('h1, h2, h3, h4')
      .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))))
    expect(levels.length).toBeGreaterThan(0)
    expect(levels[0]).toBe(1)
    for (let index = 1; index < levels.length; index += 1) {
      expect(Math.abs(levels[index]! - levels[index - 1]!)).toBeLessThanOrEqual(1)
    }

    // Every image carries an alternative, even when it is deliberately empty.
    const missingAlt = await page
      .locator('img')
      .evaluateAll((nodes) => nodes.filter((node) => !node.hasAttribute('alt')).length)
    expect(missingAlt).toBe(0)

    // And the product photos themselves are never the empty kind: each card
    // photo names its product. (Store avatars stay deliberately empty as
    // decorative images, so only the product link's photo is checked.)
    const emptyProductAlt = await page
      .locator('article a[href^="/products/"] img')
      .evaluateAll(
        (nodes) =>
          nodes.filter((node) => ((node as HTMLImageElement).alt ?? '').trim() === '').length,
      )
    expect(emptyProductAlt).toBe(0)
  }

  expectNoPageErrors(pageErrors)
})

test('axe finds no violations on the key pages', async ({ page, pageErrors }) => {
  const productPath = await firstProductPath(page)
  const producerPath = await firstProducerPath(page)

  // Admin pages stay out of the sweep: they sit behind auth and axe would
  // only see the sign-in redirect.
  for (const path of [
    '/',
    '/search?q=мед',
    '/producers',
    '/categories/honey',
    productPath,
    producerPath,
  ]) {
    await page.goto(path)
    await waitForHydration(page)

    const results = await new AxeBuilder({ page }).analyze()
    expect(
      results.violations,
      `${path} has axe violations:\n${results.violations.map((violation) => ` - ${violation.id}: ${violation.nodes.length} nodes`).join('\n')}`,
    ).toEqual([])
  }

  expectNoPageErrors(pageErrors)
})

test('the keyboard reaches the content and the focus stays visible', async ({
  page,
  pageErrors,
}) => {
  await page.goto('/')
  await waitForHydration(page)

  // The first Tab lands on the skip link and the focus ring shows.
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Скокни на содржината' })
  await expect(skip).toBeFocused()

  const outline = await skip.evaluate((node) => getComputedStyle(node).outlineStyle)
  expect(outline).toBe('solid')

  // Following it moves focus onto the main content, past the cookie banner.
  await skip.click()
  await expect(page.locator('main#main-content')).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.id), { timeout: 5_000 })
    .toBe('main-content')

  // The search box is reachable by keyboard and announces its list.
  const box = page.getByRole('combobox', { name: /Пребарај/ })
  await box.focus()
  await expect(box).toBeFocused()
  await expect(box).toHaveAttribute('aria-autocomplete', 'list')

  expectNoPageErrors(pageErrors)
})
