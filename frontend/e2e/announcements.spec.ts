import { expect, request, test } from '@playwright/test';

import {
  ACCOUNTS,
  E2E_PASSWORD,
  apiAs,
  createPaidCourse,
  dataOf,
  expectNoHorizontalScroll,
  signInAndWait,
  uniqueEmail,
} from './helpers';

// An announcement sent from /admin/announcements shows in the player of every chosen course.

test.describe('Announcements page', () => {
  test('an Admin sends one announcement to a course and its student reads it in the course player', async ({
    page,
    baseURL,
  }, testInfo) => {
    const course = await createPaidCourse(baseURL ?? '', `announce ${testInfo.project.name}`);
    const subject = `E2E Notice ${testInfo.project.name} ${Date.now()}`;

    // A student enrolled in the course (through the API)
    const studentEmail = uniqueEmail(testInfo);
    const studentApi = await request.newContext({ baseURL });
    await dataOf(
      await studentApi.post('/api/auth/register', {
        data: {
          name: 'E2E Announced Student',
          email: studentEmail,
          password: E2E_PASSWORD,
        },
      }),
    );
    await dataOf(
      await studentApi.post(`/api/enrollments/${course.id}`, {
        data: { enrollmentType: 'paid', paymentMethod: 'bkash' },
      }),
    );

    await signInAndWait(page, ACCOUNTS.admin.email);
    await page.goto('/admin/announcements');
    await expect(page.getByRole('heading', { name: 'Announcements', level: 1 })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByRole('button', { name: 'New announcement' }).click();
    const dialog = page.getByRole('dialog', { name: 'New announcement' });
    await dialog.getByRole('searchbox', { name: 'Search courses' }).fill(course.title);
    await dialog.getByRole('checkbox', { name: course.title, exact: true }).check();
    await dialog.getByLabel(/^Title/).fill(subject);
    await dialog.getByRole('textbox', { name: 'Announcement' }).fill('Bring a calculator');
    await dialog.getByRole('button', { name: 'Send announcement' }).click();
    await expect(page.getByText('Announcement sent to 1 course')).toBeVisible();

    const card = page.getByRole('button', { name: `Open details of ${subject}` });
    await expect(card).toBeVisible();
    await expect(card.getByText('1 course')).toBeVisible();
    await card.click();
    const drawer = page.getByRole('dialog', { name: 'Announcement details' });
    await expect(drawer.getByText(course.title)).toBeVisible();
    await expect(drawer.getByText('Seen by 0 of 1 enrolled students')).toBeVisible();
    await drawer.getByRole('button', { name: 'Close' }).click();

    // The student sees it in the course player, which marks it as seen
    await page.context().clearCookies();
    await signInAndWait(page, studentEmail);
    await page.goto(`/student/courses/${course.id}/learn?tab=announcements`);
    const announcement = page.getByRole('article', { name: subject });
    await expect(announcement.getByText('Bring a calculator')).toBeVisible();
    await expectNoHorizontalScroll(page);
    await studentApi.dispose();
  });
});

test.describe('Announcements access', () => {
  test('a Moderator can send announcements; the API refuses a Teacher', async ({
    page,
    baseURL,
  }) => {
    await signInAndWait(page, ACCOUNTS.moderator.email);
    await page.goto('/admin/announcements');
    await expect(page.getByRole('heading', { name: 'Announcements', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New announcement' })).toBeVisible();

    const teacher = await apiAs(baseURL ?? '', ACCOUNTS.teacher.email);
    const denied = await teacher.get('/api/announcements/broadcasts');
    expect(denied.status()).toBe(403);
    await teacher.dispose();
  });
});
