import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import { makeEnrolledCourse } from '@/components/student/__tests__/fixtures';

import { HomePage } from '../home/HomePage';

import { browsePage, makeCategory, makeCourse } from './public-fixtures';

const PROGRAMMING = makeCategory();
const DESIGN = makeCategory({ _id: '650000000000000000000002', name: 'Design' });
const RECORDED = makeCategory({
  _id: '650000000000000000000009',
  name: 'Recorded',
  description: 'Learn at your own pace',
});
/** A course type without paid courses: it gets no box */
const BOOTCAMP = makeCategory({ _id: '650000000000000000000010', name: 'Bootcamp' });
const MANY_COURSES = 31;

const paidCourse = makeCourse({ startDate: '2099-12-05T04:00:00.000Z' });
const freeCourse = makeCourse({
  _id: '660000000000000000000002',
  title: 'Free HTML Live',
  pricing: 'Free',
  price: 0,
  listPrice: 0,
  discountPrice: 0,
});
/** Category counts of the free box and of the Recorded box (paid courses per course type) */
const FREE_COUNTS = { Free: { [PROGRAMMING._id]: 1, [DESIGN._id]: 2 } };
const TYPE_COUNTS = { [RECORDED._id]: { total: 1, categories: { [PROGRAMMING._id]: 1 } } };
const CARD_NAME = /^Course Start Date.*TypeScript Basics/;

/** Answers browse requests by box (pricing=Free or courseTypes), recording every query string. */
const browseHandler = (requests: URLSearchParams[] = [], freeTotal = 1) =>
  http.get('*/api/courses/browse', ({ request }) => {
    const params = new URL(request.url).searchParams;
    requests.push(params);
    if (params.get('pricing') === 'Free') {
      const page = Number(params.get('page') ?? '1');
      return browsePage([freeCourse], page, freeTotal, FREE_COUNTS, TYPE_COUNTS);
    }
    if (params.get('courseTypes')) return browsePage([paidCourse], 1, 1, FREE_COUNTS, TYPE_COUNTS);
    return browsePage([], 1, 0, FREE_COUNTS, TYPE_COUNTS);
  });

const section = async (name: string): Promise<HTMLElement> => {
  const heading = await screen.findByRole('heading', { name });
  const box = heading.closest('section');
  if (!box) throw new Error(`no section for ${name}`);
  return box;
};

describe('HomePage', () => {
  beforeEach(() => {
    server.use(
      http.get('*/api/home-hero-posts/public', () => ok([])),
      http.get('*/api/categories', () => ok([PROGRAMMING, DESIGN])),
      http.get('*/api/course-types', () => ok([RECORDED, BOOTCAMP])),
      browseHandler(),
    );
  });

  it('shows one box per course type with paid courses (its name and description), then the free courses', async () => {
    const requests: URLSearchParams[] = [];
    server.use(browseHandler(requests));
    renderWithProviders(<HomePage />);

    const recorded = await section('Recorded');
    expect(within(recorded).getByText('Learn at your own pace')).toBeInTheDocument();
    expect(await within(recorded).findByRole('link', { name: CARD_NAME })).toBeInTheDocument();
    expect(within(recorded).queryByText('Free HTML Live')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Bootcamp' })).not.toBeInTheDocument();

    const free = await section('Free Courses');
    expect(await within(free).findByText('Free HTML Live')).toBeInTheDocument();
    expect(within(free).queryByText('TypeScript Basics')).not.toBeInTheDocument();

    const typeRequest = requests.find((params) => params.get('courseTypes') === RECORDED._id);
    expect(typeRequest?.get('pricing')).toBe('Paid');
    expect(requests.some((params) => params.get('liveOnly') !== null)).toBe(false);
    // Page buttons scroll back to these anchors
    expect(recorded.id).toBe(`home-type-${RECORDED._id}`);
    expect(free.id).toBe('home-free-courses');
  });

  it('lists only the categories with courses in that box, with their course counts', async () => {
    renderWithProviders(<HomePage />);

    const recorded = await section('Recorded');
    const typeGroup = await within(recorded).findByRole('group', { name: /Recorded/ });
    expect(within(typeGroup).getByRole('button', { name: /Programming/ })).toHaveTextContent(
      /Programming\s*1$/,
    );
    expect(within(typeGroup).queryByRole('button', { name: /Design/ })).not.toBeInTheDocument();

    const free = await section('Free Courses');
    const freeGroup = await within(free).findByRole('group');
    expect(within(freeGroup).getByRole('button', { name: /All/ })).toHaveTextContent(/^All\s*3$/);
    expect(within(freeGroup).getByRole('button', { name: /Design/ })).toHaveTextContent(
      /Design\s*2$/,
    );
  });

  it('filters a box by the picked category, and "All" clears it in that box only', async () => {
    const requests: URLSearchParams[] = [];
    server.use(browseHandler(requests));
    renderWithProviders(<HomePage />);
    const user = userEvent.setup();

    const free = await section('Free Courses');
    const design = await within(free).findByRole('button', { name: /Design/ });
    await user.click(design);
    expect(design).toHaveAttribute('aria-pressed', 'true');
    expect(
      requests.some(
        (params) => params.get('pricing') === 'Free' && params.get('categories') === DESIGN._id,
      ),
    ).toBe(true);

    requests.length = 0;
    await user.click(within(free).getByRole('button', { name: /All/ }));
    await waitFor(() => {
      expect(requests.some((params) => params.get('pricing') === 'Free')).toBe(true);
    });
    expect(requests.every((params) => params.get('categories') === null)).toBe(true);
    const recorded = await section('Recorded');
    expect(within(recorded).getByRole('button', { name: /All/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('pages a box only when it has more than 30 courses, and goes back to page 1 on a new category', async () => {
    const requests: URLSearchParams[] = [];
    server.use(browseHandler(requests, MANY_COURSES));
    // jsdom has no scrolling
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderWithProviders(<HomePage />);
    const user = userEvent.setup();
    const freeRequests = () => requests.filter((params) => params.get('pricing') === 'Free');

    const recorded = await section('Recorded');
    await within(recorded).findByRole('link', { name: CARD_NAME });
    expect(within(recorded).queryByRole('navigation')).not.toBeInTheDocument();

    const free = await section('Free Courses');
    await user.click(await within(free).findByRole('button', { name: 'Go to page 2' }));
    await waitFor(() => {
      expect(freeRequests().at(-1)?.get('page')).toBe('2');
    });
    expect(scrollIntoView).toHaveBeenCalled();

    await user.click(within(free).getByRole('button', { name: /Design/ }));
    await waitFor(() => {
      expect(freeRequests().at(-1)?.get('categories')).toBe(DESIGN._id);
    });
    expect(freeRequests().at(-1)?.get('page')).toBe('1');
  });

  it('shows the card with start date, price and "See Details", without course type, teacher or category', async () => {
    renderWithProviders(<HomePage />);

    const card = await screen.findByRole('link', { name: CARD_NAME });
    expect(card).toHaveAttribute('href', `/courses/${paidCourse._id}`);
    expect(within(card).getByText(/^Dec \d, 2099$/)).toBeInTheDocument();
    expect(within(card).getByText('৳800')).toBeInTheDocument();
    expect(within(card).getByText('৳1,000')).toBeInTheDocument();
    expect(within(card).getByText('20% off')).toBeInTheDocument();
    expect(within(card).getByText('Save ৳200')).toBeInTheDocument();
    expect(within(card).queryByText('Recorded')).not.toBeInTheDocument();
    expect(within(card).queryByText('Ada Lovelace')).not.toBeInTheDocument();
    expect(within(card).queryByText('Programming')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See details of TypeScript Basics' })).toHaveAttribute(
      'href',
      `/courses/${paidCourse._id}`,
    );
  });

  it('says when a course has no start date yet', async () => {
    renderWithProviders(<HomePage />);

    const free = await section('Free Courses');
    expect(await within(free).findByText('To be announced')).toBeInTheDocument();
  });

  it('shows only the free box (with its empty text) when no course type has paid courses', async () => {
    server.use(http.get('*/api/courses/browse', () => browsePage([])));
    renderWithProviders(<HomePage />);

    expect(await screen.findByText('No free courses yet.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Recorded' })).not.toBeInTheDocument();
  });

  it('shows the error with a retry when courses cannot load', async () => {
    server.use(http.get('*/api/courses/browse', () => fail(500, 'Server error')));
    renderWithProviders(<HomePage />);

    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('no longer shows the learning paths, the instructors band or a Live Courses box', async () => {
    renderWithProviders(<HomePage />);

    await screen.findByRole('heading', { name: 'Recorded' });
    expect(screen.queryByText('Learn what matches your ambition')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Our Instructors' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Live Courses' })).not.toBeInTheDocument();
  });

  it('offers "Continue Learning" on courses a signed-in Student is enrolled in', async () => {
    server.use(
      signedInAs(makeUser('Student')),
      http.get('*/api/enrollments', () =>
        ok([makeEnrolledCourse({ _id: paidCourse._id, title: paidCourse.title })]),
      ),
    );
    renderWithProviders(<HomePage />);

    expect(await screen.findByRole('link', { name: 'Continue Learning' })).toHaveAttribute(
      'href',
      `/student/courses/${paidCourse._id}/learn`,
    );
  });

  it('does not ask for enrolments when the visitor is not a Student', async () => {
    let enrolmentsAsked = false;
    server.use(
      signedInAs(makeUser('Admin')),
      http.get('*/api/enrollments', () => {
        enrolmentsAsked = true;
        return ok([]);
      }),
    );
    renderWithProviders(<HomePage />);

    await screen.findByRole('link', { name: CARD_NAME });
    expect(enrolmentsAsked).toBe(false);
    expect(screen.queryByRole('link', { name: 'Continue Learning' })).not.toBeInTheDocument();
  });

  describe('showcase slider', () => {
    const posts = [
      { _id: 'p1', imageUrl: 'https://res.cloudinary.com/demo/one.jpg', order: 0 },
      { _id: 'p2', imageUrl: 'https://res.cloudinary.com/demo/two.jpg', order: 1 },
    ];

    it('has no pause / play button; a dot shows its image', async () => {
      server.use(http.get('*/api/home-hero-posts/public', () => ok(posts)));
      renderWithProviders(<HomePage />);
      const user = userEvent.setup();

      await user.click(await screen.findByRole('button', { name: 'Show header image 2' }));
      expect(screen.getByRole('button', { name: 'Show header image 2' })).toHaveAttribute(
        'aria-current',
        'true',
      );
      expect(screen.queryByRole('button', { name: /slideshow/i })).not.toBeInTheDocument();
    });

    it('shows the title and description of a slide that has them, and no caption box otherwise', async () => {
      server.use(
        http.get('*/api/home-hero-posts/public', () =>
          ok([
            { ...posts[0], title: 'Autumn admissions', description: 'Join before 30 November' },
            posts[1],
          ]),
        ),
      );
      renderWithProviders(<HomePage />);

      expect(await screen.findByText('Autumn admissions')).toBeInTheDocument();
      expect(screen.getByText('Join before 30 November')).toBeInTheDocument();
      // Only the one captioned slide has text; the plain slide adds none
      expect(screen.getAllByText(/Autumn|Join before/)).toHaveLength(2);
    });

    it('has previous / next arrows for several images and none for a single image', async () => {
      server.use(http.get('*/api/home-hero-posts/public', () => ok(posts)));
      const first = renderWithProviders(<HomePage />);
      expect(
        await screen.findByRole('button', { name: 'Previous header image' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next header image' })).toBeInTheDocument();
      first.unmount();

      server.use(http.get('*/api/home-hero-posts/public', () => ok([posts[0]])));
      renderWithProviders(<HomePage />);
      await screen.findByRole('heading', { name: 'Recorded' });
      expect(screen.queryByRole('button', { name: 'Next header image' })).not.toBeInTheDocument();
    });
  });
});
