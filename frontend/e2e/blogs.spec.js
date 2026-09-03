import { expect, test } from '@playwright/test';

const session = { userId: 'e2e-writer', username: 'e2e-writer', displayName: 'E2E Writer', role: 'user' };

/** Capture browser errors so the visible journey cannot conceal client failures. */
function capturePageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

/** Seed a valid session and empty post collection before navigation. */
async function seedAuthenticatedStorage(page) {
  await page.addInitScript((localSession) => {
    localStorage.setItem('writespace_session', JSON.stringify(localSession));
    localStorage.setItem('writespace_posts', '[]');
  }, session);
}

test('an authenticated writer can create, reload, read, edit, and delete a story', async ({ page }) => {
  const errors = capturePageErrors(page);
  await seedAuthenticatedStorage(page);
  await page.goto('/write');

  await page.getByLabel('Title').fill('Playwright local story');
  await page.getByLabel('Content').fill('A meaningful local story body that survives a browser reload.');
  await page.getByRole('button', { name: 'Publish story' }).click();
  await expect(page.getByRole('heading', { name: 'Playwright local story' })).toBeVisible();
  await expect(page.getByText('A meaningful local story body that survives a browser reload.')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Playwright local story' })).toBeVisible();
  await page.getByRole('link', { name: 'Edit story' }).click();
  await page.getByLabel('Content').fill('An edited body proves the local edit flow works.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('An edited body proves the local edit flow works.')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete story' }).click();
  await expect(page.getByRole('heading', { name: 'Stories' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No stories yet' })).toBeVisible();
  expect(errors).toEqual([]);
});
