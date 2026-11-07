import { expect, test, type Page } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, signIn } from './helpers';

/** Signs in through the API (the cookie is shared with the page). */
const signInByApi = async (page: Page, email: string): Promise<void> => {
  const response = await page.request.post('/api/auth/login', {
    data: { email, password: E2E_PASSWORD },
  });
  expect(response.ok()).toBe(true);
};

const createTaxonomy = async (page: Page, path: string, name: string): Promise<void> => {
  const response = await page.request.post(path, { data: { name } });
  expect(response.ok()).toBe(true);
};

const pickOption = async (page: Page, field: RegExp, option: string): Promise<void> => {
  await page.getByRole('combobox', { name: field }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
};

test.describe('Course editor', () => {
  test('an Admin creates a course and builds its curriculum, live class and quiz bank', async ({
    page,
  }, testInfo) => {
    const stamp = `${testInfo.project.name} ${Date.now()}`;
    const category = `E2E Editor Category ${stamp}`;
    const courseType = `E2E Editor Type ${stamp}`;
    const title = `E2E Course ${stamp}`;
    await signInByApi(page, ACCOUNTS.admin.email);
    await createTaxonomy(page, '/api/categories', category);
    await createTaxonomy(page, '/api/course-types', courseType);

    await page.goto('/admin/courses/create');
    await expect(page.getByRole('heading', { name: 'Create Course' })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await page.getByLabel(/Course Title/).fill(title);
    await pickOption(page, /Category/, category);
    await pickOption(page, /Course Type/, courseType);
    await page.getByRole('button', { name: 'Save Draft' }).click();

    await expect(page).toHaveURL(/\/admin\/courses\/[a-f\d]{24}\/edit$/);
    const courseId = /courses\/([a-f\d]{24})\/edit/.exec(page.url())?.[1] ?? '';
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText('Draft', { exact: true })).toBeVisible();

    // Curriculum: the Introduction section is created with the course; add another one
    await page.getByRole('tab', { name: 'Curriculum' }).click();
    const intro = page.getByRole('listitem', { name: 'Introduction' });
    await expect(intro.getByText('Course Introduction')).toBeVisible();
    await page.getByRole('button', { name: 'Add Section', exact: true }).click();
    const sectionDialog = page.getByRole('dialog', { name: 'Add Section' });
    await sectionDialog.getByLabel(/Section title/).fill('Unit 2');
    await sectionDialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByRole('listitem', { name: 'Unit 2' })).toBeVisible();
    await expectNoHorizontalScroll(page);

    // Live class: one week with one class
    await page.getByRole('tab', { name: 'Live Class' }).click();
    await page.getByRole('button', { name: 'Add Week' }).click();
    const weekDialog = page.getByRole('dialog', { name: 'New Live Class' });
    await weekDialog.getByLabel(/^Title/).fill('Week one');
    await weekDialog.getByLabel(/Week Name/).fill('Week 1');
    await weekDialog.getByRole('textbox', { name: 'Week description' }).fill('Live sessions');
    const firstClass = weekDialog.getByRole('group', { name: 'Class 1' });
    await firstClass.getByLabel(/Class Title/).fill('Intro class');
    await firstClass.getByLabel(/Class Date/).fill('2026-11-02');
    await firstClass.getByLabel(/Class Time/).fill('10:00');
    await weekDialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText('Live class added')).toBeVisible();
    await expect(
      page.getByRole('listitem', { name: 'Week one' }).getByText('Intro class'),
    ).toBeVisible();

    // Quiz bank: a section and a bank inside it
    await page.getByRole('tab', { name: 'Quiz Bank' }).click();
    await page.getByRole('button', { name: 'Add section' }).click();
    const quizDialog = page.getByRole('dialog', { name: 'Add section' });
    await quizDialog.getByLabel(/Section title/).fill('Chapter 1');
    await quizDialog.getByRole('button', { name: 'Create' }).click();
    const quizSection = page.getByRole('listitem', { name: 'Chapter 1' });
    await quizSection.getByRole('button', { name: 'Add Quiz Bank' }).click();
    const bankDialog = page.getByRole('dialog', { name: 'Add Quiz Bank' });
    await bankDialog.getByLabel(/Bank title/).fill('Basics quiz');
    await bankDialog.getByRole('button', { name: 'Create' }).click();
    await quizSection.getByRole('button', { name: /^Basics quiz/ }).click();
    await expect(
      page
        .getByRole('region', { name: 'Basics quiz' })
        .getByText('No questions yet.', { exact: false }),
    ).toBeVisible();
    await expectNoHorizontalScroll(page);

    // Clean up (a course without enrolments can be deleted)
    expect((await page.request.delete(`/api/courses/${courseId}`)).ok()).toBe(true);
  });

  test('a new course starts with a batch number; Pricing and Coupons work', async ({
    page,
  }, testInfo) => {
    const stamp = `${testInfo.project.name} ${Date.now()}`;
    const category = `E2E Pricing Category ${stamp}`;
    const courseType = `E2E Pricing Type ${stamp}`;
    const title = `E2E Pricing Course ${stamp}`;
    await signInByApi(page, ACCOUNTS.admin.email);
    await createTaxonomy(page, '/api/categories', category);
    await createTaxonomy(page, '/api/course-types', courseType);

    await page.goto('/admin/courses/create');
    await page.getByLabel(/Course Title/).fill(title);
    await pickOption(page, /Category/, category);
    await pickOption(page, /Course Type/, courseType);
    // The batch number is suggested (4 digits); no price fields on Basic Info
    await expect(page.getByLabel('Batch number', { exact: true })).toHaveValue(/^\d{4}$/);
    await expect(page.getByLabel(/List Price/)).toHaveCount(0);
    await page.getByLabel('Live class schedule').fill('Saturday 9 PM');
    await page.getByLabel('Support class schedule').fill('Monday 8 PM');
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await expect(page).toHaveURL(/\/admin\/courses\/[a-f\d]{24}\/edit$/);
    const courseId = /courses\/([a-f\d]{24})\/edit/.exec(page.url())?.[1] ?? '';

    // Pricing: Paid with a discount creates the course's own coupon
    await page.getByRole('tab', { name: 'Pricing' }).click();
    await pickOption(page, /Pricing/, 'Paid');
    await page.getByLabel(/List Price/).fill('1000');
    await page.getByLabel(/Discount Price/).fill('800');
    await expect(page.getByText('Discount coupon')).toBeVisible();
    await page.getByLabel('Coupon code').fill('abc');
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await expect(page.getByText('Use 6-20 letters, digits or dashes')).toBeVisible();
    const code = `E2E${Date.now().toString().slice(-8)}`;
    await page.getByLabel('Coupon code').fill(code);
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await expect(page.getByText('Course updated')).toBeVisible();
    await expectNoHorizontalScroll(page);

    // Coupons: the course discount is listed; add a coupon of its own
    await page.getByRole('tab', { name: 'Coupons' }).click();
    await expect(page.getByText(code, { exact: true })).toBeVisible();
    await expect(page.getByText('Course discount')).toBeVisible();
    await page.getByRole('button', { name: 'Add coupon' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add coupon' });
    await expect(dialog.getByLabel(/Coupon code/)).not.toHaveValue('');
    const coupon = `CPN${Date.now().toString().slice(-8)}`;
    await dialog.getByLabel(/Coupon code/).fill(coupon);
    await dialog.getByRole('textbox', { name: /^Discount/ }).fill('25');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Coupon created')).toBeVisible();
    await expect(page.getByText(coupon, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: `Actions for ${coupon}` }).click();
    await page.getByRole('menuitem', { name: 'Switch off' }).click();
    await page
      .getByRole('dialog', { name: 'Switch off ' + coupon + '?' })
      .getByRole('button', { name: 'Switch off' })
      .click();
    await expect(page.getByText('Coupon switched off')).toBeVisible();
    await expect(page.getByText('Switched off').first()).toBeVisible();
    await page.getByRole('button', { name: `Actions for ${coupon}` }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Coupon deleted')).toBeVisible();

    // Clean up (a course without enrolments can be deleted)
    expect((await page.request.delete(`/api/courses/${courseId}`)).ok()).toBe(true);
  });

  test('Settings publishes and unpublishes a course; the header and the course list follow', async ({
    page,
  }, testInfo) => {
    const stamp = `${testInfo.project.name} ${Date.now()}`;
    const title = `E2E Settings Course ${stamp}`;
    await signInByApi(page, ACCOUNTS.admin.email);
    const category = await page.request.post('/api/categories', {
      data: { name: `E2E Settings Category ${stamp}` },
    });
    const courseType = await page.request.post('/api/course-types', {
      data: { name: `E2E Settings Type ${stamp}` },
    });
    const created = await page.request.post('/api/courses', {
      data: {
        title,
        category: ((await category.json()) as { data: { _id: string } }).data._id,
        courseType: ((await courseType.json()) as { data: { _id: string } }).data._id,
        visibility: 'Public',
        pricing: 'Free',
      },
    });
    expect(created.ok()).toBe(true);
    const courseId = ((await created.json()) as { data: { _id: string } }).data._id;

    await page.goto(`/admin/courses/${courseId}/edit`);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    // Settings: visibility and publish / unpublish; the header follows the status
    await page.getByRole('tab', { name: 'Settings' }).click();
    await expect(page.getByText('The course is not published')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Draft' })).toBeVisible();
    await page.getByRole('main').getByRole('button', { name: 'Publish' }).last().click();
    await expect(page.getByText('Course published')).toBeVisible();
    await expect(page.getByText('The course is published')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Draft' })).toHaveCount(0);
    await expect(page.getByText(/can never be deleted/)).toBeVisible();

    await page.getByRole('button', { name: 'Unpublish course' }).click();
    const confirm = page.getByRole('dialog', { name: 'Unpublish course?' });
    await confirm.getByRole('button', { name: 'Unpublish course' }).click();
    // Published once, then unpublished: archived (never deleted), with its publish history
    await expect(page.getByText('This course is archived')).toBeVisible();
    await expect(
      page.getByRole('list', { name: 'Publish history' }).getByText('Unpublished (archived)'),
    ).toBeVisible();

    await page.goto(`/admin/courses?search=${encodeURIComponent(title)}`);
    await page.getByRole('button', { name: `Actions for ${title}`, exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Enrollments' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toHaveCount(0);
  });

  test('a Moderator cannot open the course editor', async ({ page }) => {
    await signIn(page, ACCOUNTS.moderator.email);
    await expect(page).toHaveURL(/\/admin\/courses$/);

    await page.goto('/admin/courses/create');
    await expect(page).toHaveURL(/\/admin\/courses$/);
  });
});
