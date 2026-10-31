import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, uniqueEmail } from './helpers';

type ApiResponse = Awaited<ReturnType<APIRequestContext['post']>>;

const dataId = async (response: ApiResponse): Promise<string> => {
  expect(response.ok(), await response.text()).toBe(true);
  const body = (await response.json()) as { data: { _id: string } };
  return body.data._id;
};

interface SeededCourse {
  courseId: string;
  title: string;
  announcement: string;
  bank: string;
}

/**
 * As the E2E admin: a published free course with one YouTube lecture, an announcement and a quiz bank with
 * one question (the first option is correct).
 */
const seedCourse = async (
  request: APIRequestContext,
  testInfo: TestInfo,
): Promise<SeededCourse> => {
  const stamp = `${testInfo.project.name} ${Date.now()}`;
  const title = `E2E Player ${stamp}`;
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
  const sectionId = await dataId(
    await request.post(`/api/courses/${courseId}/sections`, { data: { title: 'Getting started' } }),
  );
  await dataId(
    await request.post(`/api/courses/${courseId}/sections/${sectionId}/lectures`, {
      data: { title: 'Welcome lecture', videoUrl: 'https://youtu.be/dQw4w9WgXcQ', duration: 90 },
    }),
  );
  const publish = await request.patch(`/api/courses/${courseId}/status`, {
    data: { status: 'Published' },
  });
  expect(publish.ok()).toBe(true);

  const announcement = `Exam on Friday ${stamp}`;
  await dataId(
    await request.post(`/api/announcements/course/${courseId}`, {
      data: { title: announcement, description: '<p>Bring a pencil</p>' },
    }),
  );
  const quizSection = await dataId(
    await request.post('/api/quiz-sections', { data: { course: courseId, title: 'Chapter 1' } }),
  );
  const bank = `Motion ${stamp}`;
  const bankId = await dataId(
    await request.post('/api/quiz-bank', { data: { course: courseId, quizSection, title: bank } }),
  );
  const question = await request.post(`/api/quiz-bank/${bankId}/questions`, {
    data: {
      question: 'Unit of force?',
      options: [
        { text: 'Newton', explanation: 'The SI unit of force' },
        { text: 'Joule' },
        { text: 'Watt' },
        { text: 'Pascal' },
      ],
      correctOptionIndices: [0],
    },
  });
  expect(question.ok(), await question.text()).toBe(true);
  return { courseId, title, announcement, bank };
};

const registerStudent = async (page: Page, testInfo: TestInfo): Promise<void> => {
  const register = await page.request.post('/api/auth/register', {
    data: { name: 'E2E Player Student', email: uniqueEmail(testInfo), password: E2E_PASSWORD },
  });
  expect(register.ok()).toBe(true);
};

test.describe('Course player', () => {
  test('a student must enrol first, then watches, reads announcements, asks and takes a quiz', async ({
    page,
    request,
  }, testInfo) => {
    const course = await seedCourse(request, testInfo);
    await registerStudent(page, testInfo);
    const playerUrl = `/student/courses/${course.courseId}/learn`;

    await page.goto(playerUrl);
    await expect(page.getByRole('heading', { name: 'Enrol to open this course' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View course & enrol' })).toHaveAttribute(
      'href',
      `/courses/${course.courseId}`,
    );

    const enrol = await page.request.post(`/api/enrollments/${course.courseId}`);
    expect(enrol.ok(), await enrol.text()).toBe(true);
    await page.goto(playerUrl);

    await expect(page.getByRole('heading', { name: course.title, level: 1 })).toBeVisible();
    await expect(page.locator('iframe[title="Welcome lecture"]')).toHaveAttribute(
      'src',
      /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/,
    );
    await expectNoHorizontalScroll(page);

    await page.getByRole('tab', { name: 'Announcements' }).click();
    await expect(page).toHaveURL(/tab=announcements/);
    const announcement = page.getByRole('article', { name: course.announcement });
    await expect(announcement.getByText('Bring a pencil')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Post Announcement' })).toHaveCount(0);

    await page.getByRole('tab', { name: 'Q & A' }).click();
    await page.getByRole('button', { name: 'Ask a Question' }).click();
    const dialog = page.getByRole('dialog', { name: 'New Question' });
    await dialog.getByLabel('Title').fill('What is inertia?');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('Please explain it simply.');
    await dialog.getByRole('button', { name: 'Post Question' }).click();
    await expect(page.getByText('Question posted')).toBeVisible();
    await expect(page.getByRole('article', { name: 'What is inertia?' })).toBeVisible();

    await page.getByRole('tab', { name: 'Quiz Bank' }).click();
    await page
      .getByRole('article', { name: course.bank })
      .getByRole('button', { name: /^All/ })
      .click();
    const card = page.getByRole('article', { name: 'Q 1 of 1' });
    await expect(card.getByText('The SI unit of force')).toHaveCount(0);
    await card.getByRole('checkbox', { name: /Newton/ }).click();
    await card.getByRole('button', { name: 'Check Answer' }).click();
    await expect(card.getByText('✓ Correct!')).toBeVisible();
    await expect(card.getByText('The SI unit of force')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('an admin opens the same player and sees the enrolled students', async ({
    page,
    request,
  }, testInfo) => {
    const course = await seedCourse(request, testInfo);
    await registerStudent(page, testInfo);
    const enrol = await page.request.post(`/api/enrollments/${course.courseId}`);
    expect(enrol.ok()).toBe(true);
    await page.request.post('/api/auth/logout');

    const login = await page.request.post('/api/auth/login', {
      data: { email: ACCOUNTS.admin.email, password: E2E_PASSWORD },
    });
    expect(login.ok()).toBe(true);
    await page.goto(`/admin/courses/${course.courseId}/learn?tab=students`);

    const students = page.getByRole('region', { name: 'Students' });
    await expect(students.getByRole('heading', { name: 'Enrolled Students (1)' })).toBeVisible();
    await expect(students.getByText('E2E Player Student').first()).toBeVisible();
    await expect(students.getByRole('link', { name: 'Export CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Post Announcement' })).toHaveCount(0);
    await page.getByRole('tab', { name: 'Announcements' }).click();
    await expect(page.getByRole('button', { name: 'Post Announcement' })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
