import { expect, test } from '@playwright/test';

import {
  ACCOUNTS,
  E2E_PASSWORD,
  expectNoHorizontalScroll,
  signIn,
  signOut,
  uniqueEmail,
} from './helpers';

const NEW_PASSWORD = 'E2e-new-password-2';

test.describe('Profile', () => {
  test('a student edits the name and changes the password', async ({ page }, testInfo) => {
    const email = uniqueEmail(testInfo);
    const register = await page.request.post('/api/auth/register', {
      data: { name: 'E2E Profile Student', email, password: E2E_PASSWORD },
    });
    expect(register.ok()).toBe(true);

    await page.goto('/student/profile');
    await expect(page.getByRole('heading', { name: 'E2E Profile Student' })).toBeVisible();
    await expect(page.getByText('You do not have an active subscription.')).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByRole('button', { name: 'Edit Profile' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit Profile' });
    await dialog.getByLabel('Name').fill('E2E Renamed Student');
    await dialog.getByLabel('Current password').fill(E2E_PASSWORD);
    await dialog.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD);
    await dialog.getByLabel('Confirm new password').fill(NEW_PASSWORD);
    await dialog.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('Profile updated')).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { name: 'E2E Renamed Student' })).toBeVisible();

    // The session stays valid (fresh cookie), and the new password works after signing out
    await page.reload();
    await expect(page.getByRole('heading', { name: 'E2E Renamed Student' })).toBeVisible();
    await signOut(page);
    await signIn(page, email, NEW_PASSWORD);
    await expect(page).toHaveURL(/\/student\/dashboard$/);
  });

  test('a wrong current password is refused with the server message', async ({
    page,
  }, testInfo) => {
    const register = await page.request.post('/api/auth/register', {
      data: { name: 'E2E Careful Student', email: uniqueEmail(testInfo), password: E2E_PASSWORD },
    });
    expect(register.ok()).toBe(true);

    await page.goto('/student/profile');
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit Profile' });
    await dialog.getByLabel('Current password').fill('not-my-password');
    await dialog.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD);
    await dialog.getByLabel('Confirm new password').fill(NEW_PASSWORD);
    await dialog.getByRole('button', { name: 'Save Changes' }).click();

    await expect(dialog.getByText('Current password is incorrect')).toBeVisible();
  });

  test('a teacher sees assigned courses and cannot change the email', async ({ page }) => {
    await signIn(page, ACCOUNTS.teacher.email);
    await expect(page).toHaveURL(/\/teacher\/courses$/);

    await page.goto('/teacher/profile');
    await expect(page.getByRole('heading', { name: ACCOUNTS.teacher.name })).toBeVisible();
    await expect(
      page.getByRole('main').getByText('Assigned courses', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel Subscription' })).toHaveCount(0);
    await expectNoHorizontalScroll(page);

    await page.getByRole('button', { name: 'Edit Profile' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit Profile' });
    await expect(dialog.getByLabel('Email')).toHaveAttribute('readonly', '');
  });

  test('an admin opens the profile from the admin area', async ({ page }) => {
    await signIn(page, ACCOUNTS.admin.email);
    await expect(page).toHaveURL(/\/admin\/courses$/);

    await page.goto('/admin/profile');
    await expect(page.getByRole('heading', { name: ACCOUNTS.admin.name })).toBeVisible();
    await expect(
      page.getByRole('main').getByText('Management access', { exact: true }),
    ).toBeVisible();
  });
});
