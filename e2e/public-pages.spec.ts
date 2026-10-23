import { expectNoPageErrors, expect, test } from './fixtures'

/**
 * The public pages, the way a visitor reaches them. Each one has to render
 * and has to stay quiet in the console.
 */

test('the home page renders the catalogue', async ({ page, pageErrors }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('article').first()).toBeVisible()

  expectNoPageErrors(pageErrors)
})

test('a category page renders its products', async ({ page, pageErrors }) => {
  await page.goto('/categories/honey')

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  expectNoPageErrors(pageErrors)
})

test('a search page renders its results', async ({ page, pageErrors }) => {
  const term = encodeURIComponent('џем')
  await page.goto(`/search?q=${term}`)

  await expect(page.getByRole('heading', { level: 1 })).toContainText('џем')

  expectNoPageErrors(pageErrors)
})

test('a producer page renders', async ({ page, pageErrors }) => {
  await page.goto('/producers')

  const link = page.locator('a[href^="/producers/"]').first()
  await expect(link).toBeVisible()
  await link.click()

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  expectNoPageErrors(pageErrors)
})
