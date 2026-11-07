import { expect, request, test, type APIRequestContext } from '@playwright/test';

import {
  ACCOUNTS,
  E2E_PASSWORD,
  expectNoHorizontalScroll,
  openMenu,
  signIn,
  signInAndWait,
  uniqueEmail,
} from './helpers';

// Each test makes its own course and student through the API, so specs never share data.

const STUDENT_PASSWORD = 'Student-pass-1';
const PHONE = '+880 1711-555000';

const dataOf = async <T>(response: Awaited<ReturnType<APIRequestContext['post']>>): Promise<T> => {
  expect(response.ok(), await response.text()).toBe(true);
  return ((await response.json()) as { data: T }).data;
};

const signedInContext = async (
  baseURL: string,
  email: string,
  password = E2E_PASSWORD,
): Promise<APIRequestContext> => {
  const context = await request.newContext({ baseURL });
  await dataOf(await context.post('/api/auth/login', { data: { email, password } }));
  return context;
};

/** A published free course, and a student (with a phone number) enrolled in it. */
const createEnrolledStudent = async (baseURL: string, tag: string) => {
  const admin = await signedInContext(baseURL, ACCOUNTS.admin.email);
  const stamp = `${tag} ${Date.now()}`;
  const category = await dataOf<{ _id: string }>(
    await admin.post('/api/categories', { data: { name: `E2E Stu Cat ${stamp}` } }),
  );
  const courseType = await dataOf<{ _id: string }>(
    await admin.post('/api/course-types', { data: { name: `E2E Stu Type ${stamp}` } }),
  );
  const title = `E2E Students Course ${stamp}`;
  const course = await dataOf<{ _id: string }>(
    await admin.post('/api/courses', {
      data: {
        title,
        category: category._id,
        courseType: courseType._id,
        visibility: 'Public',
        pricing: 'Free',
      },
    }),
  );
  await dataOf(
    await admin.patch(`/api/courses/${course._id}/status`, { data: { status: 'Published' } }),
  );
  const name = `E2E Learner ${stamp}`;
  const email = `stu.${tag.replace(/\W/g, '')}.${Date.now()}@example.com`;
  await dataOf(
    await admin.post('/api/users', {
      data: { name, email, password: STUDENT_PASSWORD, role: 'Student', phone: PHONE },
    }),
  );
  await admin.dispose();

  const student = await signedInContext(baseURL, email, STUDENT_PASSWORD);
  await dataOf(await student.post(`/api/enrollments/${course._id}`, { data: {} }));
  await student.dispose();
  return { courseId: course._id, title, name, email };
};

test.describe('Students page', () => {
  test('an Admin finds a student by course and opens the full details', async ({
    page,
    baseURL,
  }, testInfo) => {
    const created = await createEnrolledStudent(baseURL ?? '', testInfo.project.name);
    await signIn(page, ACCOUNTS.admin.email);
    await expect(page).toHaveURL(/\/admin\//);
    await openMenu(page);
    await expect(
      page.getByRole('link', { name: 'Students', exact: true }).filter({ visible: true }),
    ).toBeVisible();

    await page.goto(`/admin/students?search=${encodeURIComponent(created.email)}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Students' })).toBeVisible();
    await expect(page.getByText(created.name, { exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);

    // Filter by the new course in the left side panel
    await page.getByRole('button', { name: 'Filter by course (now: All courses)' }).click();
    await page.getByRole('textbox', { name: 'Search for a keyword' }).fill(created.title);
    const list = page.getByRole('list', { name: 'Courses' });
    await list.getByRole('checkbox', { name: created.title }).click();
    await expect(list.getByText('1 student', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Apply (1 course)' }).click();
    await expect(page).toHaveURL(new RegExp(`courses=${created.courseId}`));
    await expect(page.getByText(created.name, { exact: true })).toBeVisible();

    // The right side panel: contact details and the course bought
    await page.getByText(created.name, { exact: true }).click();
    const panel = page.getByRole('dialog', { name: created.name });
    await expect(panel.getByRole('link', { name: created.email })).toBeVisible();
    await expect(panel.getByRole('link', { name: PHONE })).toBeVisible();
    await expect(panel.getByText(created.title)).toBeVisible();
    await expect(panel.getByText('Courses (1)')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('a Moderator cannot open the students page', async ({ page }) => {
    await signIn(page, ACCOUNTS.moderator.email);
    await expect(page).toHaveURL(/\/admin\//);
    await page.goto('/admin/students');
    await expect(page).toHaveURL(/\/admin\/courses$/);
    await openMenu(page);
    await expect(
      page.getByRole('link', { name: 'Students', exact: true }).filter({ visible: true }),
    ).toHaveCount(0);
  });

  test('a new student can add a phone number when registering', async ({ page }, testInfo) => {
    await page.goto('/?auth=register');
    await page.getByLabel('Full Name').fill('E2E Phone Student');
    await page.getByLabel('Email Address').fill(uniqueEmail(testInfo));
    await page.getByLabel('Phone number').fill(PHONE);
    await page.getByLabel('Password', { exact: true }).fill(STUDENT_PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/student\/courses$/);
    await page.goto('/student/profile');
    await expect(page.getByText(PHONE, { exact: true })).toBeVisible();
  });

  test('a Super Admin filters students, sees the count and exports a CSV', async ({
    page,
    baseURL,
  }) => {
    await createEnrolledStudent(baseURL ?? '', 'filters');
    await signInAndWait(page, ACCOUNTS.superAdmin.email);

    await page.goto('/admin/students?enrollment=paid&sort=timeSpent');
    await expect(page.getByRole('heading', { level: 1, name: 'Students' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Enrolment' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Sort by' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByRole('button', { name: 'Export CSV' }).click();
    const dialog = page.getByRole('dialog', { name: 'Export CSV' });
    const download = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Download CSV' }).click();
    expect((await download).suggestedFilename()).toMatch(/^students-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
