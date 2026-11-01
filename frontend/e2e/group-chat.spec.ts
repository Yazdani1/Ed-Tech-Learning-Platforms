import { expect, test, type Page } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, isPhone } from './helpers';

/** Signs in through the API (the cookie is shared with the page). */
const signInByApi = async (page: Page, email: string): Promise<void> => {
  const response = await page.request.post('/api/auth/login', {
    data: { email, password: E2E_PASSWORD },
  });
  expect(response.ok()).toBe(true);
};

const uniqueName = (prefix: string, project: string): string =>
  `${prefix} ${project} ${Date.now()}`;

test.describe('Group chat', () => {
  test('a student creates a channel and sends a message', async ({ page }, testInfo) => {
    await signInByApi(page, ACCOUNTS.student.email);
    const name = uniqueName('E2E Channel', testInfo.project.name);
    const text = `Hello from ${testInfo.project.name}`;

    await page.goto('/student/group-chat');
    await expect(page.getByRole('heading', { name: 'Group Chat' })).toBeVisible();
    await page.getByRole('button', { name: 'Create Channel' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create Channel' });
    await dialog.getByLabel(/Channel name/).fill(name);
    await dialog.getByLabel('Description').fill('Made by the e2e test');
    await dialog.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Channel created')).toBeVisible();

    // The new channel opens (on phones the list is replaced by the channel)
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    await page.getByRole('textbox', { name: 'Message', exact: true }).fill(text);
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByRole('log', { name: 'Messages' }).getByText(text)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('');
    await expectNoHorizontalScroll(page);

    if (isPhone(page)) {
      await page.getByRole('button', { name: 'Back to channels' }).click();
      await expect(page.getByRole('list', { name: 'My Channels' }).getByText(name)).toBeVisible();
    }
  });

  test('an Admin finds a private channel, reads it and blocks it', async ({ page }, testInfo) => {
    const name = uniqueName('E2E Private', testInfo.project.name);
    await signInByApi(page, ACCOUNTS.student.email);
    const created = await page.request.post('/api/group-chat/channels', {
      data: { name, description: 'Private e2e channel', type: 'Private' },
    });
    expect(created.ok()).toBe(true);

    await signInByApi(page, ACCOUNTS.admin.email);
    await page.goto('/admin/group-chat');
    await page.getByRole('textbox', { name: 'Search channels' }).fill(name);
    const mine = page.getByRole('list', { name: 'My Channels' });
    await mine.getByText(name, { exact: true }).click();

    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    await expect(
      page.getByRole('log', { name: 'Messages' }).getByText('No messages yet.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Channel actions' }).click();
    await page.getByRole('menuitem', { name: 'Block channel' }).click();
    await expect(page.getByText('Channel blocked')).toBeVisible();
    await expect(page.getByText('Blocked', { exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
