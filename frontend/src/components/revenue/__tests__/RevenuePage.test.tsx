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
    listPrice: 1000,
    paidPrice: 800,
    discountAmount: 200,
    discountPercent: 20,
    couponCode: 'SAVE20NOW',
    couponSource: 'coupon',
    paymentMethod: 'bkash',
    createdAt: '2026-10-02T09:00:00.000Z',
    ...overrides,
  });

const ORDERS = [
  makeOrder('o1'),
  makeOrder('o2', {
    enrollmentType: 'free',
    listPrice: 0,
    paidPrice: 0,
    discountAmount: 0,
    discountPercent: 0,
    couponCode: null,
    paymentMethod: null,
    course: { _id: COURSE_B, title: 'Physics Free' },
  }),
];

const totals = (revenue: number, orders: number, paidOrders: number) => ({
  revenue,
  orders,
  paidOrders,
});
const SUMMARY = {
  totals: {
    today: totals(800, 1, 1),
    week: totals(2400, 3, 3),
    month: totals(5000, 6, 5),
    lifetime: totals(90000, 40, 30),
  },
  daily: [{ date: '2026-10-01', revenue: 800, orders: 1, paidOrders: 1 }],
  weekly: [{ date: '2026-09-28', revenue: 2400, orders: 3, paidOrders: 3 }],
  monthly: [{ date: '2026-10-01', revenue: 5000, orders: 6, paidOrders: 5 }],
};

interface Seen {
  orders: URLSearchParams[];
  summary: URLSearchParams[];
}

const revenueHandlers = (seen: Seen = { orders: [], summary: [] }) => [
  http.get('*/api/revenue/summary', ({ request }) => {
    seen.summary.push(new URL(request.url).searchParams);
    return ok(SUMMARY);
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

describe('RevenuePage (/admin/revenue)', () => {
  it('shows the sales of today, the last 7 days, this month and all time with the chart', async () => {
    server.use(...revenueHandlers());
    renderPage('Super Admin');

    const cards = await screen.findByRole('region', { name: 'Sales per period' });
    const periods: [string, string, string][] = [
      ['Today', '৳800', '1 orders (1 paid)'],
      ['Last 7 days', '৳2,400', '3 orders (3 paid)'],
      ['This month', '৳5,000', '6 orders (5 paid)'],
      ['All time', '৳90,000', '40 orders (30 paid)'],
    ];
    for (const [label, amount, orders] of periods) {
      expect(within(cards).getByText(label)).toBeInTheDocument();
      expect(within(cards).getByText(amount)).toBeInTheDocument();
      expect(within(cards).getByText(orders)).toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { name: 'Revenue' })).toBeInTheDocument();
    expect(await screen.findByText('Revenue per day (last 30 days)')).toBeInTheDocument();
  });

  it('switches the chart between daily, weekly and monthly', async () => {
    server.use(...revenueHandlers());
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Weekly' }));
    expect(screen.getByText('Revenue per week (last 12 weeks)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Monthly' }));
    expect(screen.getByText('Revenue per month (last 12 months)')).toBeInTheDocument();
  });

  it('sends the viewer time zone with the summary', async () => {
    const seen: Seen = { orders: [], summary: [] };
    server.use(...revenueHandlers(seen));
    renderPage();

    await screen.findByRole('region', { name: 'Sales per period' });
    expect(seen.summary[0]?.get('tz')).toBeTruthy();
  });

  it('lists every order with course, student, type, prices, coupon and method', async () => {
    server.use(...revenueHandlers());
    renderPage();

    const table = await screen.findByRole('table', { name: 'Orders' });
    expect(within(table).getByText('Student o1')).toBeInTheDocument();
    expect(within(table).getByText('Algebra 101')).toBeInTheDocument();
    expect(within(table).getByText('Physics Free')).toBeInTheDocument();
    expect(within(table).getByText('SAVE20NOW')).toBeInTheDocument();
    expect(within(table).getByText('bKash')).toBeInTheDocument();
    expect(within(table).getByText('৳1,000')).toBeInTheDocument();
    expect(within(table).getByText('৳200 (20%)')).toBeInTheDocument();
    expect(within(table).getByText('Not recorded')).toBeInTheDocument();
  });

  it('filters the orders by type through the address', async () => {
    const seen: Seen = { orders: [], summary: [] };
    server.use(...revenueHandlers(seen));
    renderPage();
    const user = userEvent.setup();

    await screen.findByRole('table', { name: 'Orders' });
    await user.click(screen.getByRole('tab', { name: 'Free' }));

    expect(router.replace).toHaveBeenLastCalledWith('/admin/revenue?type=free', {
      scroll: false,
    });
  });

  it('reads the type, page and courses from the address and ignores bad ids', async () => {
    const seen: Seen = { orders: [], summary: [] };
    server.use(...revenueHandlers(seen));
    renderPage('Admin', `?type=paid&courses=${COURSE_A},not-an-id&page=2`);

    await waitFor(() => {
      expect(seen.orders.length).toBeGreaterThan(0);
    });
    const params = seen.orders[0];
    expect(params?.get('type')).toBe('paid');
    expect(params?.get('courseIds')).toBe(COURSE_A);
    expect(params?.get('page')).toBe('2');
    expect(params?.get('limit')).toBe('10');
    expect(
      await screen.findByRole('button', { name: /Algebra 101/ }, { timeout: 10_000 }),
    ).toBeInTheDocument();
  });

  it('filters by course with the picker on the left', async () => {
    server.use(...revenueHandlers());
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /All courses/ }));
    const picker = await screen.findByRole('dialog');
    await user.click(await within(picker).findByRole('checkbox', { name: /Physics Free/ }));
    await user.click(within(picker).getByRole('button', { name: /Apply/ }));

    expect(router.replace).toHaveBeenLastCalledWith(`/admin/revenue?courses=${COURSE_B}`, {
      scroll: false,
    });
  });

  it('opens the purchase details of an order', async () => {
    server.use(...revenueHandlers());
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByText('Student o1'));

    const drawer = await screen.findByRole('dialog', { name: 'Purchase details' });
    expect(within(drawer).getByText('o1@example.com')).toBeInTheDocument();
    expect(within(drawer).getByText('B-1234'.replace('B-', ''))).toBeInTheDocument();
    expect(within(drawer).getByText('SAVE20NOW')).toBeInTheDocument();
  });

  it('shows the empty state and the error with retry', async () => {
    server.use(
      http.get('*/api/revenue/summary', () => ok(SUMMARY)),
      http.get('*/api/revenue/orders', () => ok([], { total: 0, page: 1, limit: 10 })),
    );
    const first = renderPage();
    expect(await screen.findByText('No orders match these filters.')).toBeInTheDocument();
    first.unmount();

    server.use(
      http.get('*/api/revenue/summary', () => fail(500, 'Summary unavailable')),
      http.get('*/api/revenue/orders', () => fail(500, 'Orders unavailable')),
    );
    renderPage();
    expect(await screen.findByText('Orders unavailable')).toBeInTheDocument();
    expect(screen.getByText('Summary unavailable')).toBeInTheDocument();
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

describe('RevenuePage selection, CSV and print', () => {
  const tick = async (name: RegExp) => {
    const user = userEvent.setup();
    await user.click(await screen.findByRole('checkbox', { name }));
    return user;
  };

  it('keeps the CSV button off until an order is ticked, then counts the selection', async () => {
    server.use(...revenueHandlers());
    renderPage();

    const user = await tick(/Select order o1/);
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Select this page' }));
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Unselect this page' }));
    expect(screen.queryByText(/selected$/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });

  it('ticking a row does not open its details', async () => {
    server.use(...revenueHandlers());
    renderPage();

    await tick(/Select order o1/);

    expect(screen.queryByRole('dialog', { name: 'Purchase details' })).not.toBeInTheDocument();
  });

  it('exports the ticked orders as a CSV with every detail', async () => {
    let csv = '';
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob.text().then((text) => {
        csv = text;
      });
      return 'blob:csv';
    });
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    server.use(...revenueHandlers());
    renderPage();

    const user = await tick(/Select order o1/);
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    await waitFor(() => {
      expect(csv).not.toBe('');
    });
    expect(csv).toContain('Order ID,Date,Course,Batch,Student,Student ID,Email,Phone,Type');
    expect(csv).toContain('o1');
    expect(csv).toContain('Student o1');
    expect(csv).toContain('SAVE20NOW');
    expect(csv).toContain('bKash');
    expect(csv).not.toContain('Student o2');
  });

  const fakePrintWindow = () => {
    const doc = document.implementation.createHTMLDocument('x');
    return { document: doc, focus: vi.fn(), print: vi.fn(), close: vi.fn() };
  };

  it('prints the ticked students with only the chosen details', async () => {
    const win = fakePrintWindow();
    vi.spyOn(window, 'open').mockReturnValue(win as unknown as Window);
    server.use(...revenueHandlers());
    renderPage();

    const user = await tick(/Select order o1/);
    await user.click(screen.getByRole('button', { name: 'Print students (PDF)' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('radio', { name: 'The selected orders (1)' })).toBeChecked();
    await user.click(within(dialog).getByRole('checkbox', { name: 'Email' }));
    await user.click(within(dialog).getByRole('button', { name: 'Print' }));

    expect(await screen.findByText('Print page opened')).toBeInTheDocument();
    expect(win.print).toHaveBeenCalled();
    const headers = [...win.document.querySelectorAll('th')].map((cell) => cell.textContent);
    expect(headers).toEqual(['#', 'Name', 'Student ID', 'Email']);
    const cells = [...win.document.querySelectorAll('td')].map((cell) => cell.textContent);
    expect(cells).toEqual(['1', 'Student o1', '123-456-789', 'o1@example.com']);
  });

  it('prints every order of the filter from the server when nothing is ticked', async () => {
    const win = fakePrintWindow();
    vi.spyOn(window, 'open').mockReturnValue(win as unknown as Window);
    let exportQuery = '';
    server.use(
      http.get('*/api/revenue/orders/export', ({ request }) => {
        exportQuery = new URL(request.url).search;
        return ok(ORDERS);
      }),
      ...revenueHandlers(),
    );
    renderPage('Admin', '?type=paid');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Print students (PDF)' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('radio', { name: 'The selected orders (0)' })).toBeDisabled();
    await user.click(within(dialog).getByRole('button', { name: 'Print' }));

    expect(await screen.findByText('Print page opened')).toBeInTheDocument();
    expect(exportQuery).toContain('type=paid');
    expect(win.document.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(win.document.title).toBe('All courses');
  });

  it('says so when the browser blocks the print tab', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    server.use(...revenueHandlers());
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Print students (PDF)' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Print' }));

    expect(await screen.findByText(/blocked/i)).toBeInTheDocument();
  });

  it('needs at least one detail to print', async () => {
    server.use(...revenueHandlers());
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Print students (PDF)' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('checkbox', { name: 'Name' }));
    await user.click(within(dialog).getByRole('checkbox', { name: 'Student ID' }));

    expect(within(dialog).getByRole('button', { name: 'Print' })).toBeDisabled();
  });
});
