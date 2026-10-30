import { expect, test, type Page } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, signIn } from './helpers';

/** Signs in through the API (the cookie is shared with the page). */
const signInByApi = async (page: Page, email: string): Promise<void> => {
  const response = await page.request.post('/api/auth/login', {
    data: { email, password: E2E_PASSWORD },
  });
  expect(response.ok()).toBe(true);
};

const uniqueName = (prefix: string, project: string): string =>
  `${prefix} ${project} ${Date.now()}`;

test.describe('Course setup (categories and course types)', () => {
  test('an Admin adds, edits and deletes a category', async ({ page }, testInfo) => {
    await signInByApi(page, ACCOUNTS.admin.email);
    const name = uniqueName('E2E Category', testInfo.project.name);
    const created = await page.request.post('/api/categories', {
      data: { name, description: 'Made by the e2e test' },
    });
    expect(created.ok()).toBe(true);

    await page.goto('/admin/categories');
    await expect(page.getByRole('heading', { name: 'Course Setup' })).toBeVisible();
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByRole('button', { name: `Actions for ${name}` }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit Category' });
    const renamed = `${name} renamed`;
    await dialog.getByLabel(/Name/).fill(renamed);
    await dialog.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByText('Category updated')).toBeVisible();
    await expect(page.getByText(renamed, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: `Actions for ${renamed}` }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Category deleted')).toBeVisible();
    await expect(page.getByText(renamed, { exact: true })).toHaveCount(0);
  });

  test('a Super Admin adds a course type from the Course Types tab', async ({ page }, testInfo) => {
    await signInByApi(page, ACCOUNTS.superAdmin.email);
    const name = uniqueName('E2E Type', testInfo.project.name);

    await page.goto('/admin/categories');
    await page.getByRole('tab', { name: 'Course Types' }).click();
    await expect(page).toHaveURL(/\/admin\/course-types$/);

    await page.getByRole('button', { name: 'Add Course Type' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add Course Type' });
    await dialog.getByLabel(/Name/).fill(name);
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Course type created')).toBeVisible();
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('a Moderator cannot open course setup', async ({ page }) => {
    await signIn(page, ACCOUNTS.moderator.email);
    await expect(page).toHaveURL(/\/admin\/courses$/);

    await page.goto('/admin/categories');
    await expect(page).toHaveURL(/\/admin\/courses$/);
  });
});
