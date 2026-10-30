import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { CourseDetailView } from '../detail/CourseDetailView';

import { makeCourse, PLANS } from './browse-fixtures';

import type { UserRole } from '@/types';

const YT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const course = makeCourse({
  title: 'Intro to TypeScript',
  sections: [
    {
      _id: 'sec1',
      title: 'Getting started',
      lectures: [
        { _id: 'lec1', title: 'Welcome', isPreview: true, videoUrl: YT, duration: 125 },
        { _id: 'lec2', title: 'Locked lesson', isPreview: false, duration: 600 },
      ],
    },
  ],
});
const WEEK = {
  _id: 'week1',
  title: 'Week one plan',
  description: '<p>Live <script>alert(1)</script>sessions</p>',
  lectures: [{ _id: 'lc1', title: 'Kick-off', day: '2026-11-02', time: '18:30' }],
};

/** The course page's reads; tests add the role-specific ones. */
const courseHandlers = (overrides: { course?: unknown } = {}) => [
  http.get(`*/api/courses/${course._id}`, () => ok(overrides.course ?? course)),
  http.get(`*/api/study-curricula/course/${course._id}`, () => ok([WEEK])),
  http.get(`*/api/quiz-bank/public/course/${course._id}`, () =>
    ok({
      sections: [
        {
          _id: 'qs1',
          title: 'Warm-up',
          isFreePreview: true,
          banks: [{ _id: 'qb1', title: 'Basics quiz' }],
        },
      ],
    }),
  ),
  http.get('*/api/subscription-plans', () => ok(PLANS)),
];

const studentHandlers = (enrolled: boolean, subscription: unknown = null) => [
  signedInAs(makeUser('Student')),
  http.get(`*/api/enrollments/${course._id}/check`, () =>
    ok({ isEnrolled: enrolled, enrolledAt: enrolled ? '2026-10-01T10:00:00Z' : null }),
  ),
  http.get('*/api/subscriptions/my', () => ok(subscription)),
];

const renderPage = () =>
  renderWithProviders(
    <ConfirmProvider>
      <CourseDetailView courseId={course._id} />
    </ConfirmProvider>,
  );

describe('CourseDetailView (/courses/[id])', () => {
  it('shows the course to a visitor with sign-up and sign-in links', async () => {
    server.use(...courseHandlers());
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Intro to TypeScript' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Types')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your Instructors' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Enroll Free' })).toHaveAttribute(
      'href',
      '/auth/register',
    );
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/auth/login');
    expect(screen.queryByRole('link', { name: 'Edit Course' })).not.toBeInTheDocument();
  });

  it('says "Course not found" for a missing, draft or private course', async () => {
    server.use(http.get(`*/api/courses/${course._id}`, () => fail(404, 'Course not found')));
    renderPage();
    expect(await screen.findByText('Course not found.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/');
  });

  it('says "Course not found" for a malformed id without asking the server', async () => {
    let asked = false;
    server.use(
      http.get('*/api/courses/:id', () => {
        asked = true;
        return fail(400, 'Invalid id');
      }),
    );
    renderWithProviders(
      <ConfirmProvider>
        <CourseDetailView courseId="not-a-course-id" />
      </ConfirmProvider>,
    );
    expect(await screen.findByText('Course not found.')).toBeInTheDocument();
    expect(asked).toBe(false);
  });

  it('treats a 400 answer (malformed id on the server) as "Course not found"', async () => {
    server.use(http.get(`*/api/courses/${course._id}`, () => fail(400, 'Invalid course id')));
    renderPage();
    expect(await screen.findByText('Course not found.')).toBeInTheDocument();
  });

  it('shows other errors with a retry button', async () => {
    server.use(http.get(`*/api/courses/${course._id}`, () => fail(500, 'Server error')));
    renderPage();
    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('lists sections and plays a free preview in the YouTube player', async () => {
    server.use(...courseHandlers());
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: /Getting started/ }));
    expect(screen.getByText('Locked lesson')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Welcome/ }));
    const dialog = await screen.findByRole('dialog');
    const player = within(dialog).getByTitle('Welcome');
    expect(player).toHaveAttribute(
      'src',
      expect.stringContaining('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'),
    );
  });

  it('switches to the live classes (sanitised) and the free quizzes', async () => {
    server.use(...courseHandlers());
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Live Class' }));
    await userEvent.click(screen.getByRole('button', { name: /Week one plan/ }));
    expect(await screen.findByText('Kick-off')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Quizzes' }));
    expect(screen.getByRole('link', { name: /Basics quiz/ })).toHaveAttribute(
      'href',
      `/practice-quiz?courseId=${course._id}&bankId=qb1`,
    );
  });

  it('a student enrols in a free course', async () => {
    let body: unknown = 'not called';
    server.use(
      ...courseHandlers(),
      ...studentHandlers(false),
      http.post(`*/api/enrollments/${course._id}`, async ({ request }) => {
        body = await request.json();
        return ok(undefined, { message: 'Enrolled successfully' });
      }),
    );
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Enroll Now – Free' }));
    expect(await screen.findByText('Enrolled successfully!')).toBeInTheDocument();
    expect(body).toEqual({});
  });

  it('buying a paid course directly asks for a paid enrolment even with a subscription option', async () => {
    const paid = {
      ...course,
      pricing: 'Paid',
      listPrice: 1000,
      discountPrice: 800,
      price: 800,
      includedInSubscription: true,
      allowedSubscriptionPlans: ['Premium'],
    };
    let body: unknown = null;
    server.use(
      ...courseHandlers({ course: paid }),
      ...studentHandlers(false),
      http.post(`*/api/enrollments/${course._id}`, async ({ request }) => {
        body = await request.json();
        return ok(undefined);
      }),
    );
    renderPage();

    expect(await screen.findByText('From ৳600 /month')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: /Buy this course/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Buy Now - ৳800' }));
    await waitFor(() => {
      expect(body).toEqual({ enrollmentType: 'paid' });
    });
  });

  it('a student whose plan includes the course enrols with the subscription', async () => {
    const inPlan = {
      ...course,
      pricing: 'Paid',
      listPrice: 1000,
      includedInSubscription: true,
      allowedSubscriptionPlans: ['Premium'],
    };
    server.use(
      ...courseHandlers({ course: inPlan }),
      ...studentHandlers(false, {
        _id: '690000000000000000000001',
        plan: 'Premium',
        endDate: '2099-01-01T00:00:00Z',
        status: 'Active',
      }),
    );
    renderPage();
    expect(
      await screen.findByRole('button', { name: 'Enroll with Subscription' }),
    ).toBeInTheDocument();
  });

  it('a student on another plan is offered an upgrade', async () => {
    const inPlan = {
      ...course,
      pricing: 'Paid',
      listPrice: 1000,
      includedInSubscription: true,
      allowedSubscriptionPlans: ['Premium'],
    };
    server.use(
      ...courseHandlers({ course: inPlan }),
      ...studentHandlers(false, {
        _id: '690000000000000000000001',
        plan: 'Basic',
        endDate: '2099-01-01T00:00:00Z',
        status: 'Active',
      }),
    );
    renderPage();
    expect(await screen.findByText('Plan upgrade required to enroll free')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Upgrade Subscription' })).toHaveAttribute(
      'href',
      '/pricing',
    );
  });

  it('an enrolled student goes to the course player and can leave the course', async () => {
    let deleted = false;
    server.use(
      ...courseHandlers(),
      ...studentHandlers(true),
      http.delete(`*/api/enrollments/${course._id}`, () => {
        deleted = true;
        return ok(undefined);
      }),
    );
    renderPage();

    expect(await screen.findByRole('link', { name: 'Go to this course' })).toHaveAttribute(
      'href',
      `/student/courses/${course._id}/learn`,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Leave this course' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Leave this course' }));
    expect(await screen.findByText('You left the course')).toBeInTheDocument();
    expect(deleted).toBe(true);
  });

  it.each<[UserRole, boolean]>([
    ['Super Admin', true],
    ['Admin', true],
    ['Moderator', false],
  ])('%s sees the staff actions (Edit Course: %s)', async (role, canEdit) => {
    server.use(...courseHandlers(), signedInAs(makeUser(role)));
    renderPage();

    expect(await screen.findByRole('link', { name: 'Student View' })).toHaveAttribute(
      'href',
      `/admin/courses/${course._id}/learn`,
    );
    expect(screen.queryAllByRole('link', { name: 'Edit Course' })).toHaveLength(canEdit ? 1 : 0);
    expect(screen.queryByRole('link', { name: 'Sign In' })).not.toBeInTheDocument();
  });

  it('a teacher sees the price without enrol buttons', async () => {
    server.use(...courseHandlers(), signedInAs(makeUser('Teacher')));
    renderPage();
    expect(await screen.findByText('Enroll for free')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Enroll Now/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign In' })).not.toBeInTheDocument();
  });
});
