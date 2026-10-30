import { expect, test } from '@playwright/test';

import { ACCOUNTS, expectNoHorizontalScroll, isPhone, openMenu, signIn } from './helpers';

test.describe('Signed-in shell', () => {
  test('a Super Admin sees every admin menu item, including Performance', async ({ page }) => {
    await signIn(page, ACCOUNTS.superAdmin.email);
    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    await openMenu(page);
    const menu = page.getByRole('navigation', { name: 'Main menu' }).filter({ visible: true });
    for (const item of ['Dashboard', 'Courses', 'User List', 'Performance']) {
      await expect(menu.getByRole('link', { name: item })).toBeVisible();
    }
    await expect(menu.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('a Moderator does not see the Super Admin or manager items', async ({ page }) => {
    await signIn(page, ACCOUNTS.moderator.email);
    await expect(page).toHaveURL(/\/admin\/courses$/);

    await openMenu(page);
    const menu = page.getByRole('navigation', { name: 'Main menu' }).filter({ visible: true });
    await expect(menu.getByRole('link', { name: 'Courses' })).toBeVisible();
    for (const item of ['Dashboard', 'User List', 'Performance']) {
      await expect(menu.getByRole('link', { name: item })).toHaveCount(0);
    }
  });

  test('the menu works on this screen size (drawer on phones, sidebar on desktop)', async ({
    page,
  }) => {
    await signIn(page, ACCOUNTS.student.email);
    await expect(page).toHaveURL(/\/student\/dashboard$/);
    await expectNoHorizontalScroll(page);

    if (isPhone(page)) {
      await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
      await openMenu(page);
    } else {
      await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
      await page.getByRole('button', { name: 'Collapse sidebar' }).click();
      await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
      await page.getByRole('button', { name: 'Expand sidebar' }).click();
    }
    const menu = page.getByRole('navigation', { name: 'Main menu' }).filter({ visible: true });
    await expect(menu.getByRole('link', { name: 'My Courses' })).toBeVisible();
    // The signed-in name in the sidebar footer (the dashboard greeting in <main> shows it too)
    await expect(
      page
        .locator('.MuiDrawer-paper')
        .getByText(ACCOUNTS.student.name, { exact: true })
        .filter({ visible: true }),
    ).toBeVisible();
  });
});

test.describe('Pages outside the shell', () => {
  test('an unknown address shows the not-found page with a way home', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await page.getByRole('link', { name: 'Go to the start page' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('every page is served with the security headers', async ({ page }) => {
    const response = await page.goto('/auth/login');
    const headers = response?.headers() ?? {};

    expect(headers['content-security-policy']).toMatch(/'nonce-[^']+' 'strict-dynamic'/);
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
  });
});
