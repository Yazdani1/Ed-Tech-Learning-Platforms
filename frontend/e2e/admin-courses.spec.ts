import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll } from './helpers';

// Each test builds its own course through the API, so specs never share data.

type ApiResponse = Awaited<ReturnType<APIRequestContext['post']>>;

const dataOf = async <T>(response: ApiResponse): Promise<T> => {
  expect(response.ok(), await response.text()).toBe(true);
  return ((await response.json()) as { data: T }).data;
};

/** Signs the page in through the API (the cookie is shared with the page). */
const signInByApi = async (page: Page, email: string): Promise<void> => {
  await dataOf(
    await page.request.post('/api/auth/login', { data: { email, password: E2E_PASSWORD } }),
  );
};

/** A Free, Public course (Draft unless `publish`), created by the signed-in Admin. */
const createCourse = async (page: Page, title: string, publish: boolean): Promise<string> => {
  const api = page.request;
  const category = await dataOf<{ _id: string }>(
    await api.post('/api/categories', { data: { name: `${title} cat` } }),
  );
  const courseType = await dataOf<{ _id: string }>(
    await api.post('/api/course-types', { data: { name: `${title} type` } }),
  );
  const course = await dataOf<{ _id: string }>(
    await api.post('/api/courses', {
      data: {
        title,
        category: category._id,
        courseType: courseType._id,
        visibility: 'Public',
        pricing: 'Free',
      },
    }),
  );
  if (publish)
    await dataOf(
      await api.patch(`/api/courses/${course._id}/status`, { data: { status: 'Published' } }),
    );
  return course._id;
};

const uniqueTitle = (project: string): string => `E2E Admin Course ${project} ${Date.now()}`;

const openCourseMenu = async (page: Page, title: string): Promise<void> => {
  await page.getByRole('button', { name: `Actions for ${title}`, exact: true }).click();
};

test.describe('Admin course list', () => {
  test('an Admin publishes, bulk edits and deletes a course', async ({ page }, testInfo) => {
    await signInByApi(page, ACCOUNTS.admin.email);
    const title = uniqueTitle(testInfo.project.name);
    await createCourse(page, title, false);

    await page.goto(`/admin/courses?search=${encodeURIComponent(title)}`);
    const card = page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: title }) });
    await expect(card).toBeVisible();
    await expect(card.getByText('Draft', { exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await openCourseMenu(page, title);
    await page.getByRole('menuitem', { name: 'Publish' }).click();
    await expect(page.getByText(`"${title}" is now published`)).toBeVisible();
    await expect(card.getByText(/^Published • /)).toBeVisible();

    await page.getByRole('button', { name: 'Bulk Edit' }).click();
    const dialog = page.getByRole('dialog', { name: /Bulk Edit Courses/ });
    await dialog.getByRole('checkbox', { name: title, exact: true }).check();
    await dialog.getByRole('tabpanel').getByRole('combobox', { name: 'Visibility' }).click();
    await page.getByRole('option', { name: 'Private', exact: true }).click();
    await dialog.getByRole('button', { name: 'Apply to 1 course' }).click();
    await expect(page.getByText('Updated 1 course')).toBeVisible();
    await expect(card.getByText('Private', { exact: true })).toBeVisible();

    await openCourseMenu(page, title);
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Course deleted')).toBeVisible();
    await expect(card).toHaveCount(0);
  });

  test('an Admin sees who enrolled and cannot delete a course with enrolments', async ({
    page,
    baseURL,
  }, testInfo) => {
    await signInByApi(page, ACCOUNTS.admin.email);
    const title = uniqueTitle(testInfo.project.name);
    const courseId = await createCourse(page, title, true);
    const student = await request.newContext({ baseURL });
    await dataOf(
      await student.post('/api/auth/login', {
        data: { email: ACCOUNTS.student.email, password: E2E_PASSWORD },
      }),
    );
    expect((await student.post(`/api/enrollments/${courseId}`, { data: {} })).ok()).toBe(true);
    await student.dispose();

    await page.goto(`/admin/enrollments/${courseId}`);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Enrollment statistics' })).toBeVisible();
    await expect(page.getByText(ACCOUNTS.student.name, { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Export CSV' })).toHaveAttribute(
      'href',
      `/api/enrollments/course/${courseId}/students/export`,
    );
    await expectNoHorizontalScroll(page);

    await page.getByRole('link', { name: 'Back to Courses' }).click();
    await expect(page).toHaveURL(/\/admin\/courses$/);
    await page.goto(`/admin/courses?search=${encodeURIComponent(title)}`);
    await openCourseMenu(page, title);
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText(/This course has 1 enrolment\(s\)/)).toBeVisible();
  });

  test('a Moderator sees published courses without the manager actions', async ({
    page,
  }, testInfo) => {
    await signInByApi(page, ACCOUNTS.admin.email);
    const title = uniqueTitle(testInfo.project.name);
    const courseId = await createCourse(page, title, true);
    await signInByApi(page, ACCOUNTS.moderator.email);

    await page.goto(`/admin/courses?search=${encodeURIComponent(title)}`);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bulk Edit' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Create Course' })).toHaveCount(0);
    await openCourseMenu(page, title);
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toHaveCount(0);
    await page.getByRole('menuitem', { name: 'View details' }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/courses/${courseId}$`));
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
