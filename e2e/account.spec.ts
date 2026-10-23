import { expectNoPageErrors, expect, test } from './fixtures'
import { firstProducerPath, firstProductPath, waitForHydration } from './helpers'
import { signInAs } from './auth'

/**
 * The account lists. Favouriting and following used to be write-only: there
 * was nowhere to see what was saved. The round trip below saves, lists,
 * removes and lists again, signed in through the real magic-link flow.
 */

test('favourited products appear on the favourites page', async ({ page, pageErrors }) => {
  await signInAs(page)

  const path = await firstProductPath(page)
  await page.goto(path)
  await waitForHydration(page)

  const heart = page.getByRole('button', { name: /омилени/ })
  await expect(heart).toBeVisible()
  await heart.click()
  await expect(heart).toHaveAttribute('aria-pressed', 'true')

  await page.goto('/account/favourites')
  await waitForHydration(page)

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Омилени')
  const card = page.locator('article h2').first()
  await expect(card).toBeVisible()

  const title = await card.textContent()

  // Removing it empties the page again.
  await page.goto(path)
  await waitForHydration(page)
  await page.getByRole('button', { name: /омилени/ }).click()
  await expect(page.getByRole('button', { name: /омилени/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  )

  await page.goto('/account/favourites')
  await expect(page.getByText('Сѐ уште немате омилени производи.')).toBeVisible()
  expect(title?.trim()).toBeTruthy()

  expectNoPageErrors(pageErrors)
})

test('followed producers appear on the following page', async ({ page, pageErrors }) => {
  await signInAs(page)

  const path = await firstProducerPath(page)
  await page.goto(path)
  await waitForHydration(page)

  const follow = page.getByRole('button', { name: 'Следи', exact: true })
  await expect(follow).toBeVisible()
  await follow.click()
  await expect(page.getByRole('button', { name: 'Следите' })).toBeVisible()

  const name = await page.locator('h1').first().textContent()

  await page.goto('/account/following')
  await waitForHydration(page)

  await expect(page.getByRole('heading', { level: 1 })).toContainText('следам')
  await expect(page.getByText(name?.trim() ?? '', { exact: false }).first()).toBeVisible()

  // Unfollowing empties the page again.
  await page.goto(path)
  await waitForHydration(page)
  await page.getByRole('button', { name: 'Следите' }).click()
  await expect(page.getByRole('button', { name: 'Следи', exact: true })).toBeVisible()

  await page.goto('/account/following')
  await expect(page.getByText('Сѐ уште не следите ниедна продавница.')).toBeVisible()

  expectNoPageErrors(pageErrors)
})
