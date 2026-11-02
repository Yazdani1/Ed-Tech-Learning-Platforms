import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { CourseDetailView } from '../detail/CourseDetailView';

import { makeCourse, PLANS } from './browse-fixtures';

import type { UserRole } from '@/types';

const CLOUD = 'https://res.cloudinary.com/test-cloud/image/upload';
const image = (name: string) => ({ url: `${CLOUD}/${name}.jpg`, publicId: name });
const YT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const extras = {
  toolsSection: {
    title: 'Stack we use',
    description: 'Everything you need',
    tools: [
      { _id: 'tool1', name: 'Node.js', logoUrl: `${CLOUD}/node.png` },
      null,
      { _id: 'tool2', name: 'React', logoUrl: `${CLOUD}/react.png` },
    ],
  },
  benefitsSection: {
    title: 'Perks',
    description: '',
    items: [
      { title: 'Lifetime access', description: 'Watch any time', icon: image('life') },
      { title: 'Certificate' },
    ],
  },
  projects: [
    {
      title: 'Todo app',
      description: 'Build a todo app',
      images: [image('shot1'), image('shot2')],
      liveDemoUrl: 'https://demo.example.com',
      videoUrl: YT,
    },
    {
      title: 'Blog',
      description: 'A blog',
      images: [],
      liveDemoUrl: '',
      videoUrl: 'https://vimeo.com/123',
    },
  ],
  audience: ['Beginners', 'Career changers'],
  successStories: [
    {
      title: 'Rahim, Engineer',
      description: 'Got a job',
      companyName: 'Acme',
      photo: image('rahim'),
      companyLogo: image('acme'),
    },
  ],
  faqs: [{ question: 'Is it live?', answer: 'Yes, twice a week.' }],
};

const paid = {
  pricing: 'Paid',
  price: 1000,
  listPrice: 1000,
  discountPrice: 800,
  discountPercent: 20,
};
const course = makeCourse({ title: 'Full Stack', ...paid, ...extras });
const empty = makeCourse({ title: 'Bare course' });

const handlersFor = (target = course) => [
  http.get(`*/api/courses/${target._id}`, () => ok(target)),
  http.get(`*/api/study-curricula/course/${target._id}`, () => ok([])),
  http.get(`*/api/quiz-bank/public/course/${target._id}`, () =>
    ok({ course: target, sections: [] }),
  ),
  http.get('*/api/subscription-plans', () => ok(PLANS)),
];

const renderPage = (target = course) =>
  renderWithProviders(
    <ConfirmProvider>
      <CourseDetailView courseId={target._id} />
    </ConfirmProvider>,
  );

const asRole = (role: UserRole, enrolled = false) => [
  signedInAs(makeUser(role)),
  http.get(`*/api/enrollments/${course._id}/check`, () =>
    ok({ isEnrolled: enrolled, enrolledAt: enrolled ? '2026-10-01T10:00:00Z' : null }),
  ),
  http.get('*/api/subscriptions/my', () => ok(null)),
];

describe('CourseDetailView sections', () => {
  it('shows tools (a deleted tool is dropped), what you get, audience and FAQ', async () => {
    server.use(...handlersFor());
    renderPage();

    const tools = await screen.findByRole('region', { name: 'Stack we use' });
    expect(within(tools).getByText('Everything you need')).toBeInTheDocument();
    expect(within(tools).getAllByRole('listitem')).toHaveLength(2);
    expect(within(tools).getByText('Node.js')).toBeInTheDocument();

    const perks = screen.getByRole('region', { name: 'Perks' });
    expect(within(perks).getByText('Lifetime access')).toBeInTheDocument();
    expect(within(perks).getByText('Certificate')).toBeInTheDocument();

    const audience = screen.getByRole('region', { name: 'Who this course is for' });
    expect(
      within(audience)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Beginners', 'Career changers']);

    const faq = screen.getByRole('region', { name: 'Frequently asked questions' });
    await userEvent.setup().click(within(faq).getByRole('button', { name: 'Is it live?' }));
    expect(await within(faq).findByText('Yes, twice a week.')).toBeVisible();
  });

  it('uses the default headings when a section has no title of its own', async () => {
    const target = makeCourse({
      toolsSection: { title: '', description: '', tools: extras.toolsSection.tools },
      benefitsSection: { title: '', description: '', items: extras.benefitsSection.items },
    });
    server.use(...handlersFor(target));
    renderPage(target);

    expect(await screen.findByRole('region', { name: 'Tools you will use' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'What you get' })).toBeInTheDocument();
  });

  it('shows success stories with their photo, company and story', async () => {
    server.use(...handlersFor());
    renderPage();

    const stories = await screen.findByRole('region', { name: 'Success stories' });
    expect(within(stories).getByText('Rahim, Engineer')).toBeInTheDocument();
    expect(within(stories).getByText('Got a job')).toBeInTheDocument();
    expect(within(stories).getByText('Acme')).toBeInTheDocument();
  });

  it('shows no extra section for a course that has none', async () => {
    server.use(...handlersFor(empty));
    renderPage(empty);

    await screen.findByRole('heading', { level: 1, name: 'Bare course' });
    for (const name of [
      'Tools you will use',
      'What you get',
      'Projects',
      'Who this course is for',
      'Success stories',
      'Frequently asked questions',
    ]) {
      expect(screen.queryByRole('region', { name })).not.toBeInTheDocument();
    }
  });

  it('opens a project in a right-side drawer: description, live demo, YouTube video, screenshots', async () => {
    server.use(...handlersFor());
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'View project: Todo app' }));
    const drawer = await screen.findByRole('dialog', { name: 'Todo app' });

    expect(within(drawer).getByText('Build a todo app')).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: /Live demo/ })).toHaveAttribute(
      'href',
      'https://demo.example.com',
    );
    expect(within(drawer).getByText('Intro video')).toBeInTheDocument();
    expect(
      within(drawer).queryByRole('link', { name: /Watch intro video/ }),
    ).not.toBeInTheDocument();
    expect(within(drawer).getAllByRole('img', { name: /Todo app screenshot/ })).toHaveLength(2);
  });

  it('a non-YouTube intro video is a link that opens in a new tab', async () => {
    server.use(...handlersFor());
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'View project: Blog' }));
    const drawer = await screen.findByRole('dialog', { name: 'Blog' });

    const link = within(drawer).getByRole('link', { name: /Watch intro video/ });
    expect(link).toHaveAttribute('href', 'https://vimeo.com/123');
    expect(link).toHaveAttribute('target', '_blank');
    expect(within(drawer).queryByRole('link', { name: /Live demo/ })).not.toBeInTheDocument();
    expect(within(drawer).queryByText('Screenshots')).not.toBeInTheDocument();
  });
});

describe('CourseDetailView buy bar', () => {
  it('shows a visitor the company phone, price, struck list price, discount and Enroll Now', async () => {
    server.use(
      ...handlersFor(),
      http.get('*/api/site-settings/public', () =>
        ok({
          hiddenPages: [],
          contact: { phone: '+880 1700-000000', whatsapp: '', email: '', address: '' },
        }),
      ),
    );
    renderPage();

    const bar = await screen.findByRole('complementary', { name: 'Enrol in this course' });
    expect(await within(bar).findByRole('link', { name: '+880 1700-000000' })).toHaveAttribute(
      'href',
      'tel:+8801700000000',
    );
    expect(within(bar).getByText(/Call Now:/)).toBeInTheDocument();
    expect(within(bar).getByText('৳800')).toBeInTheDocument();
    expect(within(bar).getByText('৳1,000')).toBeInTheDocument();
    expect(within(bar).getByText('20% discount applied')).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: 'Enroll Now' })).toBeInTheDocument();
  });

  it('leaves out "Call Now" when no phone is saved, and shows Free for a free course', async () => {
    server.use(...handlersFor(empty));
    renderPage(empty);

    const bar = await screen.findByRole('complementary', { name: 'Enrol in this course' });
    expect(within(bar).queryByText(/Call Now/)).not.toBeInTheDocument();
    expect(within(bar).getByText('Free')).toBeInTheDocument();
    expect(within(bar).queryByText(/discount applied/)).not.toBeInTheDocument();
  });

  it('Enroll Now scrolls to the enrolment card', async () => {
    server.use(...handlersFor());
    renderPage();
    const scrolled: string[] = [];
    Element.prototype.scrollIntoView = function scroll(this: Element) {
      scrolled.push(this.id);
    };
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Enroll Now' }));

    expect(scrolled).toEqual(['course-enrollment-card']);
  });

  it('is shown to a student who has not enrolled', async () => {
    server.use(...handlersFor(), ...asRole('Student', false));
    renderPage();

    expect(await screen.findByRole('button', { name: 'Enroll Now' })).toBeInTheDocument();
  });

  it.each<[UserRole, boolean]>([
    ['Student', true],
    ['Teacher', false],
    ['Admin', false],
    ['Super Admin', false],
  ])('is not shown to a %s (enrolled: %s)', async (role, enrolled) => {
    server.use(...handlersFor(), ...asRole(role, enrolled));
    renderPage();

    await screen.findByRole('heading', { level: 1, name: 'Full Stack' });
    // Let the sign-in and enrolment checks settle
    await screen.findByText(/Lifetime access/);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.queryByRole('button', { name: 'Enroll Now' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('complementary', { name: 'Enrol in this course' }),
    ).not.toBeInTheDocument();
  });
});
