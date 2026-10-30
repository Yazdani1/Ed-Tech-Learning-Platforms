import { expect, test } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, signIn } from './helpers';

// The e2e backend has no real Cloudinary account, so uploads are not completed here: the component tests
// cover upload, edit, reorder and delete with a mocked API. This spec checks the page, the dialogs and the
// client-side file check in a real browser on desktop and phone.
test.describe('Homepage showcase', () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.request.post('/api/auth/login', {
      data: { email: ACCOUNTS.admin.email, password: E2E_PASSWORD },
    });
    expect(response.ok()).toBe(true);
  });

  test('an Admin sees the logo and slider sections', async ({ page }) => {
    await page.goto('/admin/homepage-showcase');

    await expect(page.getByRole('heading', { name: 'Homepage Header Showcase' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Site logo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Header slider images' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Save Logo|Update Logo/ })).toBeDisabled();
    await expectNoHorizontalScroll(page);
  });

  test('the upload dialog refuses a file that is not an image', async ({ page }) => {
    await page.goto('/admin/homepage-showcase');
    await page.getByRole('button', { name: 'Upload Images' }).click();

    const dialog = page.getByRole('dialog', { name: 'Upload Header Images' });
    await expect(dialog.getByRole('button', { name: 'Upload' })).toBeDisabled();
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    });
    await expect(dialog.getByText('notes.txt is not a PNG, JPEG, GIF or WEBP image')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Upload' })).toBeDisabled();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
  });

  test('a Moderator cannot open the showcase page', async ({ page }) => {
    await page.context().clearCookies();
    await signIn(page, ACCOUNTS.moderator.email);
    await expect(page).toHaveURL(/\/admin\/courses$/);

    await page.goto('/admin/homepage-showcase');
    await expect(page).toHaveURL(/\/admin\/courses$/);
  });
});
