import type { Page } from '@playwright/test'

import { expectNoPageErrors, expect, test } from './fixtures'
import { waitForHydration } from './helpers'

/**
 * The filters have to reach the catalogue. They used to be dropped on the
 * search page, so the address said one thing and the list said another.
 */

/** The titles of the products in the list. */
async function productTitles(page: Page): Promise<string[]> {
  return page.locator('article h2').allInnerTexts()
}

test('the search page honours the category filter', async ({ page, pageErrors }) => {
  const term = encodeURIComponent('мед')
  await page.goto(`/search?q=${term}`)
  await waitForHydration(page)

  const all = await productTitles(page)
  expect(all.length).toBeGreaterThan(0)

  // Nothing at all: a category that does not exist.
  await page.goto(`/search?q=${term}&categorySlugs=nothing-here`)
  await waitForHydration(page)

  expect(await productTitles(page)).toHaveLength(0)

  expectNoPageErrors(pageErrors)
})

test('the search page honours the price filter', async ({ page, pageErrors }) => {
  const term = encodeURIComponent('мед')
  await page.goto(`/search?q=${term}`)
  await waitForHydration(page)

  const all = await productTitles(page)
  expect(all.length).toBeGreaterThan(0)

  // A price no product reaches.
  await page.goto(`/search?q=${term}&minPrice=999999`)
  await waitForHydration(page)

  expect(await productTitles(page)).toHaveLength(0)

  expectNoPageErrors(pageErrors)
})

test('the search page honours the stock filter', async ({ page, pageErrors }) => {
  const term = encodeURIComponent('мед')
  await page.goto(`/search?q=${term}&inStock=1`)
  await waitForHydration(page)

  // Everything in the demo catalogue is in stock, so the list is the same,
  // but the filter has to survive the round trip. The server canonicalises
  // the address (JSON-parseable values are quoted), so only the key is stable.
  expect(page.url()).toContain('inStock=')
  expect((await productTitles(page)).length).toBeGreaterThan(0)

  // And the control itself has to work: unchecking drops it from the address.
  await page.getByText('Филтри', { exact: true }).click()
  const stock = page.getByLabel('Само на залиха')
  await expect(stock).toBeChecked()
  await stock.click()
  await expect.poll(() => page.url(), { timeout: 10_000 }).not.toContain('inStock')
  await expect(stock).not.toBeChecked()

  expectNoPageErrors(pageErrors)
})

test('the sort control reorders the catalogue', async ({ page, pageErrors }) => {
  const term = encodeURIComponent('мед')
  await page.goto(`/search?q=${term}`)
  await waitForHydration(page)

  const before = await productTitles(page)
  expect(before.length).toBeGreaterThan(1)

  await page.getByText('Филтри', { exact: true }).click()
  await page.getByRole('button', { name: 'Цена', exact: true }).click()
  await expect.poll(() => page.url(), { timeout: 10_000 }).toContain('sort=')

  const after = await productTitles(page)
  expect(after.slice().sort()).toEqual(before.slice().sort())

  expectNoPageErrors(pageErrors)
})
