import { expectNoPageErrors, expect, test } from './fixtures'
import { firstProductPath, waitForHydration } from './helpers'

/**
 * The product page. It used to fall over during the server render, so the
 * first assertion reads the raw markup: the title has to be in the HTML the
 * server sends, not painted in later by the browser.
 */

test('the product page server-renders its title', async ({ page, pageErrors }) => {
  const path = await firstProductPath(page)

  const response = await page.request.get(path)
  const html = await response.text()

  expect(response.ok()).toBe(true)
  expect(html).not.toContain('Switched to client rendering')
  expect(html).toContain('<h1')

  await page.goto(path)
  const rendered = await page.locator('h1').first().textContent()

  expect(rendered?.trim()).toBeTruthy()
  expect(html).toContain(rendered!.trim())

  expectNoPageErrors(pageErrors)
})

test('the product page exposes canonical, OG and JSON-LD head tags', async ({
  page,
  pageErrors,
}) => {
  const path = await firstProductPath(page)
  await page.goto(path)
  await waitForHydration(page)

  const canonical = page.locator('link[rel="canonical"]')
  await expect(canonical).toHaveCount(1)
  await expect(canonical).toHaveAttribute('href', /\/products\//)

  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'product')

  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
  expect((ogTitle ?? '').trim().length).toBeGreaterThan(0)

  const ldJson = page.locator('script[type="application/ld+json"]')
  expect(await ldJson.count()).toBeGreaterThan(0)
  expect(((await ldJson.first().textContent()) ?? '').length).toBeGreaterThan(0)

  expectNoPageErrors(pageErrors)
})

test('the enquiry form accepts and submits a valid email', async ({ page, pageErrors }) => {
  const path = await firstProductPath(page)
  await page.goto(path)
  await waitForHydration(page)

  await page.getByLabel('Име').fill('Тест Тестов')
  await page.getByLabel('Е-маил').fill('e2e@example.com')
  await page
    .getByLabel('Порака')
    .fill('Добар ден, дали го имате производот на залиха? Ви благодарам.')

  await page.getByRole('button', { name: 'Испрати порака' }).click()

  await expect(page.getByText('Пораката е испратена')).toBeVisible({ timeout: 15_000 })

  expectNoPageErrors(pageErrors)
})

test('the report dialog needs a real reason', async ({ page, pageErrors }) => {
  const path = await firstProductPath(page)
  await page.goto(path)
  await waitForHydration(page)

  await page.getByRole('button', { name: 'Пријави' }).click()

  const dialog = page.getByRole('dialog', { name: 'Пријави злоупотреба' })
  await expect(dialog).toBeVisible()

  const reason = dialog.getByLabel(/Причина/)
  const send = dialog.getByRole('button', { name: 'Испрати' })

  // Too short: the submit stays out of reach and the dialog stays usable.
  await reason.fill('лошо')
  await expect(send).toBeDisabled()

  await expect.poll(() => page.url(), { timeout: 5_000 }).not.toContain('undefined')

  expectNoPageErrors(pageErrors)
})

test('the favourite control answers when signed out', async ({ page, pageErrors }) => {
  const path = await firstProductPath(page)
  await page.goto(path)
  await waitForHydration(page)

  const heart = page.getByRole('button', { name: /омилени/ })
  await expect(heart).toBeVisible()
  await expect(heart).toHaveAttribute('aria-pressed', 'false')
  await heart.click()

  await expect(page.getByText('Треба да сте најавени')).toBeVisible()

  expectNoPageErrors(pageErrors)
})
