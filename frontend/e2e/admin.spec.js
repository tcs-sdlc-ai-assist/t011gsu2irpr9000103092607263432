import { expect, test } from '@playwright/test';

const adminSession = { userId: 'admin', username: 'admin', displayName: 'Admin', role: 'Admin' };

/** Capture browser errors so the administration journey cannot conceal client failures. */
function capturePageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

/** Seed the built-in admin session and deterministic local records before navigation. */
async function seedAdminStorage(page) {
  await page.addInitScript((session) => {
    localStorage.setItem('writespace_session', JSON.stringify(session));
    localStorage.setItem('writespace_posts', JSON.stringify([
      { id: 'recent', title: 'Recent admin post', authorName: 'Admin', createdAt: '2025-01-02T00:00:00.000Z' },
      { id: 'older', title: 'Older admin post', authorName: 'Writer', createdAt: '2025-01-01T00:00:00.000Z' },
    ]));
    localStorage.setItem('writespace_users', JSON.stringify([
      { id: 'writer', displayName: 'Existing Writer', username: 'writer', password: 'password', role: 'user', createdAt: '2025-01-01T00:00:00.000Z' },
    ]));
  }, adminSession);
}

test('an administrator manages dashboard posts and local user records', async ({ page }) => {
  const errors = capturePageErrors(page);
  await seedAdminStorage(page);
  await page.goto('/admin');

  await expect(page.getByText('Total Posts')).toBeVisible();
  await expect(page.getByText('Total Admins')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Recent posts' })).toContainText('Recent admin post');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete' }).first().click();
  await expect(page.getByText('Post deleted.')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Recent posts' })).not.toContainText('Recent admin post');

  await page.getByRole('link', { name: 'Manage users' }).click();
  await page.getByLabel('Display name').fill('Playwright Admin');
  await page.getByLabel('Username').fill('playwright-admin');
  await page.getByLabel('Password').fill('password');
  await page.getByLabel('Role').selectOption('Admin');
  await page.getByRole('button', { name: 'Create user' }).click();
  await expect(page.getByText('User created.')).toBeVisible();
  await expect(page.getByText('Playwright Admin').first()).toBeVisible();

  await page.getByLabel('Display name').fill('Duplicate');
  await page.getByLabel('Username').fill('ADMIN');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Create user' }).click();
  await expect(page.getByText('This username is already in use.')).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).first().click();
  await expect(page.getByText('Default admin cannot be deleted.')).toBeVisible();
  expect(errors).toEqual([]);
});
