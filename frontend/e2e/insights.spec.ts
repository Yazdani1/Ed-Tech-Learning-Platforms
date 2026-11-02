import { expect, test, type Page } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, signIn } from './helpers';

/** Signs in through the API (the cookie is shared with the page). */
const signInByApi = async (page: Page, email: string): Promise<void> => {
  const response = await page.request.post('/api/auth/login', {
    data: { email, password: E2E_PASSWORD },
  });
  expect(response.ok()).toBe(true);
};

/** As the signed-in Admin: a course with a unique title (the performance filter lists every course). */
const createCourse = async (page: Page, title: string): Promise<string> => {
  const idOf = async (response: Awaited<ReturnType<Page['request']['post']>>): Promise<string> => {
    expect(response.ok(), await response.text()).toBe(true);
    return ((await response.json()) as { data: { _id: string } }).data._id;
  };
  const category = await idOf(
    await page.request.post('/api/categories', { data: { name: `${title} cat` } }),
  );
  const courseType = await idOf(
    await page.request.post('/api/course-types', { data: { name: `${title} type` } }),
  );
  return idOf(
    await page.request.post('/api/courses', {
      data: { title, category, courseType, pricing: 'Free', visibility: 'Public' },
    }),
  );
};

test.describe('Super Admin insights', () => {
  test('the Super Admin dashboard shows the numbers and charts', async ({ page }) => {
    await signIn(page, ACCOUNTS.superAdmin.email);
    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    const revenue = page.getByRole('region', { name: 'Revenue' });
    for (const period of ['Today', 'Last 7 days', 'This month', 'All time']) {
      await expect(revenue.getByText(period, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole('region', { name: 'Platform numbers' })).toContainText('Students');
    await expect(page.getByText('Monthly revenue, last 12 months')).toBeVisible();
    await expect(page.getByText('Users By Role')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Top 5 courses by revenue' })).toBeVisible();
    await expect(page.locator('.recharts-surface').first()).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('the performance report filters by courses, period and custom dates', async ({
    page,
  }, testInfo) => {
    await signInByApi(page, ACCOUNTS.superAdmin.email);
    const title = `E2E Perf ${testInfo.project.name} ${Date.now()}`;
    const courseId = await createCourse(page, title);

    await page.goto('/admin/performance');
    await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    const periods = page.getByRole('region', { name: 'Revenue per period' });
    await expect(periods.getByText('All time', { exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByRole('combobox', { name: 'Date range' }).click();
    await page.getByRole('option', { name: 'Custom range' }).click();
    await expect(page).toHaveURL(/range=custom/);
    await expect(
      page.getByText('Choose a start date and an end date to see the chart.'),
    ).toBeVisible();
    await page.getByLabel('Start date').fill('2026-01-01');
    await expect(page).toHaveURL(/from=2026-01-01/);
    await page.getByLabel('End date').fill('2026-01-31');
    await expect(page).toHaveURL(/to=2026-01-31/);
    await expect(page.getByText(/^Custom range: /)).toBeVisible();

    await page.getByRole('button', { name: 'Choose courses (now: All courses)' }).click();
    await page.getByRole('textbox', { name: 'Search for a keyword' }).fill(title);
    const list = page.getByRole('list', { name: 'Courses' });
    const option = list.getByRole('checkbox', { name: title });
    await option.click();
    await expect(option).toHaveAttribute('aria-checked', 'true');
    await expect(list.getByText('0 paid students')).toBeVisible();
    await page.getByRole('button', { name: 'Apply (1 course)' }).click();
    await expect(page).toHaveURL(new RegExp(`courses=${courseId}`));
    await expect(
      page.getByRole('button', { name: `Choose courses (now: ${title})` }),
    ).toBeVisible();
    await expect(periods.getByText('0 enrollments · 0 paid').first()).toBeVisible();

    await page.getByRole('button', { name: 'Pie chart' }).click();
    await expect(page.getByText('Enrollment breakdown (selected range)')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('an Admin cannot open the dashboard or the performance report', async ({ page }) => {
    await signInByApi(page, ACCOUNTS.admin.email);
    await page.goto('/admin/performance');
    await expect(page).toHaveURL(/\/admin\/courses$/);
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/courses$/);
  });
});
