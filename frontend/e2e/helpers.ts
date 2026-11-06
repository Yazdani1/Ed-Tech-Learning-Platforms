import {
  expect,
  request,
  type APIRequestContext,
  type Page,
  type TestInfo,
} from '@playwright/test';

/** Same as backend/tests/e2e/seed.ts (test database only). */
export const E2E_PASSWORD = 'E2e-test-password-1';

export const ACCOUNTS = {
  superAdmin: { email: 'e2e.superadmin@example.com', name: 'E2E Super Admin' },
  admin: { email: 'e2e.admin@example.com', name: 'E2E Admin' },
  moderator: { email: 'e2e.moderator@example.com', name: 'E2E Moderator' },
  teacher: { email: 'e2e.teacher@example.com', name: 'E2E Teacher' },
  student: { email: 'e2e.student@example.com', name: 'E2E Student' },
} as const;

/** A fresh email per test and project, so parallel runs never clash. */
export const uniqueEmail = (testInfo: TestInfo): string =>
  `e2e.${testInfo.project.name}.${Date.now()}.${testInfo.workerIndex}@example.com`;

/** True on the phone project: the sidebar is a drawer behind the top bar's menu button. */
export const isPhone = (page: Page): boolean => (page.viewportSize()?.width ?? 0) < 900;

/** Signs in through the sign-in panel (it is open on the current page, e.g. /?auth=login&next=...). */
export const fillSignIn = async (
  page: Page,
  email: string,
  password = E2E_PASSWORD,
): Promise<void> => {
  await page.getByLabel('Email Address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
};

/** Opens the sign-in panel on the home page (the old /auth/login address redirects here) and signs in. */
export const signIn = async (page: Page, email: string, password = E2E_PASSWORD): Promise<void> => {
  await page.goto('/?auth=login');
  await fillSignIn(page, email, password);
};

/** Signs in and waits until the panel has done its work (the session cookie is set and the page changed). */
export const signInAndWait = async (
  page: Page,
  email: string,
  password = E2E_PASSWORD,
): Promise<void> => {
  await signIn(page, email, password);
  await expect(page).not.toHaveURL(/auth=login/);
};

/** The address of the home page with the sign-in panel open (after signing out or on a protected page). */
export const SIGN_IN_PANEL_URL = /\/\?auth=login(&|$)/;

/** Opens the menu (drawer on phones) so its links and the sign-out button are visible. */
export const openMenu = async (page: Page): Promise<void> => {
  if (isPhone(page)) await page.getByRole('button', { name: 'Open menu' }).click();
};

export const signOut = async (page: Page): Promise<void> => {
  await openMenu(page);
  await page.getByRole('button', { name: 'Logout' }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/\?auth=login$/);
};

/** No sideways scrolling at this viewport (mobile-first rule). */
export const expectNoHorizontalScroll = async (page: Page): Promise<void> => {
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits, 'page fits the viewport width').toBe(true);
};

// ---- API helpers for specs that build their own data (as the seeded E2E accounts) ----

type ApiResponse = Awaited<ReturnType<APIRequestContext['post']>>;

/** The `data` of a successful API response (fails the test with the body otherwise). */
export const dataOf = async <T>(response: ApiResponse): Promise<T> => {
  expect(response.ok(), await response.text()).toBe(true);
  return ((await response.json()) as { data: T }).data;
};

/** An API client signed in as this account (the token cookie stays in the client). */
export const apiAs = async (baseURL: string, email: string): Promise<APIRequestContext> => {
  const api = await request.newContext({ baseURL });
  await dataOf(await api.post('/api/auth/login', { data: { email, password: E2E_PASSWORD } }));
  return api;
};

export interface PaidCourse {
  id: string;
  title: string;
}

/**
 * A published, public, paid course made as the E2E Admin: list price 1000, and with `discounted` a buying
 * price of 800 (which gives the course its own auto coupon with a generated code).
 */
export const createPaidCourse = async (
  baseURL: string,
  tag: string,
  discounted = false,
): Promise<PaidCourse> => {
  const admin = await apiAs(baseURL, ACCOUNTS.admin.email);
  const stamp = `${tag} ${Date.now()}`;
  const category = await dataOf<{ _id: string }>(
    await admin.post('/api/categories', { data: { name: `E2E Cat ${stamp}` } }),
  );
  const courseType = await dataOf<{ _id: string }>(
    await admin.post('/api/course-types', { data: { name: `E2E Type ${stamp}` } }),
  );
  const title = `E2E Paid ${stamp}`;
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
  await admin.dispose();
  return { id: course._id, title };
};
