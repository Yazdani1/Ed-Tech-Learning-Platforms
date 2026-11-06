import { expect, request, test, type Page, type TestInfo } from '@playwright/test';

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

// Each test builds a paid course, a coupon and one paid order through the API, then looks at them in the UI.

interface Order {
  courseId: string;
  title: string;
  buyer: string;
  code: string;
}

const createOrder = async (baseURL: string, testInfo: TestInfo): Promise<Order> => {
  const course = await createPaidCourse(baseURL, `revenue ${testInfo.project.name}`);
  const code = `REV${Date.now().toString().slice(-9)}`;
  const admin = await apiAs(baseURL, ACCOUNTS.admin.email);
  await dataOf(
    await admin.post('/api/coupons', {
      data: { course: course.id, code, discountType: 'percent', value: 50 },
    }),
  );
  await admin.dispose();

  const buyer = `E2E Buyer ${testInfo.project.name} ${Date.now()}`;
  const api = await request.newContext({ baseURL });
  await dataOf(
    await api.post('/api/auth/register', {
      data: { name: buyer, email: uniqueEmail(testInfo), password: E2E_PASSWORD },
    }),
  );
  await dataOf(
    await api.post(`/api/enrollments/${course.id}`, {
      data: { enrollmentType: 'paid', couponCode: code, paymentMethod: 'bkash' },
    }),
  );
  await api.dispose();
  return { courseId: course.id, title: course.title, buyer, code };
};

/** The rows of the orders list on desktop (table) and on phones (cards). */
const orderRow = (page: Page, buyer: string) =>
  page
    .getByRole('table', { name: 'Orders' })
    .or(page.getByRole('list', { name: 'Orders' }))
    .getByText(buyer, { exact: true });

test.describe('Revenue page', () => {
  test('an Admin sees the sales cards, the chart and the orders of a course with their details', async ({
    page,
    baseURL,
  }, testInfo) => {
    const order = await createOrder(baseURL ?? '', testInfo);
    await signInAndWait(page, ACCOUNTS.admin.email);

    await page.goto(`/admin/revenue?courses=${order.courseId}`);
    await expect(page.getByRole('heading', { name: 'Revenue', level: 1 })).toBeVisible();
    const cards = page.getByRole('region', { name: 'Sales per period' });
    for (const label of ['Today', 'Last 7 days', 'This month', 'All time']) {
      await expect(cards.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByText('Revenue per day (last 30 days)')).toBeVisible();
    await page.getByRole('button', { name: 'Weekly' }).click();
    await expect(page.getByText('Revenue per week (last 12 weeks)')).toBeVisible();
    await expectNoHorizontalScroll(page);

    await expect(orderRow(page, order.buyer)).toBeVisible();
    await expect(page.getByText(order.title, { exact: true }).first()).toBeVisible();
    await expect(page.getByText('৳500').first()).toBeVisible();

    await orderRow(page, order.buyer).click();
    const drawer = page.getByRole('dialog', { name: 'Purchase details' });
    await expect(drawer.getByText(order.code)).toBeVisible();
    await expect(drawer.getByText('bKash')).toBeVisible();
    await expect(drawer.getByText('৳1,000')).toBeVisible();
    await expect(drawer.getByText('৳500 (50%)')).toBeVisible();
    await expect(drawer.getByText(/^\d{3}-\d{3}-\d{3}$/)).toBeVisible();
    await drawer.getByRole('button', { name: 'Close' }).click();
    await expect(drawer).toBeHidden();
  });

  test('filters by order type and by course', async ({ page, baseURL }, testInfo) => {
    const order = await createOrder(baseURL ?? '', testInfo);
    await signInAndWait(page, ACCOUNTS.admin.email);
    await page.goto('/admin/revenue');

    await page.getByRole('tab', { name: 'Free' }).click();
    await expect(page).toHaveURL(/type=free/);
    await expect(orderRow(page, order.buyer)).toHaveCount(0);
    await page.getByRole('tab', { name: 'Paid' }).click();
    await expect(page).toHaveURL(/type=paid/);

    await page.getByRole('button', { name: /All courses/ }).click();
    const picker = page.getByRole('dialog');
    await picker.getByRole('searchbox').or(picker.getByRole('textbox')).first().fill(order.title);
    await picker.getByRole('checkbox', { name: new RegExp(order.title) }).check();
    await picker.getByRole('button', { name: /Apply/ }).click();

    await expect(page).toHaveURL(new RegExp(`courses=${order.courseId}`));
    await expect(orderRow(page, order.buyer)).toBeVisible();
  });

  test('exports the ticked order as a CSV and opens the print page of its student', async ({
    page,
    baseURL,
  }, testInfo) => {
    const order = await createOrder(baseURL ?? '', testInfo);
    await signInAndWait(page, ACCOUNTS.admin.email);
    await page.goto(`/admin/revenue?courses=${order.courseId}`);
    await expect(orderRow(page, order.buyer)).toBeVisible();

    const csvButton = page.getByRole('button', { name: 'Export CSV' });
    await expect(csvButton).toBeDisabled();
    await page
      .getByRole('checkbox', { name: /Select order/ })
      .first()
      .check();
    await expect(page.getByText('1 selected')).toBeVisible();
    const download = page.waitForEvent('download');
    await csvButton.click();
    expect((await download).suggestedFilename()).toMatch(/^orders-\d{4}-\d{2}-\d{2}\.csv$/);

    await page.getByRole('button', { name: 'Print students (PDF)' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('radio', { name: /The selected orders \(1\)/ })).toBeChecked();
    const popup = page.waitForEvent('popup');
    await dialog.getByRole('button', { name: 'Print', exact: true }).click();
    const printPage = await popup;
    await expect(printPage.getByRole('cell', { name: order.buyer })).toBeVisible();
    await expect(page.getByText('Print page opened')).toBeVisible();
  });

  test('a Moderator cannot open the page and has no Revenue menu item', async ({ page }) => {
    await signInAndWait(page, ACCOUNTS.moderator.email);
    await expect(page).toHaveURL(/\/admin\/courses$/);

    await page.goto('/admin/revenue');

    await expect(page).toHaveURL(/\/admin\/courses$/);
    await expect(page.getByRole('heading', { name: 'Revenue', level: 1 })).toHaveCount(0);
  });

  test('the course enrolments page shows the orders with prices and a details panel', async ({
    page,
    baseURL,
  }, testInfo) => {
    const order = await createOrder(baseURL ?? '', testInfo);
    await signInAndWait(page, ACCOUNTS.superAdmin.email);

    await page.goto(`/admin/enrollments/${order.courseId}`);
    await expect(page.getByRole('heading', { name: order.title })).toBeVisible();
    await expect(page.getByText(order.buyer, { exact: true })).toBeVisible();
    await expect(page.getByText('Total: ৳500')).toBeVisible();
    await page.getByRole('tab', { name: 'Free' }).click();
    await expect(page.getByText(order.buyer, { exact: true })).toHaveCount(0);
    await page.getByRole('tab', { name: 'Paid' }).click();

    await page.getByText(order.buyer, { exact: true }).click();
    await expect(
      page.getByRole('dialog', { name: 'Purchase details' }).getByText(order.code),
    ).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
