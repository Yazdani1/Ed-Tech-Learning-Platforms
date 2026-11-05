import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, isPhone } from './helpers';

// Site pages (hide / show), company contact, tools and the course page sections.
// Settings are site-wide: each flow puts them back in `finally`, and the desktop and mobile projects use
// different pages / numbers so they do not step on each other.

interface SiteSettings {
  hiddenPages: string[];
  contact: { phone: string; whatsapp: string; email: string; address: string };
}

const dataOf = async <T>(response: Awaited<ReturnType<APIRequestContext['post']>>): Promise<T> => {
  expect(response.ok(), await response.text()).toBe(true);
  return ((await response.json()) as { data: T }).data;
};

const signInByApi = async (page: Page, email: string): Promise<void> => {
  const response = await page.request.post('/api/auth/login', {
    data: { email, password: E2E_PASSWORD },
  });
  expect(response.ok()).toBe(true);
};

const readSettings = async (api: APIRequestContext): Promise<SiteSettings> =>
  dataOf<SiteSettings>(await api.get('/api/site-settings/public'));

/** A published, free, public course with a unique title, made through the API as the E2E Admin. */
const createCourse = async (
  baseURL: string,
  tag: string,
): Promise<{ id: string; title: string }> => {
  const admin = await request.newContext({ baseURL });
  await dataOf(
    await admin.post('/api/auth/login', {
      data: { email: ACCOUNTS.admin.email, password: E2E_PASSWORD },
    }),
  );
  const stamp = `${tag} ${Date.now()}`;
  const category = await dataOf<{ _id: string }>(
    await admin.post('/api/categories', { data: { name: `E2E Extras Cat ${stamp}` } }),
  );
  const courseType = await dataOf<{ _id: string }>(
    await admin.post('/api/course-types', { data: { name: `E2E Extras Type ${stamp}` } }),
  );
  const title = `E2E Extras Course ${stamp}`;
  const course = await dataOf<{ _id: string }>(
    await admin.post('/api/courses', {
      data: {
        title,
        category: category._id,
        courseType: courseType._id,
        visibility: 'Public',
        pricing: 'Free',
      },
    }),
  );
  await dataOf(
    await admin.patch(`/api/courses/${course._id}/status`, { data: { status: 'Published' } }),
  );
  await admin.dispose();
  return { id: course._id, title };
};

test.describe('Site pages (Super Admin)', () => {
  test('hiding a page removes its link and makes its address "not found"; showing it restores both', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    // Different pages per project: the two projects run at the same time on one database
    const key = mobile ? 'practice-quiz' : 'teachers';
    const label = mobile ? 'Practice Quiz' : 'Teachers';
    await signInByApi(page, ACCOUNTS.superAdmin.email);

    try {
      await page.goto('/admin/site-pages');
      await expect(page.getByRole('heading', { name: 'Site Pages' })).toBeVisible();
      await expectNoHorizontalScroll(page);
      const toggle = page.getByRole('switch', { name: `Show ${label}` });
      await expect(toggle).toBeChecked();
      await toggle.click();
      await expect(page.getByText(`${label} is hidden`)).toBeVisible();
      await expect(toggle).not.toBeChecked();

      // The public site: the link is gone and the address says "not found"
      await page.goto('/');
      if (isPhone(page)) await page.getByRole('button', { name: /menu/i }).first().click();
      await expect(page.getByRole('link', { name: label, exact: true })).toHaveCount(0);
      await page.goto(`/${key}`);
      await expect(page.getByText(/not found/i).first()).toBeVisible();

      // Show it again
      await page.goto('/admin/site-pages');
      await page.getByRole('switch', { name: `Show ${label}` }).click();
      await expect(page.getByText(`${label} is visible again`)).toBeVisible();
      await page.goto(`/${key}`);
      await expect(page.getByText(/page not found/i)).toHaveCount(0);
    } finally {
      const current = await readSettings(page.request);
      if (current.hiddenPages.includes(key)) {
        await page.request.put('/api/site-settings/pages', {
          data: { hiddenPages: current.hiddenPages.filter((item) => item !== key) },
        });
      }
    }
  });

  test('an Admin cannot open the Site Pages screen', async ({ page }) => {
    await signInByApi(page, ACCOUNTS.admin.email);
    await page.goto('/admin/site-pages');

    await expect(page.getByRole('switch')).toHaveCount(0);
    await expect(page).not.toHaveURL(/site-pages/);
  });
});

test.describe('Company contact', () => {
  test('an Admin saves the phone and it shows as "Call Now" on the course page buy bar', async ({
    page,
    baseURL,
  }, testInfo) => {
    const phone = testInfo.project.name === 'mobile' ? '01722222222' : '01711111111';
    const course = await createCourse(baseURL ?? '', `contact ${testInfo.project.name}`);
    await signInByApi(page, ACCOUNTS.admin.email);
    const before = await readSettings(page.request);

    try {
      await page.goto('/admin/company-contact');
      await expect(page.getByRole('heading', { name: 'Company Contact' })).toBeVisible();
      await expectNoHorizontalScroll(page);

      // Invalid input is refused in the browser
      await page.getByLabel('Phone number').fill('abc');
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText(/Enter a valid phone number/)).toBeVisible();

      await page.getByLabel('Phone number').fill(phone);
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText('Company contact saved')).toBeVisible();

      // A visitor sees it in the buy bar (the other project may save at the same time: save again until it shows)
      await page.context().clearCookies();
      await expect(async () => {
        await signInByApi(page, ACCOUNTS.admin.email);
        await page.request.put('/api/site-settings/contact', {
          data: { ...(await readSettings(page.request)).contact, phone },
        });
        await page.context().clearCookies();
        await page.goto(`/courses/${course.id}`);
        const bar = page.getByRole('complementary', { name: 'Enrol in this course' });
        await expect(bar.getByText('Call Now:')).toBeVisible({ timeout: 8000 });
        await expect(bar.getByRole('link', { name: phone })).toHaveAttribute(
          'href',
          `tel:${phone}`,
          {
            timeout: 8000,
          },
        );
      }).toPass({ timeout: 60_000 });
      const bar = page.getByRole('complementary', { name: 'Enrol in this course' });
      await expect(bar.getByText('Free')).toBeVisible();
      await expect(bar.getByRole('button', { name: 'Enroll Now' })).toBeVisible();
      await expectNoHorizontalScroll(page);
    } finally {
      await signInByApi(page, ACCOUNTS.admin.email);
      const stillMine = await readSettings(page.request);
      const isE2eNumber = ['01711111111', '01722222222'].includes(before.contact.phone);
      if (stillMine.contact.phone === phone) {
        await page.request.put('/api/site-settings/contact', {
          data: { ...before.contact, phone: isE2eNumber ? '' : before.contact.phone },
        });
      }
    }
  });

  test('a Moderator cannot open Company Contact', async ({ page }) => {
    await signInByApi(page, ACCOUNTS.moderator.email);
    await page.goto('/admin/company-contact');

    await expect(page.getByLabel('Phone number')).toHaveCount(0);
    await expect(page).not.toHaveURL(/company-contact/);
  });
});

test.describe('Tools and course page sections', () => {
  test('Course Setup shows the Tools tab; a new tool needs a logo', async ({ page }) => {
    await signInByApi(page, ACCOUNTS.admin.email);
    await page.goto('/admin/categories');
    await page.getByRole('tab', { name: 'Tools' }).click();
    await expect(page).toHaveURL(/\/admin\/tools$/);

    await expect(
      page.getByRole('list', { name: 'Tools' }).getByText('E2E Seed Tool'),
    ).toBeVisible();
    await expectNoHorizontalScroll(page);
    await page.getByRole('button', { name: 'Add Tool' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add Tool' });
    await dialog.getByLabel(/Tool name/).fill('Needs a logo');
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
  });

  test('a tool is attached to a course in the editor and shows on the course page', async ({
    page,
    baseURL,
  }, testInfo) => {
    const course = await createCourse(baseURL ?? '', `tools ${testInfo.project.name}`);
    await signInByApi(page, ACCOUNTS.admin.email);

    await page.goto(`/admin/courses/${course.id}/edit`);
    await page.getByRole('tab', { name: 'Tools' }).click();
    await expect(page.getByText('No tools chosen yet.')).toBeVisible();
    await page.getByLabel('Section title').fill('Our toolbox');
    await page.getByRole('button', { name: 'Choose tools' }).click();
    const drawer = page.getByRole('dialog', { name: 'Choose tools' });
    await drawer.getByRole('checkbox', { name: /E2E Seed Tool/ }).click();
    await drawer.getByRole('button', { name: 'Use 1 tool' }).click();
    await expect(page.getByText('1 tool selected')).toBeVisible();
    await expectNoHorizontalScroll(page);
    await page.getByRole('button', { name: 'Save section' }).click();
    await expect(page.getByText('Section saved')).toBeVisible();

    await page.context().clearCookies();
    await page.goto(`/courses/${course.id}`);
    const section = page.getByRole('region', { name: 'Our toolbox' });
    await expect(section.getByText('E2E Seed Tool')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('FAQ and "who this course is for" added in the editor are shown on the course page', async ({
    page,
    baseURL,
  }, testInfo) => {
    const course = await createCourse(baseURL ?? '', `faq ${testInfo.project.name}`);
    await signInByApi(page, ACCOUNTS.admin.email);
    await page.goto(`/admin/courses/${course.id}/edit`);

    await page.getByRole('tab', { name: 'FAQ' }).click();
    await page.getByRole('button', { name: 'Add question' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add question' });
    await dialog.getByLabel(/Question/).fill('Is there a certificate?');
    await dialog.getByLabel(/Answer/).fill('Yes, after the final quiz.');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Section saved')).toBeVisible();
    await expect(page.getByText('Is there a certificate?')).toBeVisible();

    await page.getByRole('tab', { name: 'Who This Course Is For' }).click();
    await page.getByLabel('New item for Who this course is for').fill('Complete beginners');
    await page.getByLabel('New item for Who this course is for').press('Enter');
    await page.getByRole('button', { name: 'Save section' }).click();
    await expect(page.getByText('Section saved').last()).toBeVisible();

    await page.context().clearCookies();
    await page.goto(`/courses/${course.id}`);
    await expect(page.getByRole('heading', { level: 1, name: course.title })).toBeVisible();
    const audience = page.getByRole('region', { name: 'Who this course is for' });
    await expect(audience.getByText('Complete beginners')).toBeVisible();
    const faq = page.getByRole('region', { name: 'Frequently Asked Questions' });
    await expect(faq.getByRole('button', { name: 'Is there a certificate?' })).toBeVisible();
    await expect(faq.getByText('Yes, after the final quiz.')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('the course page buy bar is hidden from staff', async ({ page, baseURL }, testInfo) => {
    const course = await createCourse(baseURL ?? '', `bar ${testInfo.project.name}`);
    await page.goto(`/courses/${course.id}`);
    const bar = page.getByRole('complementary', { name: 'Enrol in this course' });
    await expect(bar.getByRole('button', { name: 'Enroll Now' })).toBeVisible();

    await signInByApi(page, ACCOUNTS.admin.email);
    await page.goto(`/courses/${course.id}`);
    await expect(page.getByRole('heading', { level: 1, name: course.title })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enroll Now' })).toHaveCount(0);
  });
});
