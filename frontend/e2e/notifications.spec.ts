import { expect, test, type Page } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, uniqueEmail } from './helpers';

const openCardMenu = async (page: Page, title: string): Promise<void> => {
  await page.getByRole('button', { name: `Actions for ${title}`, exact: true }).click();
};

test.describe('Notifications', () => {
  test('an Admin sends, edits and deletes a notification that a student reads', async ({
    page,
    browser,
    baseURL,
  }, testInfo) => {
    const registered = await page.request.post('/api/auth/register', {
      data: {
        name: `E2E Reader ${testInfo.project.name}`,
        email: uniqueEmail(testInfo),
        password: E2E_PASSWORD,
      },
    });
    expect(registered.ok()).toBe(true);
    const title = `E2E notice ${testInfo.project.name} ${Date.now()}`;
    const edited = `${title} (edited)`;

    const adminContext = await browser.newContext({ baseURL });
    const admin = await adminContext.newPage();
    const login = await admin.request.post('/api/auth/login', {
      data: { email: ACCOUNTS.admin.email, password: E2E_PASSWORD },
    });
    expect(login.ok()).toBe(true);

    await admin.goto('/admin/notifications');
    await expect(admin.getByRole('heading', { name: 'Send Push Notification' })).toBeVisible();
    await admin.getByRole('textbox', { name: /^Title/ }).fill(title);
    await admin.getByRole('textbox', { name: 'Message' }).fill('Classes start at nine.');
    await expect(admin.getByRole('checkbox', { name: 'Student' })).toBeChecked();
    await admin.getByRole('button', { name: 'Send Notification' }).click();
    await expect(admin.getByText(/Notification sent to \d+ users?/)).toBeVisible();

    await page.goto('/student/notifications');
    await expect(page.getByRole('heading', { name: 'Notifications', exact: true })).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(0);
    await page.getByRole('button', { name: `Show or hide: ${title}`, exact: true }).click();
    await expect(page.getByText('Classes start at nine.')).toBeVisible();
    await expectNoHorizontalScroll(page);

    await admin.getByRole('tab', { name: 'Sent Notifications' }).click();
    await openCardMenu(admin, title);
    await admin.getByRole('menuitem', { name: 'Edit' }).click();
    const dialog = admin.getByRole('dialog', { name: 'Edit Notification' });
    await dialog.getByRole('textbox', { name: /^Title/ }).fill(edited);
    await dialog.getByRole('button', { name: 'Save Changes' }).click();
    await expect(admin.getByText('Notification updated')).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole('button', { name: `Show or hide: ${edited}`, exact: true }),
    ).toBeVisible();

    await openCardMenu(admin, edited);
    await admin.getByRole('menuitem', { name: 'Delete' }).click();
    await admin.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(admin.getByText('Notification deleted')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'All Notifications' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: `Show or hide: ${edited}`, exact: true }),
    ).toHaveCount(0);
    await adminContext.close();
  });
});
