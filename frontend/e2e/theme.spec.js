import { expect, test } from '@playwright/test';

const authenticatedSession = {
  userId: 'theme-writer',
  username: 'theme-writer',
  displayName: 'Theme Writer',
  role: 'user',
};

/** Capture browser errors so theme journeys cannot conceal client failures. */
function capturePageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('a guest starts in light mode with a keyboard-focusable moon toggle', async ({ page }) => {
  const errors = capturePageErrors(page);
  await page.goto('/');

  const toggle = page.getByRole('button', { name: 'Toggle dark mode' }).first();
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  await expect(toggle).toContainText('🌙');
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await expect(page.evaluate(() => localStorage.getItem('writespace_theme'))).resolves.toBeNull();
  expect(errors).toEqual([]);
});

test('a guest can select dark mode and retain it across reloads', async ({ page }) => {
  const errors = capturePageErrors(page);
  await page.goto('/');

  await page.getByRole('button', { name: 'Toggle dark mode' }).first().click();
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await expect(page.getByRole('button', { name: 'Toggle dark mode' }).first()).toContainText('☀️');
  await expect(page.evaluate(() => localStorage.getItem('writespace_theme'))).resolves.toBe('dark');

  await page.reload();
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await expect(page.getByRole('button', { name: 'Toggle dark mode' }).first()).toContainText('☀️');
  expect(errors).toEqual([]);
});

test('preloaded dark mode is applied before app interaction', async ({ page }) => {
  const errors = capturePageErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('writespace_theme', 'dark');
  });

  await page.goto('/');

  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await expect(page.getByRole('button', { name: 'Toggle dark mode' }).first()).toContainText('☀️');
  expect(errors).toEqual([]);
});

test('the authenticated shell exposes and persists its theme toggle', async ({ page }) => {
  const errors = capturePageErrors(page);
  await page.addInitScript((session) => {
    localStorage.setItem('writespace_session', JSON.stringify(session));
    localStorage.setItem('writespace_posts', '[]');
  }, authenticatedSession);

  await page.goto('/blogs');
  const navigation = page.getByRole('navigation', { name: 'Authenticated navigation' });
  const toggle = navigation.getByRole('button', { name: 'Toggle dark mode' });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await expect(page.evaluate(() => localStorage.getItem('writespace_theme'))).resolves.toBe('dark');

  await page.reload();
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await expect(
    page.getByRole('navigation', { name: 'Authenticated navigation' })
      .getByRole('button', { name: 'Toggle dark mode' }),
  ).toContainText('☀️');
  expect(errors).toEqual([]);
});
