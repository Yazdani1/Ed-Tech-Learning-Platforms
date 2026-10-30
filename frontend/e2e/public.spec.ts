import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, isPhone, uniqueEmail } from './helpers';

/** Signs an API context (not the page) in as an Admin, to create the data a test needs. */
const adminApi = async (request: APIRequestContext): Promise<APIRequestContext> => {
  const response = await request.post('/api/auth/login', {
    data: { email: ACCOUNTS.admin.email, password: E2E_PASSWORD },
  });
  expect(response.ok()).toBe(true);
  return request;
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
  test('a visitor explores the home page and opens a category', async ({
    page,
    request,
  }, testInfo) => {
    const api = await adminApi(request);
    const name = uniqueName('E2E Public Category', testInfo.project.name);
    const created = await api.post('/api/categories', { data: { name } });
    expect(created.ok()).toBe(true);

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Explore by Category' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Popular Courses' })).toBeVisible();
    // Phones keep Sign In / Sign Up in the menu drawer; wider screens show them in the navbar
    if (isPhone(page)) {
      await page.getByRole('button', { name: 'Open site menu' }).click();
      await expect(
        page.getByRole('link', { name: 'Sign In' }).filter({ visible: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Close site menu' }).click();
    } else {
      await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    }
    await expectNoHorizontalScroll(page);

    await page.getByRole('link', { name: new RegExp(name) }).click();
    await expect(page).toHaveURL(/\/courses\?categories=[a-f0-9]{24}$/);
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
