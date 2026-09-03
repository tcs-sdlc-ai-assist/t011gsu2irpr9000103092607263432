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
  await page.getByLabel('Password').fill('local-password');
  await page.getByLabel('Confirm password').fill('local-password');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('heading', { name: 'Stories' })).toBeVisible();
  await expect(page.getByText('This section will be available in its dedicated feature release.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a guest is redirected to login and invalid registration reports an accessible error', async ({ page }) => {
  const errors = capturePageErrors(page);
  await page.goto('/blogs');
  await expect(page.getByRole('heading', { name: 'Log in to WriteSpace' })).toBeVisible();

  await page.goto('/register');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Display name is required.')).toHaveAttribute('role', 'alert');
  expect(errors).toEqual([]);
});
