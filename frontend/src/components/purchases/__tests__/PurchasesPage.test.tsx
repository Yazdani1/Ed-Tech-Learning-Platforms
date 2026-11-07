import { screen, within } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import { DESKTOP_WIDTH, setViewportWidth } from '@/test/viewport';

import { PurchasesPage } from '../PurchasesPage';

const DATA = {
  purchases: [
    {
      _id: 'p1',
      course: { _id: 'c1', title: 'Web Development', batchNumber: '4821' },
      enrollmentType: 'paid',
      listPrice: 1000,
      discountAmount: 200,
      discountPercent: 20,
      amountPaid: 800,
      currency: 'BDT',
      couponCode: 'SAVE20NOW',
      couponSource: 'coupon',
      paymentMethod: 'bkash',
      createdAt: '2026-10-02T09:00:00.000Z',
    },
    {
      _id: 'p2',
      course: { _id: 'c2', title: 'Free Basics' },
      enrollmentType: 'free',
      listPrice: 0,
      discountAmount: 0,
      discountPercent: 0,
      amountPaid: 0,
      currency: 'BDT',
      createdAt: '2026-09-02T09:00:00.000Z',
    },
  ],
  totals: { courses: 2, paidCourses: 1, totalSpent: 800, totalSaved: 200 },
};

const renderPage = () => {
  setViewportWidth(DESKTOP_WIDTH);
  server.use(signedInAs(makeUser('Student')));
  return renderWithProviders(<PurchasesPage />);
};

describe('PurchasesPage (/student/purchases)', () => {
  it('shows the count, the totals and every purchase with its details', async () => {
    server.use(http.get('*/api/enrollments/me/purchases', () => ok(DATA, { total: 2 })));
    renderPage();

    expect(screen.getByRole('heading', { name: 'Purchases' })).toBeInTheDocument();
    expect(await screen.findByLabelText('2 courses')).toBeInTheDocument();
    const totals = screen.getByRole('region', { name: 'Purchase totals' });
    expect(within(totals).getByText('৳800')).toBeInTheDocument();
    expect(within(totals).getByText('৳200')).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: 'Purchases' });
    expect(within(table).getByText('Web Development')).toBeInTheDocument();
    expect(within(table).getByText('Batch 4821')).toBeInTheDocument();
    expect(within(table).getByText('p1')).toBeInTheDocument();
    expect(within(table).getByText('৳200 (20%)')).toBeInTheDocument();
    expect(within(table).getByText('SAVE20NOW')).toBeInTheDocument();
    expect(within(table).getByText('bKash')).toBeInTheDocument();
    expect(within(table).getByText('Free Basics')).toBeInTheDocument();
  });

  it('shows the empty state and errors', async () => {
    server.use(
      http.get('*/api/enrollments/me/purchases', () =>
        ok({ purchases: [], totals: { courses: 0, paidCourses: 0, totalSpent: 0, totalSaved: 0 } }),
      ),
    );
    const first = renderPage();
    expect(await screen.findByText('You have not enrolled in any course yet.')).toBeInTheDocument();
    first.unmount();

    server.use(
      http.get('*/api/enrollments/me/purchases', () => fail(500, 'Purchases unavailable')),
    );
    renderPage();
    expect(await screen.findByText('Purchases unavailable')).toBeInTheDocument();
  });
});
