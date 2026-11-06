import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { firstOf } from '@/test/pick';
import { renderWithProviders } from '@/test/render';

import { CourseDetailView } from '../detail/CourseDetailView';

import { makeCourse, PLANS } from './browse-fixtures';

const OFFER = {
  code: 'SAVE20NOW',
  source: 'course',
  price: 800,
  listPrice: 1000,
  discountAmount: 200,
  discountPercent: 20,
};
const paid = makeCourse({
  title: 'Full Stack',
  pricing: 'Paid',
  visibility: 'Public',
  price: 800,
  listPrice: 1000,
  discountPrice: 800,
  offer: OFFER,
  batchNumber: '1234',
  whatYouWillLearn: ['One', 'Two', 'Three', 'Four', 'Five', 'Six'],
  requirements: ['A Laptop / PC', 'Stable Internet'],
});

const handlersFor = (target = paid, views: string[] = []) => [
  http.get(`*/api/courses/${target._id}`, () => ok(target)),
  http.get(`*/api/study-curricula/course/${target._id}`, () => ok([])),
  http.get(`*/api/quiz-bank/public/course/${target._id}`, () =>
    ok({ course: target, sections: [] }),
  ),
  http.get('*/api/subscription-plans', () => ok(PLANS)),
  http.get('*/api/promos/active', () => ok([])),
  http.post(`*/api/courses/${target._id}/view`, () => {
    views.push(target._id);
    return ok(undefined);
  }),
];

const renderPage = (target = paid) =>
  renderWithProviders(
    <ConfirmProvider>
      <CourseDetailView courseId={target._id} />
    </ConfirmProvider>,
  );

const card = async () => firstOf(await screen.findAllByRole('complementary'));

describe('Course page: What you will learn', () => {
  it('shows the first four items and the rest behind "Show more"', async () => {
    server.use(...handlersFor());
    renderPage();
    const user = userEvent.setup();

    expect(await screen.findByText('Four')).toBeInTheDocument();
    expect(screen.queryByText('Five')).not.toBeInTheDocument();
    const more = screen.getByRole('button', { name: 'Show more' });
    expect(more).toHaveAttribute('aria-expanded', 'false');

    await user.click(more);
    expect(screen.getByText('Six')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.queryByText('Five')).not.toBeInTheDocument();
  });

  it('has no "Show more" for four items or fewer', async () => {
    const short = makeCourse({ title: 'Short', whatYouWillLearn: ['One', 'Two', 'Three', 'Four'] });
    server.use(...handlersFor(short));
    renderPage(short);

    expect(await screen.findByText('Four')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });
});

describe('Course page: requirements and batch', () => {
  it('shows the requirements band with a card per requirement', async () => {
    server.use(...handlersFor());
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Course Requirements' })).toBeInTheDocument();
    expect(screen.getByText('A Laptop / PC')).toBeInTheDocument();
    expect(screen.getByText('Stable Internet')).toBeInTheDocument();
  });

  it('shows the batch number on the banner', async () => {
    server.use(...handlersFor());
    renderPage();

    expect(await screen.findByText('Batch 1234')).toBeInTheDocument();
  });

  it('has no requirements band without requirements', async () => {
    const bare = makeCourse({ title: 'Bare', requirements: [] });
    server.use(...handlersFor(bare));
    renderPage(bare);

    await screen.findByRole('heading', { level: 1, name: 'Bare' });
    expect(screen.queryByRole('heading', { name: 'Course Requirements' })).not.toBeInTheDocument();
  });
});

describe('Course page: coupon in the purchase card', () => {
  it('pre-fills the course discount code and shows the price and the saving', async () => {
    server.use(...handlersFor());
    renderPage();

    const aside = await card();
    expect(await within(aside).findByText('SAVE20NOW')).toBeInTheDocument();
    expect(within(aside).getByText('SAVE20NOW applied: you save ৳200')).toBeInTheDocument();
    expect(within(aside).getByText('৳800')).toBeInTheDocument();
    expect(within(aside).getByText('৳1,000')).toBeInTheDocument();
  });

  it('removing the coupon shows the list price and the apply box', async () => {
    server.use(...handlersFor());
    renderPage();
    const user = userEvent.setup();

    const aside = await card();
    await user.click(await within(aside).findByRole('button', { name: 'Remove coupon' }));

    expect(within(aside).getByText('No coupon: you pay the list price.')).toBeInTheDocument();
    expect(within(aside).queryByText(/applied: you save/)).not.toBeInTheDocument();
    expect(within(aside).queryByText('৳800')).not.toBeInTheDocument();
    expect(within(aside).getByText('৳1,000')).toBeInTheDocument();
  });

  it('applies another code that the server accepts and shows the new price', async () => {
    let asked = '';
    server.use(
      http.get('*/api/coupons/check', ({ request }) => {
        asked = new URL(request.url).searchParams.get('code') ?? '';
        return ok({
          code: 'HALFPRICE50',
          source: 'coupon',
          price: 500,
          listPrice: 1000,
          discountAmount: 500,
          discountPercent: 50,
        });
      }),
      ...handlersFor(),
    );
    renderPage();
    const user = userEvent.setup();

    const aside = await card();
    await user.click(await within(aside).findByRole('button', { name: 'Remove coupon' }));
    await user.type(within(aside).getByLabelText('Coupon code'), 'halfprice50');
    await user.click(within(aside).getByRole('button', { name: 'Apply' }));

    expect(
      await within(aside).findByText('HALFPRICE50 applied: you save ৳500'),
    ).toBeInTheDocument();
    expect(asked).toBe('halfprice50');
    expect(within(aside).getByText('৳500')).toBeInTheDocument();
  });

  it('shows the server message for a code that is not valid', async () => {
    server.use(
      http.get('*/api/coupons/check', () => fail(400, 'This coupon is not valid for this course')),
      ...handlersFor(),
    );
    renderPage();
    const user = userEvent.setup();

    const aside = await card();
    await user.click(await within(aside).findByRole('button', { name: 'Remove coupon' }));
    await user.type(within(aside).getByLabelText('Coupon code'), 'WRONGCODE1');
    await user.click(within(aside).getByRole('button', { name: 'Apply' }));

    expect(
      await within(aside).findByText('This coupon is not valid for this course'),
    ).toBeInTheDocument();
  });

  it('has no coupon box on a free course', async () => {
    const free = makeCourse({ title: 'Free one' });
    server.use(...handlersFor(free));
    renderPage(free);

    await screen.findByRole('heading', { level: 1, name: 'Free one' });
    expect(screen.queryByLabelText('Coupon code')).not.toBeInTheDocument();
  });

  it('keeps a removed coupon removed on the payment page of the same tab', async () => {
    server.use(...handlersFor());
    renderPage();
    const user = userEvent.setup();

    const aside = await card();
    await user.click(await within(aside).findByRole('button', { name: 'Remove coupon' }));

    expect(window.sessionStorage.getItem(`coupon:${paid._id}`)).toBe('');
  });
});

describe('Course page: view count', () => {
  it('records one view when a public published course opens', async () => {
    const views: string[] = [];
    server.use(...handlersFor(paid, views));
    renderPage();

    await waitFor(() => {
      expect(views).toEqual([paid._id]);
    });
  });

  it('does not record a view for a draft course (staff preview)', async () => {
    const views: string[] = [];
    const draft = makeCourse({ title: 'Draft one', status: 'Draft' });
    server.use(...handlersFor(draft, views), signedInAs(makeUser('Admin')));
    renderPage(draft);

    await screen.findByRole('heading', { level: 1, name: 'Draft one' });
    expect(views).toEqual([]);
  });

  it('does not bother the visitor when counting the view fails', async () => {
    server.use(
      http.post(`*/api/courses/${paid._id}/view`, () => fail(500, 'Counter down')),
      ...handlersFor(),
    );
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Full Stack' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Counter down')).not.toBeInTheDocument();
  });
});
