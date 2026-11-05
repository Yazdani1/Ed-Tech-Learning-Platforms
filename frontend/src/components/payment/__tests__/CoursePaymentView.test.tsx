import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeCourse } from '@/components/browse/__tests__/browse-fixtures';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { CoursePaymentView } from '../CoursePaymentView';

const course = makeCourse({
  title: 'Full Stack',
  pricing: 'Paid',
  price: 800,
  listPrice: 1000,
  discountPrice: 800,
  teachers: [],
});
const free = makeCourse({ title: 'Free one' });

const courseHandlers = (target = course) => [
  http.get(`*/api/courses/${target._id}`, () => ok(target)),
  http.get(`*/api/study-curricula/course/${target._id}`, () =>
    ok([
      {
        _id: 'w1',
        title: 'Week',
        description: '<p>Plan</p>',
        lectures: [{ _id: 'l1', title: 'A', day: '2099-01-01', time: '18:00' }],
      },
    ]),
  ),
];
const asStudent = (enrolled: boolean) => [
  signedInAs(makeUser('Student')),
  http.get(`*/api/enrollments/${course._id}/check`, () =>
    ok({ isEnrolled: enrolled, enrolledAt: enrolled ? '2026-10-01T10:00:00Z' : null }),
  ),
];

describe('CoursePaymentView (/courses/[id]/payment)', () => {
  it('shows the methods and the order summary with the price from the course', async () => {
    server.use(...courseHandlers(), ...asStudent(false));
    renderWithProviders(<CoursePaymentView courseId={course._id} />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Complete Payment' }),
    ).toBeVisible();
    expect(screen.getByRole('radio', { name: /bKash/ })).toBeChecked();
    const summary = screen.getByRole('region', { name: 'Order summary' });
    expect(within(summary).getByText('Full Stack')).toBeInTheDocument();
    expect(within(summary).getByText('৳1,000')).toBeInTheDocument();
    expect(within(summary).getByText('- ৳200')).toBeInTheDocument();
    expect(within(summary).getByText('৳800')).toBeInTheDocument();
    expect(within(summary).getByText('Saving ৳200 (20% off)')).toBeInTheDocument();
    expect(await within(summary).findByText('1 week • 1 live session')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Select course' })).toHaveAttribute(
      'href',
      `/courses/${course._id}`,
    );
  });

  it('switches the payment method', async () => {
    server.use(...courseHandlers(), ...asStudent(false));
    renderWithProviders(<CoursePaymentView courseId={course._id} />);

    await userEvent.click(await screen.findByRole('radio', { name: /Cards & other/ }));
    expect(screen.getByRole('radio', { name: /Cards & other/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /bKash/ })).not.toBeChecked();
  });

  it('a student completes the page: a paid enrolment, then the way to the course', async () => {
    let body: unknown = null;
    let enrolled = false;
    server.use(
      ...courseHandlers(),
      signedInAs(makeUser('Student')),
      http.get(`*/api/enrollments/${course._id}/check`, () =>
        ok({ isEnrolled: enrolled, enrolledAt: enrolled ? '2026-10-01T10:00:00Z' : null }),
      ),
      http.post(`*/api/enrollments/${course._id}`, async ({ request }) => {
        body = await request.json();
        enrolled = true;
        return ok(undefined);
      }),
    );
    renderWithProviders(<CoursePaymentView courseId={course._id} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Complete payment' }));
    expect(await screen.findByRole('link', { name: 'Go to this course' })).toHaveAttribute(
      'href',
      `/student/courses/${course._id}/learn`,
    );
    expect(body).toEqual({ enrollmentType: 'paid' });
  });

  it('keeps the form and shows the error when enrolling fails; the button waits meanwhile', async () => {
    server.use(
      ...courseHandlers(),
      ...asStudent(false),
      http.post(`*/api/enrollments/${course._id}`, async () => {
        await delay(50);
        return fail(409, 'Already enrolled elsewhere');
      }),
    );
    renderWithProviders(<CoursePaymentView courseId={course._id} />);

    const pay = await screen.findByRole('button', { name: 'Complete payment' });
    await userEvent.click(pay);
    expect(await screen.findByRole('progressbar', { name: 'Loading...' })).toBeInTheDocument();
    expect(await screen.findByText('Already enrolled elsewhere')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Complete payment' })).toBeEnabled();
    expect(screen.getByRole('radio', { name: /bKash/ })).toBeInTheDocument();
  });

  it('shows the first teacher on the mentor card', async () => {
    const taught = { ...course, teachers: [{ _id: 't1', name: 'Ada Lovelace', expertise: [] }] };
    server.use(...courseHandlers(taught));
    renderWithProviders(<CoursePaymentView courseId={course._id} />);

    expect(await screen.findByText('Live mentorship support')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('a visitor signs in first and comes back to this page', async () => {
    server.use(...courseHandlers());
    renderWithProviders(<CoursePaymentView courseId={course._id} />);

    const link = await screen.findByRole('link', { name: 'Sign in to continue' });
    expect(link).toHaveAttribute(
      'href',
      `/auth/login?next=${encodeURIComponent(`/courses/${course._id}/payment`)}`,
    );
  });

  it.each(['Teacher', 'Moderator', 'Admin', 'Super Admin'] as const)(
    '%s cannot pay',
    async (role) => {
      server.use(...courseHandlers(), signedInAs(makeUser(role)));
      renderWithProviders(<CoursePaymentView courseId={course._id} />);

      expect(
        await screen.findByText('Only student accounts can enrol in a course.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Complete payment' })).toBeDisabled();
    },
  );

  it('has nothing to pay on a free course', async () => {
    server.use(...courseHandlers(free));
    renderWithProviders(<CoursePaymentView courseId={free._id} />);

    expect(await screen.findByRole('link', { name: 'View course' })).toHaveAttribute(
      'href',
      `/courses/${free._id}`,
    );
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('has nothing to pay for a student already enrolled', async () => {
    server.use(...courseHandlers(), ...asStudent(true));
    renderWithProviders(<CoursePaymentView courseId={course._id} />);

    expect(await screen.findByRole('link', { name: 'Go to this course' })).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('says "Course not found" for a missing course or a malformed id', async () => {
    server.use(http.get(`*/api/courses/${course._id}`, () => fail(404, 'Course not found')));
    const { unmount } = renderWithProviders(<CoursePaymentView courseId={course._id} />);
    expect(await screen.findByText('Course not found.')).toBeInTheDocument();
    unmount();

    renderWithProviders(<CoursePaymentView courseId="not-an-id" />);
    expect(await screen.findByText('Course not found.')).toBeInTheDocument();
  });

  it('shows other errors with a retry button', async () => {
    server.use(http.get(`*/api/courses/${course._id}`, () => fail(500, 'Server error')));
    renderWithProviders(<CoursePaymentView courseId={course._id} />);

    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
