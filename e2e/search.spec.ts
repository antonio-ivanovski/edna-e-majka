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

/**
 * The cheapest price on each card, in denars. Prices print grouped
 * (`1.200 МКД`), so every non-digit goes: what is left is whole denars.
 */
async function productPrices(page: Page): Promise<number[]> {
  return page.locator('article').evaluateAll((cards) =>
    cards.map((card) => {
      const amounts = [...(card.textContent ?? '').matchAll(/([\d.]+)\s*МКД/g)].map((match) =>
        Number(match[1]!.replace(/\D/g, '')),
      )
      return amounts.length > 0 ? Math.min(...amounts) : Number.NaN
    }),
  )
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

test('the sort control reorders the catalogue by price', async ({ page, pageErrors }) => {
  const term = encodeURIComponent('мед')
  await page.goto(`/search?q=${term}`)
  await waitForHydration(page)

  const before = await productTitles(page)
  expect(before.length).toBeGreaterThan(1)

  await page.getByText('Филтри', { exact: true }).click()
  await page.getByRole('button', { name: 'Цена', exact: true }).click()
  await expect.poll(() => page.url(), { timeout: 10_000 }).toContain('sort=price')

  // Same products, cheapest first.
  const afterTitles = await productTitles(page)
  expect(afterTitles.slice().sort()).toEqual(before.slice().sort())

  // The address updates before the loader data lands, so wait for the
  // cheapest prices to settle into ascending order.
  await expect
    .poll(
      async () => {
        const prices = await productPrices(page)
        if (prices.length === 0) return false
        const sorted = prices.slice().sort((a, b) => a - b)
        return prices.every((p, i) => p === sorted[i])
      },
      { timeout: 10_000 },
    )
    .toBe(true)

  const afterPrices = await productPrices(page)
  expect(afterPrices.every((price) => Number.isFinite(price))).toBe(true)
  expect(afterPrices).toEqual(afterPrices.slice().sort((a, b) => a - b))

  expectNoPageErrors(pageErrors)
})

test('an out-of-range page clamps to the catalogue instead of crashing', async ({
  page,
  pageErrors,
}) => {
  const term = encodeURIComponent('мед')
  await page.goto(`/search?q=${term}`)
  await waitForHydration(page)

  const firstPage = await productTitles(page)
  expect(firstPage.length).toBeGreaterThan(0)

  // The server clamps a beyond-the-end page to the last page, so the list
  // stays whole instead of an error boundary. (A dedicated empty state with
  // a back-to-first-page link would live in the catalogue list, which this
  // slice does not own.)
  await page.goto(`/search?q=${term}&page=999`)
  await waitForHydration(page)

  await expect(page.getByRole('heading', { name: /Резултати за/ })).toBeVisible()
  expect(await productTitles(page)).toEqual(firstPage)
  await expect(page.getByRole('alert')).toHaveCount(0)

  expectNoPageErrors(pageErrors)
})

test('garbage search params degrade to the default list instead of crashing', async ({
  page,
  pageErrors,
}) => {
  await page.goto('/search?q=мед&page=-1&sort=nope&minPrice=abc')
  await waitForHydration(page)

  // Lenient schemas normalise the address; the page still lists results.
  await expect(page.getByRole('heading', { name: /Резултати за/ })).toBeVisible()
  expect((await productTitles(page)).length).toBeGreaterThan(0)
  await expect(page.getByRole('alert')).toHaveCount(0)

  expectNoPageErrors(pageErrors)
})
