import { expect, test, type APIRequestContext, type TestInfo } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, uniqueEmail } from './helpers';

// Everything a test needs is created through the API with unique names. Uploads are not used: the e2e
// backend has no real Cloudinary account (component tests cover the image pickers).

const unique = (testInfo: TestInfo, label: string): string =>
  `E2E ${label} ${testInfo.project.name} ${Date.now()}-${testInfo.workerIndex}`;

const signInApi = async (request: APIRequestContext, email: string): Promise<void> => {
  const response = await request.post('/api/auth/login', {
    data: { email, password: E2E_PASSWORD },
  });
  expect(response.ok()).toBe(true);
};

/** An Admin creates a channel; returns its id. */
const createChannel = async (request: APIRequestContext, name: string): Promise<string> => {
  await signInApi(request, ACCOUNTS.admin.email);
  const response = await request.post('/api/community/channels', {
    multipart: { name, description: '<p>Made by the e2e test</p>' },
  });
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { data: { _id: string } };
  return body.data._id;
};

const createPost = async (
  request: APIRequestContext,
  channel: string,
  title: string,
): Promise<string> => {
  const response = await request.post('/api/community/posts', {
    multipart: { channel, title, description: '<p>Posted by the e2e test</p>' },
  });
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { data: { _id: string } };
  return body.data._id;
};

test.describe('Community Hub', () => {
  test('a new student starts a discussion, answers it and reacts', async ({ page }, testInfo) => {
    const channelName = unique(testInfo, 'Channel');
    await createChannel(page.request, channelName);
    await page.context().clearCookies();
    const register = await page.request.post('/api/auth/register', {
      data: { name: 'E2E Community Student', email: uniqueEmail(testInfo), password: E2E_PASSWORD },
    });
    expect(register.ok()).toBe(true);

    await page.goto('/community-hub');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await page.getByRole('button', { name: 'New Discussion' }).click();

    const title = unique(testInfo, 'Question');
    const form = page.getByRole('form', { name: 'Start a discussion' });
    await form.getByRole('combobox', { name: 'Channel' }).click();
    await page.getByRole('option', { name: channelName, exact: true }).click();
    await form.getByRole('textbox', { name: 'Title' }).fill(title);
    await form.getByRole('textbox', { name: 'Description' }).fill('How do I start learning loops?');
    await form.getByRole('button', { name: 'Publish Discussion' }).click();
    await expect(page.getByText('Discussion created')).toBeVisible();

    const card = page.getByRole('article', { name: title });
    await card.getByRole('link', { name: title }).click();
    await expect(page).toHaveURL(/\/community-hub\/[a-f0-9]{24}$/);
    const discussion = page.getByRole('article', { name: title });
    await expect(discussion.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await discussion.getByRole('button', { name: 'Reply', exact: true }).first().click();
    await discussion.getByRole('textbox', { name: 'Your reply' }).fill('Start with a for loop.');
    await discussion.getByRole('button', { name: 'Publish Reply' }).click();
    await expect(page.getByText('Reply added')).toBeVisible();
    await expect(
      discussion.getByRole('listitem', { name: 'Reply by E2E Community Student' }),
    ).toBeVisible();

    await discussion.getByRole('button', { name: 'Like (0)' }).first().click();
    await expect(
      discussion.getByRole('button', { name: 'Remove your Like (1)' }).first(),
    ).toBeVisible();
  });

  test('a visitor reads a discussion but is asked to sign in to take part', async ({
    page,
  }, testInfo) => {
    const channel = await createChannel(page.request, unique(testInfo, 'Guest Channel'));
    const title = unique(testInfo, 'Guest Topic');
    const postId = await createPost(page.request, channel, title);
    await page.context().clearCookies();

    await page.goto('/community-hub');
    await expect(page.getByText(/limited guest preview/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in to participate' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Discussion' })).toHaveCount(0);

    await page.goto(`/community-hub/${postId}`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in to reply' })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('an Admin opens the community settings', async ({ page }) => {
    await signInApi(page.request, ACCOUNTS.admin.email);
    await page.goto('/community-hub');
    await page.getByRole('button', { name: 'Community Settings' }).click();

    const dialog = page.getByRole('dialog', { name: 'Community Settings' });
    await expect(dialog.getByRole('textbox', { name: 'Header title' })).toBeVisible();
    await dialog
      .getByRole('navigation', { name: 'Settings sections' })
      .getByRole('button', { name: 'Points Settings' })
      .click();
    await expect(
      dialog.getByRole('spinbutton', { name: 'Points for accepted answer' }),
    ).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('a private profile shows only a notice to other members', async ({
    page,
    browser,
  }, testInfo) => {
    const register = await page.request.post('/api/auth/register', {
      data: { name: 'E2E Private Student', email: uniqueEmail(testInfo), password: E2E_PASSWORD },
    });
    expect(register.ok()).toBe(true);
    const body = (await register.json()) as { data: { _id: string } };
    const userId = body.data._id;

    await page.goto(`/community-hub/users/${userId}`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'E2E Private Student' }),
    ).toBeVisible();
    await page.getByRole('switch', { name: 'Make community profile private' }).click();
    await expect(page.getByText('Community profile is private')).toBeVisible();

    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await signInApi(otherPage.request, ACCOUNTS.student.email);
    await otherPage.goto(`/community-hub/users/${userId}`);
    await expect(otherPage.getByText('This profile is private.')).toBeVisible();
    await expect(otherPage.getByText('Reactions given')).toHaveCount(0);
    await other.close();
  });
});
