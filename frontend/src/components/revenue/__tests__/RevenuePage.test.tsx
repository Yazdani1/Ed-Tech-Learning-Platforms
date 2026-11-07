import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubResizeObserver } from '@/components/insights/__tests__/fixtures';
import { orderSchema, type Order } from '@/schemas/revenue.schema';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { DESKTOP_WIDTH, setViewportWidth } from '@/test/viewport';

import { RevenuePage } from '../RevenuePage';

import type { UserRole } from '@/types';

const COURSE_A = '64b7f0c2a1b2c3d4e5f75001';
const COURSE_B = '64b7f0c2a1b2c3d4e5f75002';

const makeOrder = (id: string, overrides: Record<string, unknown> = {}): Order =>
  orderSchema.parse({
    _id: id,
    student: {
      _id: `s-${id}`,
      name: `Student ${id}`,
      email: `${id}@example.com`,
      phone: '01711000000',
      studentNumber: '123-456-789',
    },
    course: { _id: COURSE_A, title: 'Algebra 101', batchNumber: '1234' },
    enrollmentType: 'paid',
    listPrice: 1150,
    paidPrice: 1150,
    discountAmount: 0,
    discountPercent: 0,
    couponCode: 'SAVE20NOW',
    couponSource: 'coupon',
    paymentMethod: 'bkash',
    vatPercent: 15,
    vatAmount: 150,
    createdAt: '2026-10-02T09:00:00.000Z',
    ...overrides,
  });

const ORDERS = [
  makeOrder('o1'),
  makeOrder('o2', {
    enrollmentType: 'free',
    listPrice: 0,
    paidPrice: 0,
    couponCode: null,
    paymentMethod: null,
    vatPercent: 0,
    vatAmount: 0,
    course: { _id: COURSE_B, title: 'Physics Free' },
  }),
];

const MONTHS = [
  { month: '2026-11', revenue: 2300, vat: 300, orders: 3, paidOrders: 2 },
  { month: '2026-10', revenue: 1150, vat: 150, orders: 2, paidOrders: 1 },
];

const BREAKDOWN = {
  orders: 2,
  paidOrders: 1,
  freeOrders: 1,
  subscriptionOrders: 0,
  revenue: 1150,
  vat: 150,
  netRevenue: 1000,
  listTotal: 1150,
  discountTotal: 0,
  topCourses: [
    { courseId: COURSE_A, title: 'Algebra 101', batchNumber: '1234', revenue: 1150, orders: 1 },
  ],
};

interface Seen {
  orders: URLSearchParams[];
  breakdown: URLSearchParams[];
}

const revenueHandlers = (seen: Seen = { orders: [], breakdown: [] }) => [
  http.get('*/api/revenue/months', () => ok(MONTHS)),
  http.get('*/api/revenue/breakdown', ({ request }) => {
    seen.breakdown.push(new URL(request.url).searchParams);
    return ok(BREAKDOWN);
  }),
  http.get('*/api/revenue/orders', ({ request }) => {
    const params = new URL(request.url).searchParams;
    seen.orders.push(params);
    const type = params.get('type');
    const rows = type && type !== 'all' ? ORDERS.filter((o) => o.enrollmentType === type) : ORDERS;
    return ok(rows, { total: rows.length, page: 1, limit: 10 });
  }),
  http.get('*/api/students/courses', () =>
    ok([
      {
        _id: COURSE_A,
        title: 'Algebra 101',
        status: 'Published',
        enrolledStudents: 5,
        paidStudents: 3,
      },
      {
        _id: COURSE_B,
        title: 'Physics Free',
        status: 'Published',
        enrolledStudents: 2,
        paidStudents: 0,
      },
    ]),
  ),
];

const renderPage = (role: UserRole = 'Admin', search = '') => {
  setViewportWidth(DESKTOP_WIDTH);
  setLocation('/admin/revenue', search);
  server.use(signedInAs(makeUser(role)));
  return renderWithProviders(<RevenuePage />);
};

beforeEach(() => {
  stubResizeObserver();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('RevenuePage: Monthly sales (default tab)', () => {
  it('shows only the title, the two tabs and one card per month with sales, enrolments and VAT', async () => {
    server.use(...revenueHandlers());
    renderPage('Super Admin');

    expect(await screen.findByRole('heading', { name: 'Revenue' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Monthly sales' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'All sales' })).toBeInTheDocument();
    const months = await screen.findByRole('region', { name: 'Sales per month' });
    const november = within(months).getByRole('button', {
      name: 'Open the sales of November 2026',
    });
    expect(within(november).getByText('৳2,300')).toBeInTheDocument();
    expect(within(november).getByText('3 enrolments (2 paid)')).toBeInTheDocument();
    expect(within(november).getByText('VAT ৳300')).toBeInTheDocument();
    expect(within(november).getByText('Latest')).toBeInTheDocument();
    expect(screen.queryByText('Revenue per day (last 30 days)')).not.toBeInTheDocument();
  });

  it('opens a month through the address', async () => {
    server.use(...revenueHandlers());
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Open the sales of October 2026' }));

    expect(router.replace).toHaveBeenLastCalledWith('/admin/revenue?month=2026-10', {
      scroll: false,
    });
  });

  it('shows a month: top 5 courses, totals with VAT and only that month’s sales', async () => {
    const seen: Seen = { orders: [], breakdown: [] };
    server.use(...revenueHandlers(seen));
    renderPage('Admin', '?month=2026-10');

    expect(await screen.findByRole('heading', { name: 'October 2026' })).toBeInTheDocument();
    expect(screen.getByText('Top 5 courses by sales')).toBeInTheDocument();
    const totals = await screen.findByRole('region', { name: 'Totals of the filtered sales' });
    expect(within(totals).getByText('৳1,150')).toBeInTheDocument();
    expect(within(totals).getByText('৳150')).toBeInTheDocument();
    expect(within(totals).getByText('৳1,000')).toBeInTheDocument();
    await waitFor(() => {
      expect(seen.orders.length).toBeGreaterThan(0);
    });
    const from = new Date(seen.orders[0]?.get('from') ?? '');
    const to = new Date(seen.orders[0]?.get('to') ?? '');
    expect(to.getTime() - from.getTime()).toBeGreaterThan(27 * 24 * 3600 * 1000);
    expect(screen.queryByLabelText('Period')).not.toBeInTheDocument();
  });

  it('goes back to the months', async () => {
    server.use(...revenueHandlers());
    renderPage('Admin', '?month=2026-10');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'All months' }));

    expect(router.replace).toHaveBeenLastCalledWith('/admin/revenue', { scroll: false });
  });
});

describe('RevenuePage: All sales', () => {
  it('lists every sale with VAT, coupon and method; the type is a dropdown', async () => {
    server.use(...revenueHandlers());
    renderPage('Admin', '?view=all');

    const table = await screen.findByRole('table', { name: 'Orders' });
    expect(within(table).getByText('Student o1')).toBeInTheDocument();
    expect(within(table).getByText('Physics Free')).toBeInTheDocument();
    expect(within(table).getByText('15% · ৳150')).toBeInTheDocument();
    expect(within(table).getByText('SAVE20NOW')).toBeInTheDocument();
    expect(within(table).getByText('bKash')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Free' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Type' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Period' })).toBeInTheDocument();
  });

  it('filters by type and by month through the address', async () => {
    server.use(...revenueHandlers());
    renderPage('Admin', '?view=all');
    const user = userEvent.setup();

    await screen.findByRole('table', { name: 'Orders' });
    await user.click(screen.getByRole('combobox', { name: 'Type' }));
    await user.click(await screen.findByRole('option', { name: 'Free' }));
    expect(router.replace).toHaveBeenLastCalledWith('/admin/revenue?view=all&type=free', {
      scroll: false,
    });
  });

  it('reads the type, courses, page and a custom range from the address', async () => {
    const seen: Seen = { orders: [], breakdown: [] };
    server.use(...revenueHandlers(seen));
    renderPage(
      'Admin',
      `?view=all&type=paid&courses=${COURSE_A},not-an-id&page=2&period=custom&from=2026-10-01&to=2026-10-31`,
    );

    await waitFor(() => {
      expect(seen.orders.length).toBeGreaterThan(0);
    });
    const params = seen.orders[0];
    expect(params?.get('type')).toBe('paid');
    expect(params?.get('courseIds')).toBe(COURSE_A);
    expect(params?.get('page')).toBe('2');
    expect(params?.get('from')).toBeTruthy();
    expect(params?.get('to')).toBeTruthy();
    expect(screen.getByLabelText('From')).toHaveValue('2026-10-01');
    expect(screen.getByLabelText('To')).toHaveValue('2026-10-31');
  });

  it('filters by course with the picker on the left', async () => {
    server.use(...revenueHandlers());
    renderPage('Admin', '?view=all');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /All courses/ }));
    const picker = await screen.findByRole('dialog');
    await user.click(await within(picker).findByRole('checkbox', { name: /Physics Free/ }));
    await user.click(within(picker).getByRole('button', { name: /Apply/ }));

    expect(router.replace).toHaveBeenLastCalledWith(`/admin/revenue?view=all&courses=${COURSE_B}`, {
      scroll: false,
    });
  });

  it('opens the purchase details with the VAT', async () => {
    server.use(...revenueHandlers());
    renderPage('Admin', '?view=all');
    const user = userEvent.setup();

    await user.click(await screen.findByText('Student o1'));

    const drawer = await screen.findByRole('dialog', { name: 'Purchase details' });
    expect(within(drawer).getByText('o1@example.com')).toBeInTheDocument();
    expect(within(drawer).getByText('15% · ৳150')).toBeInTheDocument();
  });

  it('shows the empty state and the error with retry', async () => {
    server.use(
      http.get('*/api/revenue/breakdown', () => ok(BREAKDOWN)),
      http.get('*/api/revenue/orders', () => ok([], { total: 0, page: 1, limit: 10 })),
    );
    const first = renderPage('Admin', '?view=all');
    expect(await screen.findByText('No orders match these filters.')).toBeInTheDocument();
    first.unmount();

    server.use(http.get('*/api/revenue/months', () => fail(500, 'Months unavailable')));
    renderPage();
    expect(await screen.findByText('Months unavailable')).toBeInTheDocument();
  });

  it('is not for Moderators', async () => {
    server.use(...revenueHandlers());
    renderPage('Moderator');

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/admin/courses');
    });
    expect(screen.queryByRole('heading', { name: 'Revenue' })).not.toBeInTheDocument();
  });
});

describe('RevenuePage: CSV and print', () => {
  const captureCsv = () => {
    const result = { csv: '' };
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob.text().then((text) => {
        result.csv = text;
      });
      return 'blob:csv';
    });
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    return result;
  };

  it('exports the ticked sales with VAT and totals, without email and phone by default', async () => {
    const result = captureCsv();
    server.use(...revenueHandlers());
    renderPage('Admin', '?view=all');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('checkbox', { name: /Select order o1/ }));
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    const dialog = await screen.findByRole('dialog', { name: 'Export CSV' });
    expect(within(dialog).getByRole('checkbox', { name: /email and phone/ })).not.toBeChecked();
    await user.click(within(dialog).getByRole('button', { name: 'Download CSV' }));

    await waitFor(() => {
      expect(result.csv).not.toBe('');
    });
    expect(result.csv).toContain('Order ID,Date,Course,Batch,Student,Student ID,Type');
    expect(result.csv).toContain('VAT %,VAT amount');
    expect(result.csv).not.toContain('o1@example.com');
    expect(result.csv).toContain('Total VAT,150');
    expect(result.csv).not.toContain('Student o2');
  });

  it('exports every sale of the filter from the server, with contact details when ticked', async () => {
    const result = captureCsv();
    let exportQuery = '';
    server.use(
      http.get('*/api/revenue/orders/export', ({ request }) => {
        exportQuery = new URL(request.url).search;
        return ok(ORDERS);
      }),
      ...revenueHandlers(),
    );
    renderPage('Admin', '?view=all&type=paid');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Export CSV' }));
    const dialog = await screen.findByRole('dialog', { name: 'Export CSV' });
    await user.click(within(dialog).getByRole('checkbox', { name: /email and phone/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Download CSV' }));

    await waitFor(() => {
      expect(result.csv).not.toBe('');
    });
    expect(exportQuery).toContain('type=paid');
    expect(result.csv).toContain('o1@example.com');
  });

  it('prints the ticked students with only the chosen details', async () => {
    const doc = document.implementation.createHTMLDocument('x');
    const win = { document: doc, focus: vi.fn(), print: vi.fn(), close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(win as unknown as Window);
    server.use(...revenueHandlers());
    renderPage('Admin', '?view=all');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('checkbox', { name: /Select order o1/ }));
    await user.click(screen.getByRole('button', { name: 'Print students (PDF)' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('radio', { name: 'The selected orders (1)' })).toBeChecked();
    await user.click(within(dialog).getByRole('button', { name: 'Print' }));

    expect(await screen.findByText('Print page opened')).toBeInTheDocument();
    const headers = [...win.document.querySelectorAll('th')].map((cell) => cell.textContent);
    expect(headers).toEqual(['#', 'Name', 'Student ID']);
  });
});
