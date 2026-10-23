import { expectNoPageErrors, expect, test } from './fixtures'
import { addNotification, signInAs, signInAsOwner } from './auth'
import { waitForHydration } from './helpers'

/**
 * The notification centre and the search suggestions.
 */

test('search suggestions highlight the match and answer to the keyboard', async ({
  page,
  pageErrors,
}) => {
  await page.goto('/')
  await waitForHydration(page)

  const box = page.getByRole('combobox', { name: /Пребарај/ })
  await box.click()
  await box.fill('мед')

  const list = page.getByRole('listbox', { name: /Предлози/ })
  await expect(list).toBeVisible({ timeout: 15_000 })

  // The matched part stands out.
  await expect(list.locator('mark').first()).toContainText('мед', { ignoreCase: true })

  // Arrow keys walk the rows, enter picks the highlighted one.
  await box.press('ArrowDown')
  await expect(list.getByRole('option').first()).toHaveAttribute('aria-selected', 'true')
  await box.press('Enter')

  await expect
    .poll(() => new URL(page.url()).searchParams.get('q'), { timeout: 10_000 })
    .toBe('Акациев мед')

  expectNoPageErrors(pageErrors)
})

test('the notification centre counts down the moment everything is read', async ({
  page,
  pageErrors,
}) => {
  const { userId } = await signInAs(page)
  await addNotification({
    userId,
    kind: 'moderation',
    title: 'Измена на статусот',
    body: 'active',
    link: '/manage',
  })
  await page.reload()
  await waitForHydration(page)

  const bell = page.getByRole('button', { name: /Известувања/ })
  await expect(bell).toContainText('1')

  await bell.click()
  await expect(page.getByText('Известувања (1)')).toBeVisible()
  await expect(page.getByText('тукушто')).toBeVisible()

  await page.getByRole('button', { name: 'Означи сите' }).click()

  // The count drops with the tap, not with the round trip.
  await expect(page.getByText('Известувања (1)')).toBeHidden()
  await expect(bell).not.toContainText('1')

  expectNoPageErrors(pageErrors)
})

test('a new product notifies the followers by its name', async ({ page, pageErrors, browser }) => {
  const ownerContext = await browser.newContext()
  const ownerPage = await ownerContext.newPage()
  const owner = await signInAsOwner(ownerPage, { storeName: 'E2E Мед' })
  const productTitle = `E2E Производ ${Date.now() % 100000}`

  const follower = await signInAs(page)
  void follower
  await page.goto(`/producers/${owner.storeSlug}`)
  await waitForHydration(page)
  await page.getByRole('button', { name: 'Следи', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Следите' })).toBeVisible()

  await ownerPage.goto(`/manage/${owner.storeId}/products/new`)
  await waitForHydration(ownerPage)
  await ownerPage.getByLabel('Наслов').fill(productTitle)
  await ownerPage
    .getByLabel('Опис')
    .fill('Производ создаден од end-to-end тест за да се проверат известувањата.')
  await ownerPage.getByLabel('Мед', { exact: true }).check()
  await ownerPage.getByLabel('Пакување').first().fill('500 г')
  await ownerPage.getByLabel('Цена').first().fill('450')
  await ownerPage.getByRole('button', { name: 'Зачувај производ' }).click()
  await expect(ownerPage).not.toHaveURL(/\/new$/, { timeout: 15_000 })
  await expect(ownerPage).toHaveURL(/\/manage\/.+\/products\/.+/, { timeout: 15_000 })

  await page.reload()
  await waitForHydration(page)
  await page.getByRole('button', { name: /Известувања/ }).click()

  await expect(page.getByText('Нов производ')).toBeVisible()
  await expect(
    page.getByRole('button', { name: new RegExp(`Нов производ.*${productTitle}`) }),
  ).toBeVisible()

  await ownerContext.close()

  expectNoPageErrors(pageErrors)
})
