import { expect, test } from '@playwright/test';

import {
  ACCOUNTS,
  E2E_PASSWORD,
  expectNoHorizontalScroll,
  fillSignIn,
  signIn,
  signOut,
  uniqueEmail,
} from './helpers';

test.describe('Sign in', () => {
  test('validates the form before calling the server', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('This field is required')).toHaveCount(2);
    await expectNoHorizontalScroll(page);
  });

  test('shows the server message for a wrong password', async ({ page }) => {
    await signIn(page, ACCOUNTS.student.email, 'wrong-password');

    await expect(page.getByRole('form', { name: 'Sign in form' }).getByRole('alert')).toHaveText(
      'Invalid credentials',
    );
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test.describe('lands each role on its home page', () => {
    const homes = [
      [ACCOUNTS.superAdmin, '/admin/dashboard', 'Dashboard'],
      [ACCOUNTS.admin, '/admin/courses', 'Courses'],
      [ACCOUNTS.moderator, '/admin/courses', 'Courses'],
      [ACCOUNTS.teacher, '/teacher/courses', 'Assigned courses'],
      [ACCOUNTS.student, '/student/dashboard', 'Dashboard'],
    ] as const;
    for (const [account, home, heading] of homes) {
      test(`${account.name} -> ${home}`, async ({ page }) => {
        await signIn(page, account.email);

        await expect(page).toHaveURL(new RegExp(`${home}$`));
        await expect(page.getByRole('heading', { name: heading })).toBeVisible();
        await expectNoHorizontalScroll(page);
      });
    }
  });

  test('returns to the page that asked for sign-in (?next=)', async ({ page }) => {
    await page.goto('/admin/courses?tab=2');
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fadmin%2Fcourses%3Ftab%3D2$/);

    await fillSignIn(page, ACCOUNTS.admin.email);

    await expect(page).toHaveURL(/\/admin\/courses\?tab=2$/);
  });

  test('never follows an external ?next= (open redirect)', async ({ page }) => {
    await page.goto('/auth/login?next=/%09/evil.example');
    await fillSignIn(page, ACCOUNTS.student.email);

    await expect(page).toHaveURL(/\/student\/dashboard$/);
  });
});

test.describe('Register', () => {
  test('creates a student account and opens the student dashboard', async ({ page }, testInfo) => {
    await page.goto('/auth/register');
    await page.getByLabel('Full Name').fill('E2E New Student');
    await page.getByLabel('Email Address').fill(uniqueEmail(testInfo));
    await page.getByLabel('Password', { exact: true }).fill('short');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();

    await page.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/student\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('says when the email is already registered', async ({ page }) => {
    await page.goto('/auth/register');
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

    await expect(page).toHaveURL(/\/auth\/login\?next=/);
  });

  test("a student cannot open the admin area (sent to the student's own home)", async ({
    page,
  }) => {
    await signIn(page, ACCOUNTS.student.email);
    await expect(page).toHaveURL(/\/student\/dashboard$/);

    await page.goto('/admin/courses');

    await expect(page).toHaveURL(/\/student\/dashboard$/);
  });

  test('an Admin opening the Super Admin dashboard is sent to the course list', async ({
    page,
  }) => {
    await signIn(page, ACCOUNTS.admin.email);
    await expect(page).toHaveURL(/\/admin\/courses$/);

    await page.goto('/admin/dashboard');

    await expect(page).toHaveURL(/\/admin\/courses$/);
  });

  test('a signed-in user opening the sign-in page is sent home', async ({ page }) => {
    await signIn(page, ACCOUNTS.moderator.email);
    await expect(page).toHaveURL(/\/admin\/courses$/);

    await page.goto('/auth/login');

    await expect(page).toHaveURL(/\/admin\/courses$/);
  });
});
