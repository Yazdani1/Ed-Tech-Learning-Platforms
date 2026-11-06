import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { setLocation } from '@/test/next-navigation';
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
      course,
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
    setLocation(`/courses/${course._id}`);
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Intro to TypeScript' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Types')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Instructors & Mentors' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Enroll Free' })).toHaveAttribute(
      'href',
      `/courses/${course._id}?auth=register&next=${encodeURIComponent(`/courses/${course._id}`)}`,
    );
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute(
      'href',
      `/courses/${course._id}?auth=login&next=${encodeURIComponent(`/courses/${course._id}`)}`,
    );
    expect(screen.queryByRole('link', { name: 'Edit Course' })).not.toBeInTheDocument();
    // The banner shows no status and no "Created by" line
    expect(screen.queryByText('Published')).not.toBeInTheDocument();
    expect(screen.queryByText('Created by')).not.toBeInTheDocument();
  });

  it('shows only the curriculum buttons of the lists that have content', async () => {
    server.use(
      ...courseHandlers(),
      http.get(`*/api/study-curricula/course/${course._id}`, () => ok([])),
      http.get(`*/api/quiz-bank/public/course/${course._id}`, () => ok({ course, sections: [] })),
    );
    renderPage();

    expect(await screen.findByRole('button', { name: 'Recorded Lectures' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('button', { name: 'Live Class' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quizzes' })).not.toBeInTheDocument();
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

    // Live classes are listed first; the recorded lectures are one button away
    await userEvent.click(await screen.findByRole('button', { name: 'Recorded Lectures' }));
    await userEvent.click(screen.getByRole('button', { name: /Getting started/ }));
    expect(screen.getByText('Locked lesson')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Welcome/ }));
    const dialog = await screen.findByRole('dialog');
    const player = within(dialog).getByTitle('Welcome');
    expect(player).toHaveAttribute(
      'src',
      expect.stringContaining('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'),
    );
  });

  it('opens the curriculum on the live classes (sanitised), then the free quizzes', async () => {
    server.use(...courseHandlers());
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Curriculum' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Live Class' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
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

  it('buying a paid course directly goes to the payment page even with a subscription option', async () => {
    const paid = {
      ...course,
      pricing: 'Paid',
      listPrice: 1000,
      discountPrice: 800,
      price: 800,
      includedInSubscription: true,
      allowedSubscriptionPlans: ['Premium'],
    };
    server.use(...courseHandlers({ course: paid }), ...studentHandlers(false));
    renderPage();

    expect(await screen.findByText('From ৳600 /month')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: /Buy this course/ }));
    const card = screen.getByRole('radiogroup', { name: 'How to get this course' });
    expect(within(card).getByRole('link', { name: 'Enroll Now' })).toHaveAttribute(
      'href',
      `/courses/${course._id}/payment`,
    );
  });

  it('shows the start date, the next live class and the end date, each only when it exists', async () => {
    server.use(
      http.get(`*/api/study-curricula/course/${course._id}`, () =>
        ok([
          {
            ...WEEK,
            lectures: [{ _id: 'lc1', title: 'Kick-off', day: '2099-11-02', time: '18:30' }],
          },
        ]),
      ),
      ...courseHandlers({
        course: { ...course, startDate: '2099-12-22T12:00:00Z', endDate: '2100-01-22T12:00:00Z' },
      }),
    );
    const { unmount } = renderPage();
    expect(await screen.findByText('Class start date')).toBeInTheDocument();
    expect(await screen.findByText('Live class time')).toBeInTheDocument();
    expect(screen.getByText('Course end date')).toBeInTheDocument();
    unmount();

    server.use(
      http.get(`*/api/study-curricula/course/${course._id}`, () => ok([])),
      ...courseHandlers(),
    );
    renderPage();
    await screen.findByRole('heading', { level: 1, name: 'Intro to TypeScript' });
    expect(screen.queryByText('Class start date')).not.toBeInTheDocument();
    expect(screen.queryByText('Live class time')).not.toBeInTheDocument();
  });

  it('folds a long About text: Show more opens it, Show less folds it again; a short one has no button', async () => {
    const long = `<p>${'Full stack development with AI. '.repeat(20)}</p>`;
    // jsdom has no layout: long text measures 400 px, short text 40 px; the size watcher does nothing
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    const height = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockImplementation(function measured(this: HTMLElement) {
        return this.textContent.length > 300 ? 400 : 40;
      });
    server.use(...courseHandlers({ course: { ...course, description: long } }));
    const { unmount } = renderPage();
    const user = userEvent.setup();

    const more = await screen.findByRole('button', { name: 'Show more' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await user.click(more);
    const less = screen.getByRole('button', { name: 'Show less' });
    expect(less).toHaveAttribute('aria-expanded', 'true');
    await user.click(less);
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
    unmount();

    server.use(...courseHandlers());
    renderPage();
    await screen.findByRole('heading', { name: 'About this course' });
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
    height.mockRestore();
    vi.unstubAllGlobals();
  });

  it('shows each instructor with initials when there is no Cloudinary photo, the main skill as a badge', async () => {
    server.use(
      ...courseHandlers({
        course: {
          ...course,
          teachers: [
            {
              _id: 't1',
              name: 'Jane Doe',
              bio: 'Builds LLM tools.',
              expertise: ['Lead AI Instructor', 'Google Cloud'],
            },
            { _id: 't2', name: 'Karim', profileImage: 'https://evil.example/x.png', expertise: [] },
          ],
        },
      }),
    );
    renderPage();

    const section = (await screen.findByRole('heading', { name: 'Instructors & Mentors' })).closest(
      'section',
    );
    if (!section) throw new Error('no instructors section');
    const box = within(section);
    expect(box.getByText('JD')).toBeInTheDocument();
    expect(box.getByText('K')).toBeInTheDocument();
    expect(box.getByText('Lead AI Instructor')).toBeInTheDocument();
    expect(box.getByText('Google Cloud')).toBeInTheDocument();
    expect(box.getByText('Builds LLM tools.')).toBeInTheDocument();
    // No skills: the plain badge
    expect(box.getByText('Instructor')).toBeInTheDocument();
    expect(section.querySelector('img[src*="evil.example"]')).toBeNull();
  });

  it('shows the course sections in the agreed order', async () => {
    server.use(
      ...courseHandlers({
        course: {
          ...course,
          description: '<p>About text</p>',
          whatYouWillLearn: ['Types'],
          requirements: ['A laptop'],
          toolsSection: {
            title: '',
            description: '',
            tools: [{ _id: 't1', name: 'Node', logoUrl: '' }],
          },
          projects: [{ title: 'Blog', description: '', images: [], liveDemoUrl: '', videoUrl: '' }],
          benefitsSection: { title: '', description: '', items: [{ title: 'Support' }] },
          successStories: [{ title: 'Rahim', description: '', companyName: '' }],
          faqs: [{ question: 'Live?', answer: 'Yes' }],
        },
      }),
    );
    renderPage();

    await screen.findByRole('heading', { name: 'Frequently Asked Questions' });
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      'About this course',
      "What you'll learn",
      'Curriculum',
      'Instructors & Mentors',
      'Tech you will learn',
      'Projects',
      'What will you get from this course',
      'Course Requirements',
      'Success stories',
      'Frequently Asked Questions',
    ]);
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

  it('an enrolled student goes to the course player and cannot remove the enrolment', async () => {
    server.use(...courseHandlers(), ...studentHandlers(true));
    renderPage();

    expect(await screen.findByRole('link', { name: 'Go to this course' })).toHaveAttribute(
      'href',
      `/student/courses/${course._id}/learn`,
    );
    expect(screen.queryByRole('button', { name: 'Leave this course' })).not.toBeInTheDocument();
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
