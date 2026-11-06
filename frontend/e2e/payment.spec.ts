import { expect, request, test, type APIRequestContext } from '@playwright/test';

import {
  ACCOUNTS,
  E2E_PASSWORD,
  expectNoHorizontalScroll,
  fillSignIn,
  uniqueEmail,
} from './helpers';

// Each test builds its own paid public course through the API (as the E2E Admin).

const dataOf = async <T>(response: Awaited<ReturnType<APIRequestContext['post']>>): Promise<T> => {
  expect(response.ok(), await response.text()).toBe(true);
  return ((await response.json()) as { data: T }).data;
};

const createPaidCourse = async (baseURL: string, tag: string, discounted = true) => {
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
        price: discounted ? 800 : 1000,
        listPrice: 1000,
        discountPrice: discounted ? 800 : 1000,
      },
    }),
  );
  await dataOf(
    await admin.patch(`/api/courses/${course._id}/status`, { data: { status: 'Published' } }),
  );
  return { id: course._id, title };
};

/** A 50% coupon with a code of its own on the course (as the E2E Admin). */
const createCoupon = async (baseURL: string, courseId: string, code: string): Promise<void> => {
  const admin = await request.newContext({ baseURL });
  await dataOf(
    await admin.post('/api/auth/login', {
      data: { email: ACCOUNTS.admin.email, password: E2E_PASSWORD },
    }),
  );
  await dataOf(
    await admin.post('/api/coupons', {
      data: { course: courseId, code, discountType: 'percent', value: 50 },
    }),
  );
  await admin.dispose();
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
    await expect(page).toHaveURL(/\?auth=login&next=/);
    await fillSignIn(page, email);
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

  test('a student applies a coupon, removes it and pays with the chosen code and method', async ({
    page,
    baseURL,
  }, testInfo) => {
    const course = await createPaidCourse(baseURL ?? '', `coupon ${testInfo.project.name}`, false);
    const code = `E2E${Date.now().toString().slice(-8)}`;
    await createCoupon(baseURL ?? '', course.id, code);
    const registered = await page.request.post('/api/auth/register', {
      data: { name: 'E2E Coupon Student', email: uniqueEmail(testInfo), password: E2E_PASSWORD },
    });
    expect(registered.ok()).toBe(true);

    await page.goto(`/courses/${course.id}/payment`);
    const summary = page.getByRole('region', { name: 'Order summary' });
    await expect(summary).toBeVisible();
    await expectNoHorizontalScroll(page);

    await summary.getByLabel('Coupon code').fill(code.toLowerCase());
    await summary.getByRole('button', { name: 'Apply' }).click();
    await expect(summary.getByText(`${code} applied: you save ৳500`)).toBeVisible();
    await expect(summary.getByText('- ৳500')).toBeVisible();

    await summary.getByRole('button', { name: 'Remove coupon' }).click();
    await expect(summary.getByText('No coupon: you pay the list price.')).toBeVisible();
    await expect(summary.getByText(/applied: you save/)).toHaveCount(0);

    await summary.getByLabel('Coupon code').fill('WRONGCODE99');
    await summary.getByRole('button', { name: 'Apply' }).click();
    await expect(
      summary.getByRole('alert').or(summary.locator('.Mui-error').first()),
    ).toBeVisible();

    await summary.getByLabel('Coupon code').fill(code);
    await summary.getByRole('button', { name: 'Apply' }).click();
    await expect(summary.getByText(`${code} applied: you save ৳500`)).toBeVisible();
    await page.getByRole('radio', { name: /Cards & other/ }).check();
    await summary.getByRole('button', { name: 'Complete payment' }).click();
    await expect(page.getByRole('link', { name: 'Go to this course' })).toBeVisible();

    const mine = await page.request.get('/api/enrollments');
    expect(mine.ok()).toBe(true);
  });

  test('the coupon chosen on the course page is kept on the payment page', async ({
    page,
    baseURL,
  }, testInfo) => {
    const course = await createPaidCourse(baseURL ?? '', `keep ${testInfo.project.name}`, false);
    const code = `KEEP${Date.now().toString().slice(-8)}`;
    await createCoupon(baseURL ?? '', course.id, code);

    await page.goto(`/courses/${course.id}`);
    const card = page.getByRole('complementary').first();
    await card.getByLabel('Coupon code').fill(code);
    await card.getByRole('button', { name: 'Apply' }).click();
    await expect(card.getByText(`${code} applied: you save ৳500`)).toBeVisible();

    await card.getByRole('link', { name: 'Enroll Now' }).click();
    await expect(page).toHaveURL(new RegExp(`/courses/${course.id}/payment$`));
    const summary = page.getByRole('region', { name: 'Order summary' });
    await expect(summary.getByText(`${code} applied: you save ৳500`)).toBeVisible();
  });

  test('the course discount code is pre-filled on the payment page and can be removed', async ({
    page,
    baseURL,
  }, testInfo) => {
    const course = await createPaidCourse(baseURL ?? '', `auto ${testInfo.project.name}`);
    const registered = await page.request.post('/api/auth/register', {
      data: { name: 'E2E Auto Student', email: uniqueEmail(testInfo), password: E2E_PASSWORD },
    });
    expect(registered.ok()).toBe(true);

    await page.goto(`/courses/${course.id}/payment`);
    const summary = page.getByRole('region', { name: 'Order summary' });
    await expect(summary.getByText(/applied: you save ৳200/)).toBeVisible();
    await expect(summary.getByText('Saving ৳200 (20% off)')).toBeVisible();

    await summary.getByRole('button', { name: 'Remove coupon' }).click();
    await expect(summary.getByText('No coupon: you pay the list price.')).toBeVisible();
    await expect(summary.getByText('Saving ৳200 (20% off)')).toHaveCount(0);
    await expectNoHorizontalScroll(page);
  });
});
