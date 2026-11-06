import { expect, test, type Page } from '@playwright/test';

import {
  ACCOUNTS,
  E2E_PASSWORD,
  expectNoHorizontalScroll,
  fillSignIn,
  isPhone,
  signIn,
  signOut,
  uniqueEmail,
} from './helpers';

/** Opens the public navbar's Sign In / Sign Up (on phones they are in the site menu drawer). */
const openFromNavbar = async (page: Page, name: 'Sign In' | 'Sign Up'): Promise<void> => {
  if (isPhone(page)) await page.getByRole('button', { name: 'Open site menu' }).click();
  await page.getByRole('link', { name, exact: true }).filter({ visible: true }).click();
};

test.describe('Sign in panel', () => {
  test('opens from the navbar on any page, over that page', async ({ page }) => {
    await page.goto('/pricing');
    await openFromNavbar(page, 'Sign In');

    await expect(page).toHaveURL(/\/pricing\?auth=login$/);
    const panel = page.getByRole('dialog', { name: 'Sign In' });
    await expect(panel.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await fillSignIn(page, ACCOUNTS.student.email);
    await expect(page).toHaveURL(/\/student\/courses$/);
  });

  test('the cross closes the panel and keeps the page', async ({ page }) => {
    await page.goto('/pricing');
    await openFromNavbar(page, 'Sign In');
    const panel = page.getByRole('dialog', { name: 'Sign In' });
    await expect(panel).toBeVisible();

    await panel.getByRole('button', { name: 'Close' }).click();

    await expect(panel).toBeHidden();
    await expect(page).toHaveURL(/\/pricing$/);
  });

  test('switches between sign in and create account inside the panel', async ({ page }) => {
    await page.goto('/?auth=login');
    await page.getByRole('button', { name: 'Create an account' }).click();

    await expect(page).toHaveURL(/\/\?auth=register$/);
    await expect(page.getByRole('form', { name: 'Create account form' })).toBeVisible();
  });

  test('the old /auth/login and /auth/register addresses open the panel on the home page', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/\/\?auth=login$/);
    await expect(page.getByRole('form', { name: 'Sign in form' })).toBeVisible();

    await page.goto('/auth/register?next=/pricing');
    await expect(page).toHaveURL(/\/\?auth=register&next=%2Fpricing$/);
    await expect(page.getByRole('form', { name: 'Create account form' })).toBeVisible();
  });

  test('validates the form before calling the server', async ({ page }) => {
    await page.goto('/?auth=login');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('This field is required')).toHaveCount(2);
    await expectNoHorizontalScroll(page);
  });

  test('shows the server message for a wrong password', async ({ page }) => {
    await signIn(page, ACCOUNTS.student.email, 'wrong-password');

    await expect(page.getByRole('form', { name: 'Sign in form' }).getByRole('alert')).toHaveText(
      'Invalid credentials',
    );
    await expect(page).toHaveURL(/\/\?auth=login$/);
  });

  test.describe('lands each role on its home page', () => {
    const homes = [
      [ACCOUNTS.superAdmin, '/admin/dashboard', 'Dashboard'],
      [ACCOUNTS.admin, '/admin/courses', 'Courses'],
      [ACCOUNTS.moderator, '/admin/courses', 'Courses'],
      [ACCOUNTS.teacher, '/teacher/courses', 'My Courses'],
      [ACCOUNTS.student, '/student/courses', 'My Courses'],
    ] as const;
    for (const [account, home, heading] of homes) {
      test(`${account.name} -> ${home}`, async ({ page }) => {
        await signIn(page, account.email);

        await expect(page).toHaveURL(new RegExp(`${home}$`));
        await expect(
          page.getByRole('heading', { name: heading, exact: true, level: 1 }),
        ).toBeVisible();
        await expectNoHorizontalScroll(page);
      });
    }
  });

  test('a protected page opens the panel and returns to that page after signing in', async ({
    page,
  }) => {
    await page.goto('/admin/courses?tab=2');
    await expect(page).toHaveURL(/\/\?auth=login&next=%2Fadmin%2Fcourses%3Ftab%3D2$/);
    await expect(page.getByRole('form', { name: 'Sign in form' })).toBeVisible();

    await fillSignIn(page, ACCOUNTS.admin.email);

    await expect(page).toHaveURL(/\/admin\/courses\?tab=2$/);
  });

  test('never follows an external ?next= (open redirect)', async ({ page }) => {
    await page.goto('/?auth=login&next=/%09/evil.example');
    await fillSignIn(page, ACCOUNTS.student.email);

    await expect(page).toHaveURL(/\/student\/courses$/);
  });

  test('a next page of another role goes to the own home page', async ({ page }) => {
    await page.goto('/?auth=login&next=/admin/courses');
    await fillSignIn(page, ACCOUNTS.student.email);

    await expect(page).toHaveURL(/\/student\/courses$/);
  });
});

test.describe('Register in the panel', () => {
  test('creates a student account and opens My Courses', async ({ page }, testInfo) => {
    await page.goto('/?auth=register');
    await page.getByLabel('Full Name').fill('E2E New Student');
    await page.getByLabel('Email Address').fill(uniqueEmail(testInfo));
    await page.getByLabel('Password', { exact: true }).fill('short');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();

    await page.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/student\/courses$/);
    await expect(page.getByRole('heading', { name: 'My Courses', level: 1 })).toBeVisible();
  });

  test('says when the email is already registered', async ({ page }) => {
    await page.goto('/?auth=register');
    await page.getByLabel('Full Name').fill('Someone');
    await page.getByLabel('Email Address').fill(ACCOUNTS.student.email);
    await page.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(
      page.getByRole('form', { name: 'Create account form' }).getByRole('alert'),
    ).toHaveText('Email is already registered');
  });
});

test.describe('Sign out and access rules', () => {
  test('signing out ends the session and protects the area again', async ({ page }) => {
    await signIn(page, ACCOUNTS.teacher.email);
    await expect(page).toHaveURL(/\/teacher\/courses$/);

    await signOut(page);
    await page.goto('/teacher/courses');

    await expect(page).toHaveURL(/\/\?auth=login&next=/);
  });

  test("a student cannot open the admin area (sent to the student's own home)", async ({
    page,
  }) => {
    await signIn(page, ACCOUNTS.student.email);
    await expect(page).toHaveURL(/\/student\/courses$/);

    await page.goto('/admin/courses');

    await expect(page).toHaveURL(/\/student\/courses$/);
  });

  test('the removed student dashboard address is not a page any more', async ({ page }) => {
    await signIn(page, ACCOUNTS.student.email);
    await expect(page).toHaveURL(/\/student\/courses$/);

    const response = await page.goto('/student/dashboard');

    expect(response?.status()).toBe(404);
  });

  test('an Admin opening the Super Admin dashboard is sent to the course list', async ({
    page,
  }) => {
    await signIn(page, ACCOUNTS.admin.email);
    await expect(page).toHaveURL(/\/admin\/courses$/);

    await page.goto('/admin/dashboard');

    await expect(page).toHaveURL(/\/admin\/courses$/);
  });

  test('a signed-in user opening the sign-in address is sent home', async ({ page }) => {
    await signIn(page, ACCOUNTS.moderator.email);
    await expect(page).toHaveURL(/\/admin\/courses$/);

    await page.goto('/auth/login');

    await expect(page).toHaveURL(/\/admin\/courses$/);
  });
});
