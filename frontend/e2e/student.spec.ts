import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, isPhone, uniqueEmail } from './helpers';

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
  test('My Courses lists the enrolment and has no way to remove it', async ({
    page,
    request,
  }, testInfo) => {
    const title = `E2E Course ${testInfo.project.name} ${Date.now()}`;
    const courseId = await createFreeCourse(request, title);
    await enrolNewStudent(page, testInfo, courseId);

    await page.goto('/student/courses');
    await expect(page.getByRole('heading', { name: 'My Courses', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(title) })).toHaveAttribute(
      'href',
      `/student/courses/${courseId}/learn`,
    );
    const direct = page.getByRole('region', { name: 'Free & Paid Courses' });
    await expect(direct.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await expect(page.getByRole('button', { name: /Remove .* from my courses/ })).toHaveCount(0);

    await page.getByLabel('Search courses...').fill('no-such-course-xyz');
    await expect(page.getByText('No courses match "no-such-course-xyz".')).toBeVisible();
    await expect(page).toHaveURL(/search=no-such-course-xyz/);
    await page.getByLabel('Search courses...').fill('');
    await expect(direct.getByRole('heading', { name: title, exact: true })).toBeVisible();
  });

  test('the course page has no "leave" button for an enrolled student', async ({
    page,
    request,
  }, testInfo) => {
    const title = `E2E Leave ${testInfo.project.name} ${Date.now()}`;
    const courseId = await createFreeCourse(request, title);
    await enrolNewStudent(page, testInfo, courseId);

    await page.goto(`/courses/${courseId}`);

    await expect(page.getByRole('link', { name: 'Go to this course' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Leave this course' })).toHaveCount(0);
  });

  test('the student menu has no Pricing and the old dashboard is gone', async ({
    page,
    request,
  }, testInfo) => {
    const courseId = await createFreeCourse(
      request,
      `E2E Menu ${testInfo.project.name} ${Date.now()}`,
    );
    await enrolNewStudent(page, testInfo, courseId);
    await page.goto('/student/courses');

    if (isPhone(page)) await page.getByRole('button', { name: 'Open menu' }).click();
    const menu = page.getByRole('navigation', { name: 'Main menu' }).filter({ visible: true });
    await expect(menu.getByRole('link', { name: 'My Courses' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Pricing' })).toHaveCount(0);
    await expect(menu.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);
  });

  test('the top bar shows the student with the avatar and the student ID', async ({
    page,
    request,
  }, testInfo) => {
    const courseId = await createFreeCourse(
      request,
      `E2E Top ${testInfo.project.name} ${Date.now()}`,
    );
    await enrolNewStudent(page, testInfo, courseId);
    await page.goto('/student/courses');

    const user = page.getByTestId('top-bar-user');
    await expect(user).toBeVisible();
    await expect(user.locator('.MuiAvatar-root')).toBeVisible();
    await expect(user.getByText('E2E Learner')).toBeVisible();
    await expect(user.getByText(/^Student ID: \d{3}-\d{3}-\d{3}$/)).toBeVisible();
  });
});
