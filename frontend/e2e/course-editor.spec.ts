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

  test('a Moderator cannot open the course editor', async ({ page }) => {
    await signIn(page, ACCOUNTS.moderator.email);
    await expect(page).toHaveURL(/\/admin\/courses$/);

    await page.goto('/admin/courses/create');
    await expect(page).toHaveURL(/\/admin\/courses$/);
  });
});
