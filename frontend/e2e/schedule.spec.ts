import { expect, test, type Page } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, signIn, uniqueEmail } from './helpers';

const registerStudent = async (page: Page, email: string): Promise<void> => {
  const register = await page.request.post('/api/auth/register', {
    data: { name: 'E2E Schedule Student', email, password: E2E_PASSWORD },
  });
  expect(register.ok()).toBe(true);
};

test.describe('Study schedule', () => {
  test('a student runs, pauses and stops a timer; the time left survives a reload', async ({
    page,
  }, testInfo) => {
    await registerStudent(page, uniqueEmail(testInfo));
    await page.goto('/student/schedule');
    await expect(page.getByRole('heading', { name: 'Study Schedule' })).toBeVisible();
    await expectNoHorizontalScroll(page);

    const title = `E2E timer ${Date.now()}`;
    await page.getByLabel(/^Title/).fill(title);
    await page.getByRole('button', { name: 'Start Timer' }).click();
    const card = page.getByRole('article', { name: title });
    await expect(card.getByText('RUNNING', { exact: true })).toBeVisible();

    await card.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(card.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
    const clock = card.getByRole('timer', { name: 'Time left' });
    // The digits come first; the HH MM SS captions follow them
    const pausedAt = (await clock.textContent())?.slice(0, 8) ?? '';
    expect(pausedAt).toMatch(/^00:2[45]:\d\d$/);

    await page.reload();
    await expect(page.getByRole('article', { name: title }).getByRole('timer')).toContainText(
      pausedAt,
    );

    await page
      .getByRole('article', { name: title })
      .getByRole('button', { name: 'Stop', exact: true })
      .click();
    await expect(page.getByText('Timer stopped')).toBeVisible();
    await expect(page.getByRole('article', { name: title })).toHaveCount(0);
  });

  test('a due reminder goes off, is completed and appears in the history', async ({
    page,
  }, testInfo) => {
    await registerStudent(page, uniqueEmail(testInfo));
    const title = `E2E reminder ${Date.now()}`;
    const created = await page.request.post('/api/study-schedules/reminder', {
      data: { title, startDateTime: new Date(Date.now() - 1000).toISOString() },
    });
    expect(created.ok()).toBe(true);

    await page.goto('/student/schedule');
    await expect(page.getByRole('alert').filter({ hasText: title })).toContainText(
      'Study session started',
    );
    await page.getByRole('tab', { name: 'Reminders' }).click();
    const card = page.getByRole('article', { name: title });
    await expect(card.getByText('ACTIVE', { exact: true })).toBeVisible();
    await expect(card.getByRole('timer', { name: 'Study time' })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await card.getByRole('button', { name: 'Complete Session' }).click();
    await expect(page.getByText('Session completed')).toBeVisible();
    await expect(card).toHaveCount(0);

    await page.getByRole('tab', { name: 'History' }).click();
    await page.getByRole('tab', { name: 'Reminders (1)' }).click();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  });

  test('teachers and admins have the page in their own area', async ({ page }) => {
    await signIn(page, ACCOUNTS.teacher.email);
    await expect(page).toHaveURL(/\/teacher\/courses$/);
    await page.goto('/teacher/schedule');
    await expect(page.getByRole('heading', { name: 'Study Schedule' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Timer' })).toBeVisible();

    await page.context().clearCookies();
    await signIn(page, ACCOUNTS.admin.email);
    await expect(page).toHaveURL(/\/admin\//);
    await page.goto('/admin/schedule');
    await expect(page.getByRole('heading', { name: 'Study Schedule' })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
