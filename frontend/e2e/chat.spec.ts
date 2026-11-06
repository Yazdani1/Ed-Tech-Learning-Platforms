import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, uniqueEmail } from './helpers';

/** Signs in through the API (the cookie is shared with the context's pages). */
const signInByApi = async (request: APIRequestContext, email: string): Promise<void> => {
  const response = await request.post('/api/auth/login', {
    data: { email, password: E2E_PASSWORD },
  });
  expect(response.ok()).toBe(true);
};

/** A fresh student (their own support conversation), signed in on this page. */
const registerStudent = async (page: Page, name: string, email: string): Promise<void> => {
  const response = await page.request.post('/api/auth/register', {
    data: { name, email, password: E2E_PASSWORD },
  });
  expect(response.ok()).toBe(true);
};

const sendMessage = async (page: Page, text: string): Promise<void> => {
  const box = page.getByRole('textbox', { name: 'Message', exact: true });
  await box.fill(text);
  await box.press('Enter');
  await expect(box).toHaveValue('');
};

test.describe('Support chat', () => {
  test('a student writes to support and an admin answers live', async ({
    page,
    browser,
    baseURL,
  }, testInfo) => {
    const name = `E2E Chat ${testInfo.project.name} ${Date.now()}`;
    await registerStudent(page, name, uniqueEmail(testInfo));
    const question = `Question from ${name}`;
    const answer = `Answer for ${name}`;

    await page.goto('/student/chat');
    await expect(page.getByRole('heading', { name: 'Support Chat', exact: true })).toBeVisible();
    await expect(page.getByText('Welcome to Support Chat! 👋')).toBeVisible();
    await sendMessage(page, question);
    const studentLog = page.getByRole('log', { name: 'Messages' });
    await expect(studentLog.getByText(question, { exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);

    const adminContext = await browser.newContext({ baseURL });
    const admin = await adminContext.newPage();
    await signInByApi(admin.request, ACCOUNTS.admin.email);
    await admin.goto('/admin/chat');
    await expect(admin.getByRole('heading', { name: 'Support Inbox' })).toBeVisible();
    await admin.getByRole('searchbox', { name: 'Search students...' }).fill(name);
    await admin
      .getByRole('list', { name: 'Conversations' })
      .getByRole('button', { name: new RegExp(name) })
      .click();
    await expect(admin.getByRole('heading', { name, exact: true })).toBeVisible();
    const adminLog = admin.getByRole('log', { name: 'Messages' });
    await expect(adminLog.getByText(question, { exact: true })).toBeVisible();

    await sendMessage(admin, answer);
    await expect(adminLog.getByText(answer, { exact: true })).toBeVisible();
    // The student sees the answer without reloading
    await expect(studentLog.getByText(answer, { exact: true })).toBeVisible();
    await adminContext.close();
  });

  test('a student opens the floating chat from their dashboard', async ({ page }, testInfo) => {
    const name = `E2E Widget ${testInfo.project.name} ${Date.now()}`;
    await registerStudent(page, name, uniqueEmail(testInfo));

    await page.goto('/student/courses');
    await page.getByRole('button', { name: 'Open support chat' }).click();
    const chat = page.getByRole('dialog', { name: 'Support Chat' });
    await expect(chat.getByText('Welcome to Support Chat! 👋')).toBeVisible();
    await sendMessage(page, `Hello from ${name}`);
    await expect(chat.getByText(`Hello from ${name}`, { exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await chat.getByRole('button', { name: 'Close support chat' }).click();
    await expect(chat).toHaveCount(0);
    await page.goto('/student/chat');
    await expect(page.getByRole('button', { name: 'Open support chat' })).toHaveCount(0);
    // Nor on group chat, where it would cover the message box
    await page.goto('/student/group-chat');
    await expect(page.getByRole('textbox', { name: 'Search channels' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open support chat' })).toHaveCount(0);
  });
});
