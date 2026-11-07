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

const chooseOption = async (page: Page, field: string, option: string | number): Promise<void> => {
  await page.getByRole('combobox', { name: field }).click();
  const options = page.getByRole('option');
  await (
    typeof option === 'number' ? options.nth(option) : options.filter({ hasText: option }).first()
  ).click();
};

test.describe('Revenue page', () => {
  test('an Admin sees the month cards, opens a month and finds the order with its VAT and details', async ({
    page,
    baseURL,
  }, testInfo) => {
    const order = await createOrder(baseURL ?? '', testInfo);
    await signInAndWait(page, ACCOUNTS.admin.email);

    await page.goto('/admin/revenue');
    await expect(page.getByRole('heading', { name: 'Revenue', level: 1 })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Monthly sales' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const months = page.getByRole('region', { name: 'Sales per month' });
    await expect(months.getByText('Latest')).toBeVisible();
    await expectNoHorizontalScroll(page);

    await months
      .getByRole('button', { name: /^Open the sales of/ })
      .first()
      .click();
    await expect(page).toHaveURL(/month=\d{4}-\d{2}/);
    await expect(page.getByText('Top 5 courses by sales')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Totals of the filtered sales' })).toBeVisible();
    await expect(orderRow(page, order.buyer)).toBeVisible();

    await orderRow(page, order.buyer).click();
    const drawer = page.getByRole('dialog', { name: 'Purchase details' });
    await expect(drawer.getByText(order.code)).toBeVisible();
    await expect(drawer.getByText('bKash')).toBeVisible();
    await expect(drawer.getByText('৳500 (50%)')).toBeVisible();
    await expect(drawer.getByText('VAT (included)')).toBeVisible();
    await drawer.getByRole('button', { name: 'Close' }).click();
    await expect(drawer).toBeHidden();
    await expectNoHorizontalScroll(page);
  });

  test('All sales: filters by type (dropdown), period and course', async ({
    page,
    baseURL,
  }, testInfo) => {
    const order = await createOrder(baseURL ?? '', testInfo);
    await signInAndWait(page, ACCOUNTS.admin.email);
    await page.goto('/admin/revenue');

    await page.getByRole('tab', { name: 'All sales' }).click();
    await expect(page).toHaveURL(/view=all/);
    await chooseOption(page, 'Type', 'Free');
    await expect(page).toHaveURL(/type=free/);
    await expect(orderRow(page, order.buyer)).toHaveCount(0);
    await chooseOption(page, 'Type', 'Paid');
    await expect(page).toHaveURL(/type=paid/);

    await chooseOption(page, 'Period', 1);
    await expect(page).toHaveURL(/period=\d{4}-\d{2}/);

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
    await page.goto(`/admin/revenue?view=all&courses=${order.courseId}`);
    await expect(orderRow(page, order.buyer)).toBeVisible();

    await page
      .getByRole('checkbox', { name: /Select order/ })
      .first()
      .check();
    await expect(page.getByText('1 selected')).toBeVisible();
    await page.getByRole('button', { name: 'Export CSV' }).click();
    const exportDialog = page.getByRole('dialog', { name: 'Export CSV' });
    await expect(exportDialog.getByRole('checkbox', { name: /email and phone/ })).not.toBeChecked();
    const download = page.waitForEvent('download');
    await exportDialog.getByRole('button', { name: 'Download CSV' }).click();
    expect((await download).suggestedFilename()).toMatch(/^sales-\d{4}-\d{2}-\d{2}\.csv$/);

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

  test('the course enrolments page: sales with VAT, filters, details and the student tokens', async ({
    page,
    baseURL,
  }, testInfo) => {
    const order = await createOrder(baseURL ?? '', testInfo);
    await signInAndWait(page, ACCOUNTS.superAdmin.email);

    await page.goto(`/admin/enrollments/${order.courseId}`);
    await expect(page.getByRole('heading', { name: order.title })).toBeVisible();
    await expect(page.getByText(order.buyer, { exact: true })).toBeVisible();
    await expect(page.getByText(/1 enrolments shown · Sales ৳500 · VAT/)).toBeVisible();
    await expect(page.getByRole('region', { name: 'Sales per period' })).toBeVisible();
    await chooseOption(page, 'Type', 'Free');
    await expect(page.getByText(order.buyer, { exact: true })).toHaveCount(0);
    await chooseOption(page, 'Type', 'All');

    await page.getByText(order.buyer, { exact: true }).click();
    const drawer = page.getByRole('dialog', { name: 'Purchase details' });
    await expect(drawer.getByText(order.code)).toBeVisible();
    await drawer.getByRole('button', { name: 'Close' }).click();

    await page.getByRole('button', { name: 'Student tokens (PDF)' }).click();
    const tokens = page.getByRole('dialog', { name: /Student tokens/ });
    const popup = page.waitForEvent('popup');
    await tokens.getByRole('button', { name: 'Print', exact: true }).click();
    const printPage = await popup;
    await expect(printPage.getByText(order.buyer)).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
