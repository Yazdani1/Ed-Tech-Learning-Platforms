import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, uniqueEmail } from './helpers';

interface Created {
  _id: string;
}

const dataId = async (
  response: Awaited<ReturnType<APIRequestContext['post']>>,
): Promise<string> => {
  expect(response.ok(), await response.text()).toBe(true);
  const body = (await response.json()) as { data: Created };
  return body.data._id;
};

/** As the E2E admin: a published, public, free course with a unique title. */
const createFreeCourse = async (request: APIRequestContext, title: string): Promise<string> => {
  const login = await request.post('/api/auth/login', {
    data: { email: ACCOUNTS.admin.email, password: E2E_PASSWORD },
  });
  expect(login.ok()).toBe(true);
  const category = await dataId(
    await request.post('/api/categories', { data: { name: `${title} cat` } }),
  );
  const courseType = await dataId(
    await request.post('/api/course-types', { data: { name: `${title} type` } }),
  );
  const courseId = await dataId(
    await request.post('/api/courses', {
      data: { title, category, courseType, pricing: 'Free', visibility: 'Public' },
    }),
  );
  const publish = await request.patch(`/api/courses/${courseId}/status`, {
    data: { status: 'Published' },
  });
  expect(publish.ok()).toBe(true);
  return courseId;
};

/** A new student (signed in inside the page's browser context) enrolled in the course. */
const enrolNewStudent = async (page: Page, testInfo: TestInfo, courseId: string): Promise<void> => {
  const register = await page.request.post('/api/auth/register', {
    data: { name: 'E2E Learner', email: uniqueEmail(testInfo), password: E2E_PASSWORD },
  });
  expect(register.ok()).toBe(true);
  const enrol = await page.request.post(`/api/enrollments/${courseId}`);
  expect(enrol.ok(), await enrol.text()).toBe(true);
};

test.describe('Student area', () => {
  test('dashboard and My Courses list the enrolment; the student can remove it', async ({
    page,
    request,
  }, testInfo) => {
    const title = `E2E Course ${testInfo.project.name} ${Date.now()}`;
    const courseId = await createFreeCourse(request, title);
    await enrolNewStudent(page, testInfo, courseId);

    await page.goto('/student/dashboard');
    await expect(page.getByText('Welcome back, E2E Learner.', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(title) })).toHaveAttribute(
      'href',
      `/student/courses/${courseId}/learn`,
    );
    await expectNoHorizontalScroll(page);

    await page.getByRole('link', { name: 'All my courses' }).click();
    await expect(page).toHaveURL(/\/student\/courses$/);
    const direct = page.getByRole('region', { name: 'Free & Paid Courses' });
    await expect(direct.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByLabel('Search courses...').fill('no-such-course-xyz');
    await expect(page.getByText('No courses match "no-such-course-xyz".')).toBeVisible();
    await expect(page).toHaveURL(/search=no-such-course-xyz/);
    await page.getByLabel('Search courses...').fill('');

    await page.getByRole('button', { name: `Remove "${title}" from my courses` }).click();
    const dialog = page.getByRole('dialog', { name: 'Remove Course' });
    await dialog.getByRole('button', { name: 'Remove' }).click();

    await expect(page.getByText(`Removed from "${title}"`)).toBeVisible();
    await expect(page.getByText("You haven't enrolled in any courses yet.")).toBeVisible();
  });
});
