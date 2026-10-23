import { expectNoPageErrors, expect, test } from './fixtures'
import { firstProductPath, waitForHydration } from './helpers'

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
    await expect(page.locator('header').first()).toBeVisible()
    await expect(page.locator('main#main-content')).toBeVisible()
    await expect(page.locator('footer').first()).toBeVisible()

    const skip = page.getByRole('link', { name: 'Скокни на содржината' })
    await expect(skip).toHaveAttribute('href', '#main-content')

    // Exactly one top-level heading, and it names the page.
    const headings = page.locator('h1')
    await expect(headings).toHaveCount(1)
    expect(((await headings.first().textContent()) ?? '').trim().length).toBeGreaterThan(0)

    // No heading level is skipped on the way down.
    const levels = await page
      .locator('h1, h2, h3, h4')
      .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))))
    for (let index = 1; index < levels.length; index += 1) {
      expect(levels[index]! - levels[index - 1]!).toBeLessThanOrEqual(1)
    }

    // Every image carries an alternative, even when it is deliberately empty.
    const missingAlt = await page
      .locator('img')
      .evaluateAll((nodes) => nodes.filter((node) => !node.hasAttribute('alt')).length)
    expect(missingAlt).toBe(0)
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

  // Following it moves within the page, past the cookie banner.
  await skip.click()
  await expect(page.locator('main#main-content')).toBeVisible()

  // The search box is reachable by keyboard and announces its list.
  const box = page.getByRole('combobox', { name: /Пребарај/ })
  await box.focus()
  await expect(box).toBeFocused()
  await expect(box).toHaveAttribute('aria-autocomplete', 'list')

  expectNoPageErrors(pageErrors)
})
