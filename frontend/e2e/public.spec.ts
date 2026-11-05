import {
  expect,
  test,
  type APIRequestContext,
  type APIResponse,
  type Page,
} from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, isPhone, uniqueEmail } from './helpers';

/** Signs an API context (not the page) in as an Admin, to create the data a test needs. */
const adminApi = async (request: APIRequestContext): Promise<APIRequestContext> => {
  const response = await request.post('/api/auth/login', {
    data: { email: ACCOUNTS.admin.email, password: E2E_PASSWORD },
  });
  expect(response.ok()).toBe(true);
  return request;
};

/** The `_id` of the created item in a { success, data } response. */
const idOf = async (response: APIResponse): Promise<string> => {
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { data: { _id: string } };
  return body.data._id;
};

const uniqueName = (prefix: string, project: string): string =>
  `${prefix} ${project} ${Date.now()}`;

/** Opens a public link from the navbar (the menu drawer on phones). */
const openPublicLink = async (page: Page, name: string): Promise<void> => {
  if (isPhone(page)) await page.getByRole('button', { name: 'Open site menu' }).click();
  // On phones the inline links are hidden and the drawer holds the same menu
  await page
    .getByRole('navigation', { name: 'Site menu' })
    .filter({ visible: true })
    .getByRole('link', { name })
    .click();
};

test.describe('Public site', () => {
  test('a visitor filters the free courses by category and opens a course from its card', async ({
    page,
    request,
  }, testInfo) => {
    const api = await adminApi(request);
    const name = uniqueName('E2E Home Category', testInfo.project.name);
    const category = await idOf(await api.post('/api/categories', { data: { name } }));
    const courseType = await idOf(
      await api.post('/api/course-types', { data: { name: `${name} type` } }),
    );
    const title = `${name} course`;
    const courseId = await idOf(
      await api.post('/api/courses', {
        data: { title, category, courseType, visibility: 'Public', pricing: 'Free' },
      }),
    );
    const published = await api.patch(`/api/courses/${courseId}/status`, {
      data: { status: 'Published' },
    });
    expect(published.ok()).toBe(true);

    await page.goto('/');
    const free = page.locator('section', {
      has: page.getByRole('heading', { name: 'Free Courses', exact: true }),
    });
    await expect(free).toBeVisible();
    await expect(page.getByText('Learn what matches your ambition')).toHaveCount(0);
    await expectNoHorizontalScroll(page);

    const categoryCard = free.getByRole('button', { name: new RegExp(name) });
    // Phones: the category row scrolls sideways inside the box
    await categoryCard.scrollIntoViewIfNeeded();
    await expect(categoryCard).toHaveText(`${name}1`);
    await categoryCard.click();
    await expect(categoryCard).toHaveAttribute('aria-pressed', 'true');
    await free.getByRole('link', { name: `See details of ${title}` }).click();
    await expect(page).toHaveURL(new RegExp(`/courses/${courseId}$`));
  });

  test('a visitor switches the site to Bangla and back from the navbar', async ({ page }) => {
    await page.goto('/');
    // The slider only renders once the client has loaded its data, so the page is hydrated
    const carousel = page.locator('[aria-roledescription="carousel"]');
    await expect(carousel).toBeVisible();
    await page.getByRole('button', { name: 'Switch to Bangla' }).click();
    await expect(page.getByRole('heading', { name: 'ফ্রি কোর্স', exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'bn');

    // The choice survives a reload
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
    await expect(carousel).toBeVisible();
    await page.getByRole('button', { name: 'ইংরেজিতে দেখুন' }).click();
    await expect(page.getByRole('heading', { name: 'Free Courses', exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('a visitor finds a teacher on /teachers through the menu', async ({
    page,
    request,
  }, testInfo) => {
    const api = await adminApi(request);
    const name = uniqueName('E2E Teacher Profile', testInfo.project.name);
    const created = await api.post('/api/teachers', {
      multipart: { name, bio: 'Teaches the e2e tests.', expertise: 'Testing, Playwright' },
    });
    expect(created.ok()).toBe(true);

    await page.goto('/');
    await openPublicLink(page, 'Teachers');
    await expect(page).toHaveURL(/\/teachers$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Our Instructors' })).toBeVisible();
    await expect(page.getByRole('heading', { name })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('a visitor signs in from /pricing and a Student subscribes', async ({
    page,
    request,
  }, testInfo) => {
    const api = await adminApi(request);
    const plan = uniqueName('E2E Plan', testInfo.project.name);
    const created = await api.post('/api/subscription-plans', {
      data: {
        plan,
        billingOptions: [{ label: 'Monthly', duration: 1, price: 300 }],
        features: ['Made by the e2e test'],
      },
    });
    expect(created.ok()).toBe(true);

    await page.goto('/pricing');
    const card = page.getByRole('article', { name: plan, exact: true });
    await expect(card.getByText('BDT 300')).toBeVisible();
    await expectNoHorizontalScroll(page);
    await card.getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fpricing$/);

    // A brand-new Student (the shared e2e student's subscription is left alone)
    const registered = await page.request.post('/api/auth/register', {
      data: { name: 'E2E Subscriber', email: uniqueEmail(testInfo), password: E2E_PASSWORD },
    });
    expect(registered.ok()).toBe(true);

    await page.goto('/pricing');
    await card.getByRole('button', { name: 'Subscribe' }).click();
    await expect(page.getByText(`Subscribed to ${plan} plan!`)).toBeVisible();
    await expect(card.getByRole('button', { name: 'Active Plan' })).toBeDisabled();
    await expect(page.getByText(new RegExp(`Current plan: ${plan}`))).toBeVisible();
  });
});
