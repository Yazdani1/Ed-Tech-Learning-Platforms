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
    await expect(page.getByText('Total Revenue', { exact: true })).toBeVisible();
    await expect(page.getByText('Users By Role', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Top Courses' })).toBeVisible();
    await expect(page.locator('.recharts-surface').first()).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('the performance report filters by course and date range', async ({ page }, testInfo) => {
    await signInByApi(page, ACCOUNTS.superAdmin.email);
    const title = `E2E Perf ${testInfo.project.name} ${Date.now()}`;
    const courseId = await createCourse(page, title);

    await page.goto('/admin/performance');
    await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    await expect(page.getByText('Total students', { exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByRole('combobox', { name: 'Date range' }).click();
    await page.getByRole('option', { name: 'Last 7 days' }).click();
    await expect(page).toHaveURL(/range=7d/);

    await page.getByRole('button', { name: 'Choose a course (now: All courses)' }).click();
    await page.getByRole('textbox', { name: 'Search for a keyword' }).fill(title);
    const list = page.getByRole('list', { name: 'Courses' });
    await list.getByText(title, { exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`course=${courseId}`));
    await expect(
      page.getByRole('button', { name: `Choose a course (now: ${title})` }),
    ).toBeVisible();
    await expect(page.getByText('0 total enrollments', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Pie chart' }).click();
    await expect(page.getByText('Enrollment breakdown (all time)')).toBeVisible();
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
