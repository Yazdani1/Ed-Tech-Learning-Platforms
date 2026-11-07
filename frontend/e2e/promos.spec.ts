import { expect, test, type Page } from '@playwright/test';

import {
  ACCOUNTS,
  apiAs,
  createPaidCourse,
  dataOf,
  expectNoHorizontalScroll,
  isPhone,
  signInAndWait,
} from './helpers';

// A running promo shows a banner and a pop-up on the public pages. These tests create one for a course of
// their own and always delete it again, so other specs see it for as short a time as possible.

const DAY_MS = 24 * 60 * 60 * 1000;
const localInput = (time: number): string => new Date(time).toISOString().slice(0, 16);

const deletePromosTitled = async (baseURL: string, title: string): Promise<void> => {
  const admin = await apiAs(baseURL, ACCOUNTS.admin.email);
  const list = await dataOf<{ _id: string; title: string }[]>(
    await admin.get('/api/promos?limit=50'),
  );
  for (const promo of list.filter((item) => item.title === title)) {
    await admin.delete(`/api/promos/${promo._id}`);
  }
  await admin.dispose();
};

const createPromoInUi = async (page: Page, courseTitle: string, title: string): Promise<void> => {
  await page.goto('/admin/promos');
  await page.getByRole('button', { name: 'Create promo' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create promo' });
  await expect(dialog.getByLabel(/Coupon code/)).not.toHaveValue('');
  await dialog.getByRole('searchbox', { name: 'Search courses' }).fill(courseTitle);
  await dialog.getByRole('checkbox', { name: courseTitle, exact: true }).check();
  await expect(dialog.getByText('1 selected')).toBeVisible();
  await dialog.getByLabel(/Promo title/).fill(title);
  await dialog.getByRole('textbox', { name: /^Discount/ }).fill('30');
  await dialog.getByLabel(/Starts/).fill(localInput(Date.now() - DAY_MS));
  await dialog.getByLabel(/Ends/).fill(localInput(Date.now() + 2 * DAY_MS));
  await dialog.getByRole('button', { name: 'Save promo' }).click();
  await expect(page.getByText('Promo saved')).toBeVisible();
};

test.describe('Promos', () => {
  test('an Admin creates a promo: banner and pop-up on the home page, courses on /promo', async ({
    page,
    baseURL,
  }, testInfo) => {
    const course = await createPaidCourse(baseURL ?? '', `promo ${testInfo.project.name}`);
    const title = `E2E Promo ${testInfo.project.name} ${Date.now()}`;
    try {
      await signInAndWait(page, ACCOUNTS.admin.email);
      await createPromoInUi(page, course.title, title);
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
      await expect(page.getByText('30% off').first()).toBeVisible();
      await expectNoHorizontalScroll(page);

      // A visitor sees it
      await page.context().clearCookies();
      await page.goto('/');
      // The pop-up opens on top and hides the page from screen readers, so the banner is found by its label
      const banner = page.locator('aside[aria-label="Running promo"]');
      await expect(banner).toBeVisible();
      await expect(banner.getByText('30% OFF')).toBeVisible();
      await expect(banner.locator('[role="timer"]')).toBeVisible();
      const popup = page.getByRole('dialog');
      await expect(popup.getByText('30% OFF')).toBeVisible();
      await expectNoHorizontalScroll(page);

      await popup.getByRole('link', { name: 'Enroll now' }).click();
      await expect(page).toHaveURL(/\/promo$/);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(course.title, { exact: true })).toBeVisible();
      await expectNoHorizontalScroll(page);
    } finally {
      await deletePromosTitled(baseURL ?? '', title);
    }
  });

  test('the pop-up closes, shows on a course page too and never covers the sign-in panel', async ({
    page,
    baseURL,
  }, testInfo) => {
    const course = await createPaidCourse(baseURL ?? '', `promo2 ${testInfo.project.name}`);
    const title = `E2E Promo2 ${testInfo.project.name} ${Date.now()}`;
    try {
      await signInAndWait(page, ACCOUNTS.admin.email);
      await createPromoInUi(page, course.title, title);
      await page.context().clearCookies();

      await page.goto(`/courses/${course.id}`);
      const popup = page.getByRole('dialog');
      await expect(popup.getByText('30% OFF')).toBeVisible();
      await popup.getByRole('button', { name: 'Close' }).click();
      await expect(popup).toBeHidden();

      await page.goto('/?auth=login');
      await expect(page.getByRole('dialog', { name: 'Sign In' })).toBeVisible();
      await expect(page.getByRole('dialog', { name: title })).toHaveCount(0);
    } finally {
      await deletePromosTitled(baseURL ?? '', title);
    }
  });

  test('the promo page says so when no promo of this test runs, and a Moderator cannot manage promos', async ({
    page,
  }) => {
    await signInAndWait(page, ACCOUNTS.moderator.email);
    await expect(page).toHaveURL(/\/admin\/courses$/);

    await page.goto('/admin/promos');

    await expect(page).toHaveURL(/\/admin\/courses$/);
  });

  test('switching a promo off asks first and shows in its history; the Design tab has both pictures', async ({
    page,
    baseURL,
  }, testInfo) => {
    const course = await createPaidCourse(baseURL ?? '', 'promo toggle ' + testInfo.project.name);
    const title = 'E2E Toggle ' + testInfo.project.name + ' ' + String(Date.now());
    const admin = await apiAs(baseURL ?? '', ACCOUNTS.admin.email);
    await dataOf(
      await admin.post('/api/promos', {
        data: {
          title,
          code: 'TGL' + String(Date.now()).slice(-9),
          discountType: 'percent',
          value: 10,
          startsAt: new Date(Date.now() + DAY_MS).toISOString(),
          endsAt: new Date(Date.now() + 2 * DAY_MS).toISOString(),
          courseIds: [course.id],
        },
      }),
    );
    await admin.dispose();

    await signInAndWait(page, ACCOUNTS.admin.email);
    await page.goto('/admin/promos');
    // The row menu of the desktop table (phones show cards; their menu is covered by the other promo tests)
    if (!isPhone(page)) {
      await page
        .getByRole('button', { name: 'Actions for ' + title })
        .filter({ visible: true })
        .first()
        .click();
      await page.getByRole('menuitem', { name: 'Switch off' }).click();
      await page
        .getByRole('dialog', { name: 'Switch off "' + title + '"?' })
        .getByRole('button', { name: 'Switch off' })
        .click();
      await expect(page.getByText('Promo stopped')).toBeVisible();

      await page
        .getByRole('button', { name: 'Actions for ' + title })
        .filter({ visible: true })
        .first()
        .click();
      await page.getByRole('menuitem', { name: 'History' }).click();
      await expect(
        page.getByRole('dialog', { name: 'History of ' + title }).getByText('Switched off'),
      ).toBeVisible();
      await page.keyboard.press('Escape');
    }

    await page.getByRole('tab', { name: 'Design' }).click();
    await expect(page.getByText('Top banner picture')).toBeVisible();
    await expect(page.getByText('Pop-up picture')).toBeVisible();
    await expectNoHorizontalScroll(page);
    await deletePromosTitled(baseURL ?? '', title);
  });
});
