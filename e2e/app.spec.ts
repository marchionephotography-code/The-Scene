import { expect, test, type Page } from '@playwright/test'

// Keep tests on the built-in sample events: no outside calls.
test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort())
  await page.goto('/app/')
  await expect(page.locator('ul.grid > li').first()).toBeVisible()
  // The list fills in over a moment; wait until it's done.
  await expect.poll(() => page.locator('ul.grid > li').count()).toBeGreaterThan(5)
})

const firstCardTitle = (page: Page) => page.locator('ul.grid .card__title').first().innerText()

test('home shows events and the weekend lineup', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Ideas for you' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'This weekend' })).toBeVisible()
})

test('a mood narrows the list', async ({ page }) => {
  const before = await page.locator('ul.grid > li').count()
  await page.getByRole('button', { name: 'Food & drink' }).first().click()
  await expect.poll(() => page.locator('ul.grid > li').count()).toBeLessThan(before)
})

test('an event opens with its own link, and the link opens it again', async ({ page }) => {
  const title = await firstCardTitle(page)
  await page.locator('ul.grid .card__open').first().click()
  await expect(page.locator('.detail__title')).toHaveText(title)
  await expect(page).toHaveURL(/\/e\/[^/]+$/)
  const url = page.url()
  await expect(page.locator('#invite-message')).toHaveValue(new RegExp(url.replace(/[.?*+^$()|[\]\\]/g, '\\$&')))
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/app\/$/)
  await page.goto(url)
  await expect(page.locator('.detail__title')).toHaveText(title)
})

test('setup ranks likes first and hides skips, and Not for me can be undone', async ({ page }) => {
  await page.getByRole('button', { name: 'Set up', exact: true }).click()
  await page.getByRole('button', { name: 'Set up without an account' }).click()
  await page.getByPlaceholder('First name').fill('Sam')
  await page.getByRole('button', { name: 'Next' }).click()
  await page.locator('.interest', { hasText: 'Comedy' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.locator('.interest', { hasText: 'Kid-friendly' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Show me my scene' }).click()
  await expect(page.locator('.toast')).toContainText('Sam')
  await expect(page.locator('.hidden-note')).toContainText('hidden')
  await expect(page.locator('ul.grid li').first()).toContainText('you like comedy')

  const first = await firstCardTitle(page)
  await page.locator('ul.grid .card__open').first().click()
  await page.getByRole('button', { name: 'Not for me' }).click()
  await expect.poll(() => firstCardTitle(page)).not.toBe(first)
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect.poll(() => firstCardTitle(page)).toBe(first)
})

test('group text goes to everyone picked', async ({ page }) => {
  await page.locator('ul.grid .card__open').first().click()
  await page.getByRole('button', { name: 'Text friends' }).click()
  for (const [n, ph] of [['Ana', '864 555 0101'], ['Ben', '864-555-0102']]) {
    await page.getByPlaceholder('Name').fill(n)
    await page.getByPlaceholder('Phone number').fill(ph)
    await page.getByRole('button', { name: 'Add friend' }).click()
  }
  await expect(page.locator('.gtext__send')).toHaveText(/Text 2 friends together/)
  await expect(page.locator('.gtext__send')).toHaveAttribute('href', /8645550101.8645550102/)
})

test('outside links open on an in-app page with Back', async ({ page }) => {
  await page.locator('ul.grid .card__open').first().click()
  await page.getByRole('link', { name: 'Directions' }).click()
  await expect(page.locator('dialog.viewer[open]')).toBeVisible()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page.locator('dialog.viewer')).toHaveCount(0)
  await expect(page.locator('.detail__title')).toBeVisible()
})

test('report a problem', async ({ page }) => {
  await page.locator('ul.grid .card__open').first().click()
  await page.getByRole('button', { name: 'Report a problem' }).click()
  await page.getByRole('radio', { name: 'Wrong price' }).click()
  await page.getByRole('button', { name: 'Send report' }).click()
  await expect(page.getByText('Thanks for the heads-up')).toBeVisible()
})

test('every tab opens', async ({ page }) => {
  for (const [tab, heading] of [['Calendar', 'Your calendar'], ['Saved', 'Saved'], ['You', 'Your scene']] as const) {
    await page.getByRole('button', { name: tab, exact: true }).click()
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible()
  }
})
