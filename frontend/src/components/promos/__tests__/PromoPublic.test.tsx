import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/api/query-keys';
import { makeCourse } from '@/components/public/__tests__/public-fixtures';
import { ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { PromoCoursesPage } from '../PromoCoursesPage';
import { PromoPopup } from '../PromoPopup';

const PROMO = {
  _id: 'p1',
  title: 'Eid offer',
  code: 'EIDSALE40',
  discountType: 'percent',
  value: 40,
  startsAt: '2026-10-01T10:00:00.000Z',
  endsAt: '2099-01-01T10:00:00.000Z',
  courseCount: 2,
};

const withPromo = () => http.get('*/api/promos/active', () => ok([PROMO]));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PromoPopup', () => {
  it('shows the running promo with its code, dates and the way to the promo page', async () => {
    server.use(withPromo());
    renderWithProviders(<PromoPopup />);

    const dialog = await screen.findByRole('dialog', { name: 'Eid offer' });
    expect(within(dialog).getByText('40% OFF')).toBeInTheDocument();
    expect(within(dialog).getByText('EIDSALE40')).toBeInTheDocument();
    expect(within(dialog).getByText(/^From .* to .*$/)).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Enroll now' })).toHaveAttribute(
      'href',
      '/promo',
    );
  });

  it('closes with the cross', async () => {
    server.use(withPromo());
    renderWithProviders(<PromoPopup />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Close' }));

    await vi.waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('copies the code', async () => {
    server.use(withPromo());
    const writeText = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<PromoPopup />);
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    await user.click(await screen.findByRole('button', { name: 'Copy code EIDSALE40' }));

    expect(writeText).toHaveBeenCalledWith('EIDSALE40');
    expect(await screen.findByText('Code copied')).toBeInTheDocument();
  });

  it('shows nothing when no promo runs', async () => {
    server.use(http.get('*/api/promos/active', () => ok([])));
    renderWithProviders(<PromoPopup />);

    await vi.waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('stays hidden while the sign-in panel is open', async () => {
    setLocation('/', '?auth=login');
    server.use(withPromo());
    const { queryClient } = renderWithProviders(<PromoPopup />);

    await vi.waitFor(() => {
      expect(queryClient.getQueryState(queryKeys.promos.active)?.status).toBe('success');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('PromoCoursesPage (/promo)', () => {
  it('lists the courses of the running promo with its title, discount and code', async () => {
    server.use(
      withPromo(),
      http.get('*/api/promos/active/courses', () =>
        ok([
          makeCourse({
            _id: '660000000000000000000011',
            title: 'Algebra Promo',
            offer: {
              code: 'EIDSALE40',
              source: 'promo',
              price: 600,
              listPrice: 1000,
              discountAmount: 400,
              discountPercent: 40,
            },
          }),
          makeCourse({ _id: '660000000000000000000012', title: 'Physics Promo' }),
        ]),
      ),
    );
    renderWithProviders(<PromoCoursesPage />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Eid offer' })).toBeInTheDocument();
    expect(
      screen.getByText('40% OFF with the code EIDSALE40 on every course below.'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Algebra Promo')).toBeInTheDocument();
    expect(screen.getByText('Physics Promo')).toBeInTheDocument();
    expect(screen.getByText('৳600')).toBeInTheDocument();
  });

  it('says so when no promo is running', async () => {
    server.use(
      http.get('*/api/promos/active', () => ok([])),
      http.get('*/api/promos/active/courses', () => ok([])),
    );
    renderWithProviders(<PromoCoursesPage />);

    expect(await screen.findByText('No promo is running right now.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Promo courses' })).toBeInTheDocument();
  });
});
