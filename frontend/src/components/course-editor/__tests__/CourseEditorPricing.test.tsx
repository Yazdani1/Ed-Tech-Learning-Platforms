import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, type RequestHandler } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { lastOf } from '@/test/pick';
import { renderWithProviders } from '@/test/render';
import { DESKTOP_WIDTH, setViewportWidth } from '@/test/viewport';

import { CourseEditorPage } from '../CourseEditorPage';

import { COURSE_ID, catalogHandlers, makeCourse } from './fixtures';

import type { Course } from '@/schemas/browse.schema';

const PAID = makeCourse({
  title: 'Paid Algebra',
  pricing: 'Paid',
  listPrice: 1000,
  discountPrice: 800,
  price: 800,
  discountCode: 'ALGEBRA20',
  batchNumber: '1234',
  liveClassSchedule: 'Saturday 9 PM',
});

const renderEditor = async (tab: string, course: Course = PAID, ...handlers: RequestHandler[]) => {
  setViewportWidth(DESKTOP_WIDTH);
  server.use(
    ...handlers,
    signedInAs(makeUser('Admin')),
    ...catalogHandlers,
    http.get(`*/api/courses/${COURSE_ID}`, () => ok(course)),
  );
  renderWithProviders(
    <ConfirmProvider>
      <CourseEditorPage courseId={COURSE_ID} />
    </ConfirmProvider>,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole('tab', { name: tab }));
  return user;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Course editor: Basic Info', () => {
  it('has the batch number and the schedule texts, and no prices or visibility', async () => {
    await renderEditor('Basic Info');

    expect(await screen.findByLabelText('Batch number')).toHaveValue('1234');
    expect(screen.getByLabelText('Live class schedule')).toHaveValue('Saturday 9 PM');
    expect(screen.getByLabelText('Support class schedule')).toHaveValue('');
    expect(screen.queryByLabelText(/List Price/)).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /Visibility/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /Pricing/ })).not.toBeInTheDocument();
  });

  it('suggests another batch number from the server', async () => {
    const user = await renderEditor(
      'Basic Info',
      PAID,
      http.get('*/api/courses/batch-number/suggest', () => ok({ batchNumber: '9087' })),
    );

    await user.click(await screen.findByRole('button', { name: 'Suggest another batch number' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Batch number')).toHaveValue('9087');
    });
  });

  it('rejects a batch number that is not 4 digits before saving', async () => {
    let saved = false;
    server.use(
      http.put(`*/api/courses/${COURSE_ID}`, () => {
        saved = true;
        return ok({ _id: COURSE_ID, status: 'Draft' });
      }),
    );
    const user = await renderEditor('Basic Info');

    const field = await screen.findByLabelText('Batch number');
    await user.clear(field);
    await user.type(field, '12');
    await user.click(screen.getByRole('button', { name: 'Save Draft' }));

    await waitFor(() => {
      expect(field).toHaveAttribute('aria-invalid', 'true');
    });
    expect(saved).toBe(false);
  });
});

describe('Course editor: Pricing', () => {
  it('shows the prices and the discount coupon, and saves them with the course', async () => {
    let body: Record<string, FormDataEntryValue> = {};
    server.use(
      http.put(`*/api/courses/${COURSE_ID}`, async ({ request }) => {
        body = Object.fromEntries((await request.formData()).entries());
        return ok({ _id: COURSE_ID, status: 'Draft' });
      }),
      http.patch(`*/api/courses/${COURSE_ID}/status`, () =>
        ok({ _id: COURSE_ID, status: 'Draft' }),
      ),
    );
    const user = await renderEditor('Pricing');

    expect(await screen.findByLabelText(/List Price/)).toHaveValue('1000');
    expect(screen.getByLabelText(/Discount Price/)).toHaveValue('800');
    expect(screen.getByText('Discount coupon')).toBeInTheDocument();
    const code = screen.getByLabelText('Coupon code');
    expect(code).toHaveValue('ALGEBRA20');

    await user.clear(code);
    await user.type(code, 'newcode2026');
    await user.click(screen.getByRole('button', { name: 'Save Draft' }));

    expect(await screen.findByText('Course updated')).toBeInTheDocument();
    expect(body).toMatchObject({
      pricing: 'Paid',
      listPrice: '1000',
      discountPrice: '800',
      discountCode: 'NEWCODE2026',
    });
  });

  it('refuses a coupon code of fewer than 6 characters', async () => {
    const user = await renderEditor('Pricing');

    const code = await screen.findByLabelText('Coupon code');
    await user.clear(code);
    await user.type(code, 'ABC12');
    await user.click(screen.getByRole('button', { name: 'Save Draft' }));

    expect(await screen.findByText('Use 6-20 letters, digits or dashes')).toBeInTheDocument();
  });

  it('suggests a free coupon code', async () => {
    server.use(http.get('*/api/coupons/suggest', () => ok({ code: 'FREE2026X' })));
    const user = await renderEditor('Pricing');

    await user.click(await screen.findByRole('button', { name: 'Suggest a new code' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Coupon code')).toHaveValue('FREE2026X');
    });
  });

  it('explains how to create a discount while there is none, and hides the coupon box', async () => {
    await renderEditor('Pricing', makeCourse({ pricing: 'Paid', listPrice: 500, price: 500 }));

    expect(
      await screen.findByText(/Set a discount price below the list price/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Discount coupon')).not.toBeInTheDocument();
  });

  it('shows no price fields for a free course', async () => {
    await renderEditor('Pricing', makeCourse({ pricing: 'Free' }));

    expect(await screen.findByRole('combobox', { name: /Pricing/ })).toHaveTextContent('Free');
    expect(screen.queryByLabelText(/List Price/)).not.toBeInTheDocument();
  });
});

const COUPONS = [
  {
    _id: 'auto',
    kind: 'auto',
    code: 'ALGEBRA20',
    discountType: 'percent',
    value: 20,
    endsAt: '2026-12-01T10:00:00.000Z',
    usedCount: 2,
    isActive: true,
    status: 'active',
  },
  {
    _id: 'c1',
    kind: 'coupon',
    code: 'WELCOME500',
    discountType: 'amount',
    value: 500,
    usageLimit: 5,
    usedCount: 1,
    isActive: true,
    status: 'active',
  },
  {
    _id: 'p1',
    kind: 'promo',
    code: 'BIGSALE50',
    title: 'Big sale',
    discountType: 'percent',
    value: 50,
    usedCount: 0,
    isActive: false,
    status: 'inactive',
  },
];

describe('Course editor: Coupons', () => {
  it('lists the course discount, its coupons and promos; only coupons have a menu', async () => {
    server.use(http.get('*/api/coupons', () => ok(COUPONS)));
    await renderEditor('Coupons');

    expect(await screen.findByText('ALGEBRA20')).toBeInTheDocument();
    expect(screen.getByText('WELCOME500')).toBeInTheDocument();
    expect(screen.getByText('BIGSALE50')).toBeInTheDocument();
    expect(screen.getByText('Course discount')).toBeInTheDocument();
    expect(screen.getByText('20% off')).toBeInTheDocument();
    expect(screen.getByText('৳500 off')).toBeInTheDocument();
    expect(screen.getByText('1 of 5')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions for WELCOME500' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Actions for ALGEBRA20' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Actions for BIGSALE50' })).not.toBeInTheDocument();
  });

  it('says a free course cannot have coupons', async () => {
    await renderEditor('Coupons', makeCourse({ pricing: 'Free' }));

    expect(await screen.findByText(/Coupons are only for paid courses/)).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    server.use(http.get('*/api/coupons', () => ok([])));
    await renderEditor('Coupons');

    expect(await screen.findByText(/No coupons yet/)).toBeInTheDocument();
  });

  it('adds a coupon with a suggested code', async () => {
    let body: Record<string, unknown> = {};
    let coupons: unknown[] = [];
    server.use(
      http.get('*/api/coupons/suggest', () => ok({ code: 'SUGGEST123' })),
      http.get('*/api/coupons', () => ok(coupons)),
      http.post('*/api/coupons', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        coupons = [COUPONS[1]];
        return ok({ _id: 'c1', code: 'SUGGEST123' });
      }),
    );
    const user = await renderEditor('Coupons');

    await user.click(await screen.findByRole('button', { name: 'Add coupon' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => {
      expect(within(dialog).getByLabelText(/Coupon code/)).toHaveValue('SUGGEST123');
    });
    await user.type(within(dialog).getByRole('textbox', { name: /^Discount/ }), '15');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Coupon created')).toBeInTheDocument();
    expect(body).toMatchObject({
      course: COURSE_ID,
      code: 'SUGGEST123',
      discountType: 'percent',
      value: 15,
      usageLimit: null,
    });
    expect(await screen.findByText('WELCOME500')).toBeInTheDocument();
  });

  it('checks the code length and the value, and shows the server message', async () => {
    server.use(
      http.get('*/api/coupons', () => ok([])),
      http.get('*/api/coupons/suggest', () => ok({ code: 'SUGGEST123' })),
      http.post('*/api/coupons', () => fail(409, 'This code is already used')),
    );
    const user = await renderEditor('Coupons');

    await user.click(await screen.findByRole('button', { name: 'Add coupon' }));
    const dialog = await screen.findByRole('dialog');
    const code = within(dialog).getByLabelText(/Coupon code/);
    await waitFor(() => {
      expect(code).toHaveValue('SUGGEST123');
    });
    await user.clear(code);
    await user.type(code, 'SHORT');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(
      await within(dialog).findByText('Use 6-20 letters, digits or dashes'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Enter an amount above 0')).toBeInTheDocument();

    await user.clear(code);
    await user.type(code, 'LONGENOUGH1');
    await user.type(within(dialog).getByRole('textbox', { name: /^Discount/ }), '10');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByText('This code is already used')).toBeInTheDocument();
  });

  it('switches a coupon off and deletes it after confirmation', async () => {
    let patched: unknown;
    let deleted = false;
    server.use(
      http.get('*/api/coupons', () => ok(deleted ? [COUPONS[0]] : COUPONS)),
      http.patch('*/api/coupons/c1', async ({ request }) => {
        patched = await request.json();
        return ok({ _id: 'c1', code: 'WELCOME500' });
      }),
      http.delete('*/api/coupons/c1', () => {
        deleted = true;
        return ok(undefined);
      }),
    );
    const user = await renderEditor('Coupons');

    await user.click(await screen.findByRole('button', { name: 'Actions for WELCOME500' }));
    await user.click(screen.getByRole('menuitem', { name: 'Switch off' }));
    expect(await screen.findByText('Coupon switched off')).toBeInTheDocument();
    expect(patched).toEqual({ isActive: false });

    await user.click(screen.getByRole('button', { name: 'Actions for WELCOME500' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );
    expect(await screen.findByText('Coupon deleted')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('WELCOME500')).not.toBeInTheDocument();
    });
  });
});

describe('Course editor: Settings and the header', () => {
  it('unpublishes a published course after confirmation', async () => {
    const statuses: unknown[] = [];
    server.use(
      http.put(`*/api/courses/${COURSE_ID}`, () => ok({ _id: COURSE_ID, status: 'Published' })),
      http.patch(`*/api/courses/${COURSE_ID}/status`, async ({ request }) => {
        statuses.push(await request.json());
        return ok({ _id: COURSE_ID, status: 'Draft' });
      }),
    );
    const user = await renderEditor(
      'Settings',
      makeCourse({ status: 'Published', firstPublishedAt: '2026-10-01T10:00:00.000Z' }),
    );

    expect(await screen.findByRole('combobox', { name: /Visibility/ })).toHaveTextContent('Public');
    expect(screen.getByText('The course is published')).toBeInTheDocument();
    expect(screen.getByText(/can never be deleted/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Unpublish course' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Unpublish course?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Unpublish course' }));

    await waitFor(() => {
      expect(statuses).toEqual([{ status: 'Draft' }]);
    });
  });

  it('does nothing when the unpublish confirmation is cancelled', async () => {
    let called = false;
    server.use(
      http.put(`*/api/courses/${COURSE_ID}`, () => {
        called = true;
        return ok({ _id: COURSE_ID });
      }),
    );
    const user = await renderEditor('Settings', makeCourse({ status: 'Published' }));

    await user.click(await screen.findByRole('button', { name: 'Unpublish course' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(called).toBe(false);
  });

  it('publishes a draft from Settings without asking', async () => {
    const statuses: unknown[] = [];
    server.use(
      http.put(`*/api/courses/${COURSE_ID}`, () => ok({ _id: COURSE_ID, status: 'Draft' })),
      http.patch(`*/api/courses/${COURSE_ID}/status`, async ({ request }) => {
        statuses.push(await request.json());
        return ok({ _id: COURSE_ID, status: 'Published' });
      }),
    );
    const user = await renderEditor('Settings', makeCourse({ status: 'Draft' }));

    expect(await screen.findByText('The course is not published')).toBeInTheDocument();
    expect(screen.queryByText(/can never be deleted/)).not.toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Publish' });
    await user.click(lastOf(buttons));

    await waitFor(() => {
      expect(statuses).toEqual([{ status: 'Published' }]);
    });
  });

  it('shows only "Save changes" in the header of a published course', async () => {
    await renderEditor('Basic Info', makeCourse({ status: 'Published' }));

    expect(await screen.findByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save Draft' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument();
  });

  it('shows Save Draft and Publish in the header of a draft', async () => {
    await renderEditor('Basic Info', makeCourse({ status: 'Draft' }));

    expect(await screen.findByRole('button', { name: 'Save Draft' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });
});
