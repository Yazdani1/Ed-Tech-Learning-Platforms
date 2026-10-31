import { expect, test, type Page } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, signIn, uniqueEmail } from './helpers';

/** Signs in through the API (the cookie is shared with the page). */
const signInByApi = async (page: Page, email: string): Promise<void> => {
  const response = await page.request.post('/api/auth/login', {
    data: { email, password: E2E_PASSWORD },
  });
  expect(response.ok()).toBe(true);
};

const uniqueName = (prefix: string, project: string): string =>
  `${prefix} ${project} ${Date.now()}`;

const DAY_MS = 86_400_000;
const ASSIGN_DAYS = 30;

test.describe('People administration', () => {
  test('a Super Admin creates, edits and deletes a user', async ({ page }, testInfo) => {
    await signInByApi(page, ACCOUNTS.superAdmin.email);
    const name = uniqueName('E2E Person', testInfo.project.name);
    const email = uniqueEmail(testInfo);

    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: 'User List' })).toBeVisible();
    await page.getByRole('button', { name: 'Create User' }).click();
    const create = page.getByRole('dialog', { name: 'Create User' });
    await create.getByLabel(/Name/).fill(name);
    await create.getByLabel(/Email/).fill(email);
    await create.getByLabel(/Password/).fill('secret123');
    await create.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('User created')).toBeVisible();

    await page.goto(`/admin/users?search=${encodeURIComponent(email)}`);
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByRole('button', { name: `Actions for ${name}` }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    const edit = page.getByRole('dialog', { name: 'Edit User' });
    const renamed = `${name} renamed`;
    await edit.getByLabel(/Name/).fill(renamed);
    await edit.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('User updated')).toBeVisible();
    await expect(page.getByText(renamed, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: `Actions for ${renamed}` }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('User deleted')).toBeVisible();
    await expect(page.getByText(renamed, { exact: true })).toHaveCount(0);
  });

  test('an Admin sees a teacher profile and deletes it', async ({ page }, testInfo) => {
    await signInByApi(page, ACCOUNTS.admin.email);
    const name = uniqueName('E2E Teacher', testInfo.project.name);
    const created = await page.request.post('/api/teachers', {
      multipart: { name, bio: 'Made by the e2e test', expertise: 'Maths, Physics' },
    });
    expect(created.ok()).toBe(true);

    await page.goto('/admin/teachers');
    const card = page.getByRole('article', { name, exact: true });
    await expect(card).toBeVisible();
    await expect(card.getByText('0 courses teaching')).toBeVisible();
    await expectNoHorizontalScroll(page);

    await card.getByRole('button', { name: `Actions for ${name}` }).click();
    await page.getByRole('menuitem', { name: 'View details' }).click();
    const details = page.getByRole('dialog', { name: 'Teacher details' });
    await expect(details.getByText('No courses are assigned to this teacher yet.')).toBeVisible();
    await details
      .getByRole('heading', { name: 'Teacher details' })
      .getByRole('button', { name: 'Close' })
      .click();

    await card.getByRole('button', { name: `Actions for ${name}` }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Teacher deleted')).toBeVisible();
    await expect(page.getByRole('article', { name, exact: true })).toHaveCount(0);
  });

  test('an Admin adds a plan, assigns it to a student and cancels it', async ({
    page,
  }, testInfo) => {
    await signInByApi(page, ACCOUNTS.admin.email);
    const plan = uniqueName('E2E Plan', testInfo.project.name);
    const studentName = uniqueName('E2E Member', testInfo.project.name);
    const student = await page.request.post('/api/users', {
      data: {
        name: studentName,
        email: uniqueEmail(testInfo),
        password: 'secret123',
        role: 'Student',
      },
    });
    expect(student.ok()).toBe(true);

    await page.goto('/admin/subscriptions');
    await page.getByRole('button', { name: 'Add Plan' }).click();
    const form = page.getByRole('dialog', { name: 'Add Subscription Plan' });
    await form.getByLabel(/Plan name/).fill(plan);
    await form.getByLabel('Price (BDT)').fill('700');
    await form.getByRole('textbox', { name: 'Feature 1', exact: true }).fill('Everything');
    await form.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Plan saved')).toBeVisible();
    await expect(page.getByRole('article', { name: plan, exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByRole('tab', { name: 'Subscription Members' }).click();
    await page.getByRole('button', { name: 'Assign Subscription' }).click();
    const assign = page.getByRole('dialog', { name: 'Assign Subscription' });
    await assign.getByRole('combobox', { name: /User/ }).fill(studentName);
    await page.getByRole('option', { name: new RegExp(studentName) }).click();
    await assign.getByRole('combobox', { name: /Plan/ }).click();
    await page.getByRole('option', { name: plan, exact: true }).click();
    const end = new Date(Date.now() + ASSIGN_DAYS * DAY_MS).toISOString().slice(0, 10);
    await assign.getByLabel(/End Date/).fill(end);
    await assign.getByRole('button', { name: 'Assign' }).click();
    await expect(page.getByText('Subscription assigned')).toBeVisible();

    await page.goto(`/admin/subscriptions?tab=members&search=${encodeURIComponent(studentName)}`);
    const cancel = page.getByRole('button', { name: `Cancel the subscription of ${studentName}` });
    await cancel.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel Subscription' }).click();
    await expect(page.getByText('Subscription cancelled')).toBeVisible();

    // Clean up the plan
    await page.goto('/admin/subscriptions');
    await page.getByRole('button', { name: `Delete plan ${plan}` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Plan deleted')).toBeVisible();
  });

  test('a Moderator opens the course Q&A but not the user list', async ({ page }) => {
    await signIn(page, ACCOUNTS.moderator.email);
    await expect(page).toHaveURL(/\/admin\/courses$/);

    await page.goto('/admin/course-qa');
    await expect(page.getByRole('heading', { name: 'All Course Q & A' })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/admin\/courses$/);
  });
});
