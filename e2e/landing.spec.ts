import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort())
  await page.goto('/')
})

test('landing page loads with the beta form and a way into the app', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your weekend')
  await expect(page.locator('form[name="beta"]')).toHaveCount(2)
  await page.getByRole('link', { name: 'Try the app' }).first().click()
  await expect(page).toHaveURL(/\/app\/$/)
})

test('beta form checks the email before sending', async ({ page }) => {
  const form = page.locator('#join')
  await form.getByLabel('Email').fill('not-an-email')
  await form.getByRole('button', { name: 'Join the beta' }).click()
  await expect(form.locator('[data-status]')).toContainText('doesn’t look right')
  await expect(form.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true')
})

test('beta form posts to Netlify Forms and confirms', async ({ page }) => {
  let body = ''
  await page.route('**/', async (r) => {
    if (r.request().method() === 'POST') { body = r.request().postData() ?? ''; await r.fulfill({ status: 200, body: 'ok' }) }
    else await r.continue()
  })
  const form = page.locator('#join')
  await form.getByLabel('Email').fill('friend@example.com')
  await form.getByLabel('Your town (optional)').selectOption('Anderson')
  await form.getByRole('button', { name: 'Join the beta' }).click()
  await expect(form.locator('[data-status]')).toContainText('You’re on the list')
  expect(body).toContain('form-name=beta')
  expect(body).toContain('email=friend%40example.com')
  expect(body).toContain('town=Anderson')
})

test('landing follows dark mode and the switch flips it', async ({ browser }) => {
  const page = await (await browser.newContext({ colorScheme: 'dark' })).newPage()
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})
