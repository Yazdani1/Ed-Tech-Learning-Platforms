import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  makeCourse,
  referenceHandlers,
} from '@/components/admin-courses/__tests__/admin-courses-fixtures';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { promoSchema } from '@/schemas/promo.schema';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import { DESKTOP_WIDTH, setViewportWidth } from '@/test/viewport';

import { PromosPage } from '../PromosPage';

import type { UserRole } from '@/types';

const ALGEBRA = makeCourse('001', { title: 'Algebra 101', batchNumber: '1234' });
const PHYSICS = makeCourse('002', { title: 'Physics Pro' });
const SOON = '2099-01-01T10:00:00.000Z';

const makePromo = (overrides: Record<string, unknown> = {}) =>
  promoSchema.parse({
    _id: 'p1',
    title: 'Eid offer',
    code: 'EIDSALE40',
    discountType: 'percent',
    value: 40,
    startsAt: '2026-10-01T10:00:00.000Z',
    endsAt: SOON,
    courses: [{ _id: ALGEBRA._id, title: 'Algebra 101' }, null],
    isActive: true,
    status: 'active',
    usedCount: 3,
    ...overrides,
  });

const renderPage = (role: UserRole = 'Admin') => {
  setViewportWidth(DESKTOP_WIDTH);
  server.use(
    signedInAs(makeUser(role)),
    ...referenceHandlers(),
    http.get('*/api/courses', () => ok([ALGEBRA, PHYSICS])),
  );
  return renderWithProviders(
    <ConfirmProvider>
      <PromosPage />
    </ConfirmProvider>,
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PromosPage (/admin/promos)', () => {
  it('lists the promos with code, discount, period, courses, uses and status', async () => {
    server.use(http.get('*/api/promos', () => ok([makePromo()], { total: 1 })));
    renderPage('Super Admin');

    expect(await screen.findByText('Eid offer')).toBeInTheDocument();
    expect(screen.getByText('EIDSALE40')).toBeInTheDocument();
    expect(screen.getByText('40% off')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Promos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions for Eid offer' })).toBeInTheDocument();
  });

  it('shows the empty state and the error with retry', async () => {
    server.use(http.get('*/api/promos', () => ok([], { total: 0 })));
    const first = renderPage();
    expect(await screen.findByText('No promos yet.')).toBeInTheDocument();
    first.unmount();

    server.use(http.get('*/api/promos', () => fail(500, 'Promos unavailable')));
    renderPage();
    expect(await screen.findByText('Promos unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('is not for Moderators or teachers', async () => {
    server.use(http.get('*/api/promos', () => ok([], { total: 0 })));
    renderPage('Moderator');

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Create promo' })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Promos' })).not.toBeInTheDocument();
  });

  it('creates a promo for the chosen courses, with a suggested code', async () => {
    let body: Record<string, unknown> = {};
    let promos: unknown[] = [];
    server.use(
      http.get('*/api/promos', () => ok(promos, { total: promos.length })),
      http.get('*/api/coupons/suggest', () => ok({ code: 'SUGGEST123' })),
      http.post('*/api/promos', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        promos = [makePromo()];
        return ok({ _id: 'p1' });
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Create promo' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create promo' });
    await waitFor(() => {
      expect(within(dialog).getByLabelText(/Coupon code/)).toHaveValue('SUGGEST123');
    });
    await user.click(await within(dialog).findByRole('checkbox', { name: 'Algebra 101' }));
    expect(within(dialog).getByText('1 selected')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/Promo title/), 'Eid offer');
    await user.type(within(dialog).getByRole('textbox', { name: /^Discount/ }), '40');
    fireEvent.change(within(dialog).getByLabelText(/Starts/), {
      target: { value: '2026-12-01T10:00' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Ends/), {
      target: { value: '2026-12-10T10:00' },
    });
    await user.click(within(dialog).getByRole('button', { name: 'Save promo' }));

    expect(await screen.findByText('Promo saved')).toBeInTheDocument();
    expect(body).toMatchObject({
      title: 'Eid offer',
      code: 'SUGGEST123',
      discountType: 'percent',
      value: 40,
      courseIds: [ALGEBRA._id],
    });
    expect(String(body.startsAt)).toMatch(/Z$/);
    expect(await screen.findByText('EIDSALE40')).toBeInTheDocument();
  });

  it('checks the form before sending: courses, title, code length, value and dates', async () => {
    let called = false;
    server.use(
      http.get('*/api/promos', () => ok([], { total: 0 })),
      http.get('*/api/coupons/suggest', () => ok({ code: 'SUGGEST123' })),
      http.post('*/api/promos', () => {
        called = true;
        return ok({ _id: 'p1' });
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Create promo' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create promo' });
    const code = within(dialog).getByLabelText(/Coupon code/);
    await waitFor(() => {
      expect(code).toHaveValue('SUGGEST123');
    });
    await user.clear(code);
    await user.type(code, 'ABC12');
    await user.click(within(dialog).getByRole('button', { name: 'Save promo' }));

    expect(await within(dialog).findByText('Select at least one course')).toBeInTheDocument();
    expect(within(dialog).getByText('Use 6-20 letters, digits or dashes')).toBeInTheDocument();
    expect(within(dialog).getByText('Enter an amount above 0')).toBeInTheDocument();
    expect(called).toBe(false);

    fireEvent.change(within(dialog).getByLabelText(/Starts/), {
      target: { value: '2026-12-10T10:00' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Ends/), {
      target: { value: '2026-12-01T10:00' },
    });
    await user.click(within(dialog).getByRole('button', { name: 'Save promo' }));
    expect(await within(dialog).findByText('The end must be after the start')).toBeInTheDocument();
  });

  it('filters the course list by title and shows the batch number', async () => {
    const queries: string[] = [];
    server.use(http.get('*/api/promos', () => ok([], { total: 0 })));
    renderPage();
    server.use(
      http.get('*/api/courses', ({ request }) => {
        queries.push(new URL(request.url).search);
        return ok([ALGEBRA, PHYSICS]);
      }),
    );
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Create promo' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create promo' });
    expect(await within(dialog).findByText('Batch 1234')).toBeInTheDocument();
    await user.type(within(dialog).getByRole('searchbox', { name: 'Search courses' }), 'alg');

    await waitFor(() => {
      expect(queries.some((query) => query.includes('search=alg'))).toBe(true);
    });
    expect(queries.every((query) => query.includes('status=Published'))).toBe(true);
    expect(queries.every((query) => query.includes('pricing=Paid'))).toBe(true);

    await user.click(within(dialog).getByRole('button', { name: 'Select all shown' }));
    expect(within(dialog).getByText('2 selected')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Unselect all shown' }));
    expect(within(dialog).getByText('0 selected')).toBeInTheDocument();
  });

  it('shows the server message when saving fails and keeps the dialog open', async () => {
    server.use(
      http.get('*/api/promos', () => ok([], { total: 0 })),
      http.get('*/api/coupons/suggest', () => ok({ code: 'SUGGEST123' })),
      http.post('*/api/promos', () => fail(409, 'This code is already used')),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Create promo' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create promo' });
    await waitFor(() => {
      expect(within(dialog).getByLabelText(/Coupon code/)).toHaveValue('SUGGEST123');
    });
    await user.click(await within(dialog).findByRole('checkbox', { name: 'Algebra 101' }));
    await user.type(within(dialog).getByLabelText(/Promo title/), 'Eid offer');
    await user.type(within(dialog).getByRole('textbox', { name: /^Discount/ }), '40');
    fireEvent.change(within(dialog).getByLabelText(/Starts/), {
      target: { value: '2026-12-01T10:00' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Ends/), {
      target: { value: '2026-12-10T10:00' },
    });
    await user.click(within(dialog).getByRole('button', { name: 'Save promo' }));

    expect(await within(dialog).findByText('This code is already used')).toBeInTheDocument();
  });

  it('edits a promo from its row', async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.get('*/api/promos', () => ok([makePromo()], { total: 1 })),
      http.patch('*/api/promos/p1', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return ok({ _id: 'p1' });
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByText('Eid offer'));
    const dialog = await screen.findByRole('dialog', { name: 'Edit promo' });
    const title = within(dialog).getByLabelText(/Promo title/);
    expect(title).toHaveValue('Eid offer');
    await user.clear(title);
    await user.type(title, 'Eid offer 2');
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Promo updated')).toBeInTheDocument();
    expect(body).toMatchObject({ title: 'Eid offer 2', courseIds: [ALGEBRA._id] });
  });

  it('stops a promo and starts it again', async () => {
    const patches: unknown[] = [];
    server.use(
      http.get('*/api/promos', () => ok([makePromo()], { total: 1 })),
      http.patch('*/api/promos/p1', async ({ request }) => {
        patches.push(await request.json());
        return ok({ _id: 'p1' });
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Actions for Eid offer' }));
    await user.click(screen.getByRole('menuitem', { name: 'Switch off' }));
    expect(await screen.findByText('Promo stopped')).toBeInTheDocument();
    expect(patches).toEqual([{ isActive: false }]);
  });

  it('deletes a promo after confirmation and shows the server refusal', async () => {
    let attempts = 0;
    server.use(
      http.get('*/api/promos', () => ok([makePromo()], { total: 1 })),
      http.delete('*/api/promos/p1', () => {
        attempts += 1;
        return attempts === 1 ? fail(400, 'This promo was used; stop it instead') : ok(undefined);
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Actions for Eid offer' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );
    expect(await screen.findByText('This promo was used; stop it instead')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Actions for Eid offer' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );
    expect(await screen.findByText('Promo deleted')).toBeInTheDocument();
  });
});
