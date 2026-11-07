import { expect, test } from '@playwright/test';

import { ACCOUNTS, expectNoHorizontalScroll, openMenu, signInAndWait } from './helpers';

// The VAT rate is global: each run picks its own value so parallel runs never save "the same rate again".
const uniqueRate = (): string => String((Date.now() % 9000) / 100);

test.describe('Set up VAT', () => {
  test('a Super Admin changes the VAT after confirming and sees it in the history', async ({
    page,
  }) => {
    await signInAndWait(page, ACCOUNTS.superAdmin.email);
    await openMenu(page);
    await page.getByRole('link', { name: 'Set up VAT' }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/admin\/vat$/);
    await expect(page.getByRole('heading', { name: 'Set up VAT', level: 1 })).toBeVisible();

    const rate = uniqueRate();
    const field = page.getByLabel('VAT percentage');
    await field.fill(rate);
    await page.getByRole('button', { name: 'Save VAT' }).click();
    const confirm = page.getByRole('dialog', { name: 'Change the VAT rate?' });
    await confirm.getByRole('button', { name: 'Save VAT' }).click();

    await expect(page.getByText(`VAT set to ${rate}%`)).toBeVisible();
    await expect(
      page
        .getByRole('list', { name: 'Change history' })
        .getByText(new RegExp(`to ${rate}%`))
        .first(),
    ).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('an Admin cannot open the page and has no menu item', async ({ page }) => {
    await signInAndWait(page, ACCOUNTS.admin.email);
    await expect(page.getByRole('link', { name: 'Set up VAT' })).toHaveCount(0);

    await page.goto('/admin/vat');

    await expect(page).toHaveURL(/\/admin\/courses$/);
  });
});

test.describe('Installable app', () => {
  test('serves the web app manifest and the service worker', async ({ request }) => {
    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.ok()).toBe(true);
    const body = (await manifest.json()) as { display: string; icons: unknown[] };
    expect(body.display).toBe('standalone');
    expect(body.icons.length).toBeGreaterThanOrEqual(3);
    const worker = await request.get('/sw.js');
    expect(worker.ok()).toBe(true);
    expect(await worker.text()).toContain('/offline');
  });

  test('the offline page offers to try again', async ({ page }) => {
    await page.goto('/offline');
    await expect(page.getByRole('heading', { name: 'You are offline' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
