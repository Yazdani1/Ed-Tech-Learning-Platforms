import { expect, request, test, type APIRequestContext } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, isPhone, uniqueEmail } from './helpers';

// Each test builds its own public course through the API (as the E2E Admin), so specs never share data.

const PREVIEW_VIDEO = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

interface CreatedCourse {
  id: string;
  title: string;
  categoryName: string;
}

const dataOf = async <T>(response: Awaited<ReturnType<APIRequestContext['post']>>): Promise<T> => {
  expect(response.ok(), await response.text()).toBe(true);
  return ((await response.json()) as { data: T }).data;
};

/** A published, public, free course with one section: a free YouTube preview and a locked lecture. */
const createCourse = async (baseURL: string, tag: string): Promise<CreatedCourse> => {
  const admin = await request.newContext({ baseURL });
  await dataOf(
    await admin.post('/api/auth/login', {
      data: { email: ACCOUNTS.admin.email, password: E2E_PASSWORD },
    }),
  );
  const stamp = `${tag} ${Date.now()}`;
  const categoryName = `E2E Cat ${stamp}`;
  const category = await dataOf<{ _id: string }>(
    await admin.post('/api/categories', { data: { name: categoryName } }),
  );
  const courseType = await dataOf<{ _id: string }>(
    await admin.post('/api/course-types', { data: { name: `E2E Type ${stamp}` } }),
  );
  const title = `E2E Course ${stamp}`;
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
  const section = await dataOf<{ _id: string }>(
    await admin.post(`/api/courses/${course._id}/sections`, { data: { title: 'Getting started' } }),
  );
  const lectures = `/api/courses/${course._id}/sections/${section._id}/lectures`;
  await dataOf(
    await admin.post(lectures, {
      data: { title: 'Welcome preview', videoUrl: PREVIEW_VIDEO, isPreview: true, duration: 90 },
    }),
  );
  await dataOf(
    await admin.post(lectures, {
      data: { title: 'Locked lesson', videoUrl: PREVIEW_VIDEO, isPreview: false },
    }),
  );
  await dataOf(
    await admin.patch(`/api/courses/${course._id}/status`, { data: { status: 'Published' } }),
  );
  await admin.dispose();
  return { id: course._id, title, categoryName };
};

test.describe('Course catalog', () => {
  test('a visitor finds a course by search and category, and opens it', async ({
    page,
    baseURL,
  }, testInfo) => {
    const course = await createCourse(baseURL ?? '', testInfo.project.name);

    await page.goto(`/courses?search=${encodeURIComponent(course.title)}`);
    await expect(page.getByRole('heading', { level: 1, name: 'All Courses' })).toBeVisible();
    await expect(page.getByText('1 course found')).toBeVisible();
    await expectNoHorizontalScroll(page);

    // The category filter (sidebar on desktop, drawer on phones) narrows the same search
    if (isPhone(page)) await page.getByRole('button', { name: /^Filters/ }).click();
    const panel = isPhone(page)
      ? page.getByRole('dialog')
      : page.getByRole('complementary', { name: 'Filters' });
    // The checked state lives in the URL, so it flips after the navigation: click, then assert (not .check())
    const categoryBox = panel.getByRole('checkbox', { name: new RegExp(course.categoryName) });
    await categoryBox.click();
    await expect(categoryBox).toBeChecked();
    await expect(page).toHaveURL(/categories=/);
    if (isPhone(page)) await page.getByRole('button', { name: /^Show courses/ }).click();

    await page.getByRole('link', { name: new RegExp(course.title) }).click();
    await expect(page).toHaveURL(new RegExp(`/courses/${course.id}$`));
    await expect(page.getByRole('heading', { level: 1, name: course.title })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Enroll Free' })).toHaveAttribute(
      'href',
      '/auth/register',
    );
    await expectNoHorizontalScroll(page);
  });

  test('the free-courses page lists the new free course', async ({ page, baseURL }, testInfo) => {
    const course = await createCourse(baseURL ?? '', `free ${testInfo.project.name}`);
    await page.goto('/free-courses');
    await expect(page.getByRole('heading', { level: 1, name: 'Free Courses' })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(course.title) })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('a visitor plays a free preview lecture', async ({ page, baseURL }, testInfo) => {
    const course = await createCourse(baseURL ?? '', `preview ${testInfo.project.name}`);
    await page.goto(`/courses/${course.id}`);

    await page.getByRole('button', { name: /Getting started/ }).click();
    await expect(page.getByText('Locked lesson')).toBeVisible();
    await page.getByRole('button', { name: /Welcome preview/ }).click();
    const player = page.getByRole('dialog').locator('iframe[title="Welcome preview"]');
    await expect(player).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  });

  test('a new student enrols, then sees "Go to this course"', async ({
    page,
    baseURL,
  }, testInfo) => {
    const course = await createCourse(baseURL ?? '', `enrol ${testInfo.project.name}`);
    const email = uniqueEmail(testInfo);
    const registered = await page.request.post('/api/auth/register', {
      data: { name: 'E2E Browse Student', email, password: E2E_PASSWORD },
    });
    expect(registered.ok()).toBe(true);

    await page.goto(`/courses/${course.id}`);
    await page.getByRole('button', { name: 'Enroll Now – Free' }).click();
    await expect(page.getByText('Enrolled successfully!')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to this course' })).toHaveAttribute(
      'href',
      `/student/courses/${course.id}/learn`,
    );

    await page.goto(`/courses?search=${encodeURIComponent(course.title)}`);
    await expect(page.getByRole('link', { name: 'Go to this course' })).toBeVisible();
  });

  test('an unknown course shows "Course not found"', async ({ page }) => {
    await page.goto('/courses/000000000000000000000000');
    await expect(page.getByText('Course not found.')).toBeVisible();
    // A malformed id is not even requested
    await page.goto('/courses/not-a-course-id');
    await expect(page.getByText('Course not found.')).toBeVisible();
  });
});
