import { expect, request, test, type APIRequestContext } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, uniqueEmail } from './helpers';

// Each test builds its own paid public course through the API (as the E2E Admin).

const dataOf = async <T>(response: Awaited<ReturnType<APIRequestContext['post']>>): Promise<T> => {
  expect(response.ok(), await response.text()).toBe(true);
  return ((await response.json()) as { data: T }).data;
};

const createPaidCourse = async (baseURL: string, tag: string) => {
  const admin = await request.newContext({ baseURL });
  await dataOf(
    await admin.post('/api/auth/login', {
      data: { email: ACCOUNTS.admin.email, password: E2E_PASSWORD },
    }),
  );
  const stamp = `${tag} ${Date.now()}`;
  const category = await dataOf<{ _id: string }>(
    await admin.post('/api/categories', { data: { name: `E2E Pay Cat ${stamp}` } }),
  );
  const courseType = await dataOf<{ _id: string }>(
    await admin.post('/api/course-types', { data: { name: `E2E Pay Type ${stamp}` } }),
  );
  const title = `E2E Paid Course ${stamp}`;
  const course = await dataOf<{ _id: string }>(
    await admin.post('/api/courses', {
      data: {
        title,
        category: category._id,
        courseType: courseType._id,
        visibility: 'Public',
        pricing: 'Paid',
        price: 800,
        listPrice: 1000,
        discountPrice: 800,
      },
    }),
  );
  await dataOf(
    await admin.patch(`/api/courses/${course._id}/status`, { data: { status: 'Published' } }),
  );
  return { id: course._id, title };
};

test.describe('Payment details page', () => {
  test('Enroll Now opens the page; a visitor signs in and comes back; a student gets the course', async ({
    page,
    baseURL,
  }, testInfo) => {
    const course = await createPaidCourse(baseURL ?? '', `flow ${testInfo.project.name}`);
    const email = uniqueEmail(testInfo);
    const anonymous = await request.newContext({ baseURL });
    expect(
      (
        await anonymous.post('/api/auth/register', {
          data: { name: 'E2E Pay Student', email, password: E2E_PASSWORD },
        })
      ).ok(),
    ).toBe(true);

    await page.goto(`/courses/${course.id}`);
    await expect(page.getByRole('heading', { level: 1, name: course.title })).toBeVisible();
    await expectNoHorizontalScroll(page);
    const bar = page.getByRole('complementary', { name: 'Enrol in this course' });
    await bar.getByRole('link', { name: 'Enroll Now' }).click();
    await expect(page).toHaveURL(new RegExp(`/courses/${course.id}/payment$`));
    await expect(page.getByRole('heading', { level: 1, name: 'Complete Payment' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /bKash/ })).toBeChecked();
    await expect(page.getByText('৳800').first()).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByRole('link', { name: 'Sign in to continue' }).click();
    await page.getByLabel(/email/i).fill(email);
    await page
      .getByLabel(/password/i)
      .first()
      .fill(E2E_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(new RegExp(`/courses/${course.id}/payment$`));

    await page.getByRole('button', { name: 'Complete payment' }).click();
    await expect(page.getByRole('link', { name: 'Go to this course' })).toHaveAttribute(
      'href',
      `/student/courses/${course.id}/learn`,
    );
  });

  test('nothing to buy: a missing course, and staff cannot pay', async ({
    page,
    baseURL,
  }, testInfo) => {
    await page.goto('/courses/not-a-course/payment');
    await expect(page.getByText('Course not found.')).toBeVisible();

    const course = await createPaidCourse(baseURL ?? '', `staff ${testInfo.project.name}`);
    const signedIn = await page.request.post('/api/auth/login', {
      data: { email: ACCOUNTS.teacher.email, password: E2E_PASSWORD },
    });
    expect(signedIn.ok()).toBe(true);
    await page.goto(`/courses/${course.id}/payment`);
    await expect(page.getByText('Only student accounts can enrol in a course.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Complete payment' })).toBeDisabled();
  });
});
