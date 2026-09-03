import { expect, test } from '@playwright/test';

/** Capture client errors so successful-looking pages cannot hide JavaScript failures. */
function capturePageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('a visitor can register and reach protected stories without browser errors', async ({ page }) => {
  const errors = capturePageErrors(page);
  await page.goto('/register');
  await page.getByLabel('Display name').fill('Playwright Writer');
  await page.getByLabel('Username').fill('playwright-writer');
  await page.getByLabel('Password', { exact: true }).fill('local-password');
  await page.getByLabel('Confirm password').fill('local-password');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('heading', { name: 'Stories', exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Finding Space for a Slower Morning' }),
  ).toBeVisible();
  const posts = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('writespace_posts') || '[]'),
  );
  expect(posts).toHaveLength(3);
  expect(errors).toEqual([]);
});

test('a guest is redirected to login and invalid registration reports an accessible error', async ({ page }) => {
  const errors = capturePageErrors(page);
  await page.goto('/blogs');
  await expect(page.getByRole('heading', { name: 'Log in to WriteSpace' })).toBeVisible();

  await page.getByRole('link', { name: 'Create an account' }).click();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Display name is required.')).toHaveAttribute('role', 'alert');
  expect(errors).toEqual([]);
});

test('the landing page presents newest previews and routes each public CTA', async ({ page }) => {
  const errors = capturePageErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('writespace_posts', JSON.stringify([
      {
        id: 'older-preview',
        title: 'Older preview',
        content: 'An older local story.',
        authorId: 'writer',
        authorName: 'Writer',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'newer-preview',
        title: 'Newest preview',
        content: 'The newest local story appears first on the public landing page.',
        authorId: 'writer',
        authorName: 'Writer',
        createdAt: '2025-02-01T00:00:00.000Z',
      },
    ]));
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Newest preview' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Read story' }).first()).toHaveAttribute(
    'href',
    '/blog/newer-preview',
  );
  await page.getByRole('link', { name: 'Read story' }).first().click();
  await expect(page.getByRole('heading', { name: 'Log in to WriteSpace' })).toBeVisible();
  await page.getByRole('link', { name: 'WriteSpace' }).click();
  await page.getByRole('link', { name: 'Start writing' }).click();
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await page.getByRole('link', { name: 'WriteSpace' }).click();
  await page.getByRole('link', { name: 'Explore stories' }).click();
  await expect(page.getByRole('heading', { name: 'Log in to WriteSpace' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('the landing page exposes usable mobile navigation', async ({ page }) => {
  const errors = capturePageErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Mobile public navigation' })).toBeVisible();
  await page.screenshot({ path: 'test-results/landing-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});
