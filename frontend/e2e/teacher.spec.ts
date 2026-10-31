import { expect, request, test, type APIRequestContext } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, isPhone, uniqueEmail } from './helpers';

// Each test builds its own teacher account, linked teacher profile, course and enrolled student through the
// API (as the E2E Admin), so specs never share data and the two projects never clash.

const dataOf = async <T>(response: Awaited<ReturnType<APIRequestContext['post']>>): Promise<T> => {
  expect(response.ok(), await response.text()).toBe(true);
  return ((await response.json()) as { data: T }).data;
};

interface Created {
  _id: string;
}

interface TeacherSetup {
  teacherEmail: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
}

/** A new Teacher login linked to a new teacher profile, assigned to a new course with one enrolled student. */
const setUpTeacherCourse = async (
  baseURL: string,
  tag: string,
  teacherEmail: string,
): Promise<TeacherSetup> => {
  const admin = await request.newContext({ baseURL });
  await dataOf(
    await admin.post('/api/auth/login', {
      data: { email: ACCOUNTS.admin.email, password: E2E_PASSWORD },
    }),
  );
  const stamp = `${tag} ${Date.now()}`;
  const user = await dataOf<Created>(
    await admin.post('/api/users', {
      data: {
        name: `E2E Teacher ${stamp}`,
        email: teacherEmail,
        password: E2E_PASSWORD,
        role: 'Teacher',
      },
    }),
  );
  const profile = await dataOf<Created>(
    await admin.post('/api/teachers', {
      multipart: { name: `E2E Profile ${stamp}`, bio: 'Teaches the e2e tests.', userId: user._id },
    }),
  );
  const category = await dataOf<Created>(
    await admin.post('/api/categories', { data: { name: `E2E Cat ${stamp}` } }),
  );
  const courseType = await dataOf<Created>(
    await admin.post('/api/course-types', { data: { name: `E2E Type ${stamp}` } }),
  );
  const courseTitle = `E2E Teacher Course ${stamp}`;
  const course = await dataOf<Created>(
    await admin.post('/api/courses', {
      data: {
        title: courseTitle,
        category: category._id,
        courseType: courseType._id,
        visibility: 'Public',
        pricing: 'Free',
        teachers: JSON.stringify([profile._id]),
      },
    }),
  );
  await dataOf(
    await admin.patch(`/api/courses/${course._id}/status`, { data: { status: 'Published' } }),
  );
  await admin.dispose();

  const studentName = `E2E Learner ${stamp}`;
  const student = await request.newContext({ baseURL });
  await dataOf(
    await student.post('/api/auth/register', {
      data: { name: studentName, email: `student.${teacherEmail}`, password: E2E_PASSWORD },
    }),
  );
  await dataOf(await student.post(`/api/enrollments/${course._id}`));
  await student.dispose();

  return { teacherEmail, courseId: course._id, courseTitle, studentName };
};

test.describe('Teacher area', () => {
  test('a teacher sees the assigned course, its students and the link to the course', async ({
    page,
    baseURL,
  }, testInfo) => {
    const setup = await setUpTeacherCourse(
      baseURL ?? '',
      testInfo.project.name,
      uniqueEmail(testInfo),
    );
    const login = await page.request.post('/api/auth/login', {
      data: { email: setup.teacherEmail, password: E2E_PASSWORD },
    });
    expect(login.ok()).toBe(true);

    await page.goto('/teacher/courses');
    await expect(page.getByRole('heading', { level: 1, name: 'My Courses' })).toBeVisible();
    const card = page.getByRole('article', { name: setup.courseTitle, exact: true });
    await expect(card).toBeVisible();
    await expect(card.getByText('Published', { exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await expect(card.getByRole('link', { name: `Open "${setup.courseTitle}"` })).toHaveAttribute(
      'href',
      `/teacher/courses/${setup.courseId}/learn`,
    );

    await card.getByRole('button', { name: `Enrolled students of "${setup.courseTitle}"` }).click();
    const dialog = page.getByRole('dialog', { name: `Enrolled students: ${setup.courseTitle}` });
    await expect(dialog.getByText(setup.studentName, { exact: true })).toBeVisible();
    await expect(dialog.getByText('Free', { exact: true })).toBeVisible();
    if (isPhone(page)) await expectNoHorizontalScroll(page);
    await dialog.getByRole('button', { name: 'Close' }).first().click();
    await expect(dialog).toBeHidden();
  });

  test('a teacher without a linked profile is told what to do', async ({ page }) => {
    const login = await page.request.post('/api/auth/login', {
      data: { email: ACCOUNTS.teacher.email, password: E2E_PASSWORD },
    });
    expect(login.ok()).toBe(true);
    const mine = await page.request.get('/api/teachers/my-courses');
    const { total } = (await mine.json()) as { total: number };
    test.skip(total > 0, 'The shared E2E Teacher has a linked profile with courses');

    await page.goto('/teacher/courses');
    await expect(page.getByText(/No courses assigned to you yet/)).toBeVisible();
  });
});
