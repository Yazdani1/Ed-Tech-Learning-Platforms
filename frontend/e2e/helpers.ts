import { expect, type Page, type TestInfo } from '@playwright/test';

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

/** Signs in through the sign-in page (the current URL may carry ?next=). */
export const fillSignIn = async (
  page: Page,
  email: string,
  password = E2E_PASSWORD,
): Promise<void> => {
  await page.getByLabel('Email Address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
};

export const signIn = async (page: Page, email: string, password = E2E_PASSWORD): Promise<void> => {
  await page.goto('/auth/login');
  await fillSignIn(page, email, password);
};

/** Opens the menu (drawer on phones) so its links and the sign-out button are visible. */
export const openMenu = async (page: Page): Promise<void> => {
  if (isPhone(page)) await page.getByRole('button', { name: 'Open menu' }).click();
};

export const signOut = async (page: Page): Promise<void> => {
  await openMenu(page);
  await page.getByRole('button', { name: 'Logout' }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
};

/** No sideways scrolling at this viewport (mobile-first rule). */
export const expectNoHorizontalScroll = async (page: Page): Promise<void> => {
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits, 'page fits the viewport width').toBe(true);
};
