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
const MANY_COURSES = 31;

const paidCourse = makeCourse({ startDate: '2026-12-05T04:00:00.000Z' });
const freeCourse = makeCourse({
  _id: '660000000000000000000002',
  title: 'Free HTML Live',
  pricing: 'Free',
  price: 0,
  listPrice: 0,
  discountPrice: 0,
});
/** Category counts of the Live section (filterCounts.liveCategories) and of the Free section */
const LIVE_COUNTS = { [PROGRAMMING._id]: 1 };
const FREE_COUNTS = { Free: { [PROGRAMMING._id]: 1, [DESIGN._id]: 2 } };

/** Answers browse requests by section (liveOnly or pricing=Free), recording every query string. */
const browseHandler = (requests: URLSearchParams[] = []) =>
  http.get('*/api/courses/browse', ({ request }) => {
    const params = new URL(request.url).searchParams;
    requests.push(params);
    return params.get('pricing') === 'Free'
      ? browsePage([freeCourse], 1, 1, FREE_COUNTS)
      : browsePage([paidCourse], 1, 1, {}, LIVE_COUNTS);
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
      browseHandler(),
    );
  });

  it('shows a Live Courses section (live course types) and a free section with only free ones', async () => {
    const requests: URLSearchParams[] = [];
    server.use(browseHandler(requests));
    renderWithProviders(<HomePage />);

    const paid = await section('Live Courses');
    expect(
      await within(paid).findByRole('link', { name: /^Recorded TypeScript Basics/ }),
    ).toBeInTheDocument();
    expect(within(paid).queryByText('Free HTML Live')).not.toBeInTheDocument();

    const free = await section('Upcoming Free Live Courses');
    expect(await within(free).findByText('Free HTML Live')).toBeInTheDocument();
    expect(within(free).queryByText('TypeScript Basics')).not.toBeInTheDocument();

    const live = requests.filter((params) => params.get('liveOnly') === 'true');
    const freeRequests = requests.filter((params) => params.get('pricing') === 'Free');
    expect(live).toHaveLength(1);
    expect(live[0]?.get('pricing')).toBeNull();
    expect(freeRequests).toHaveLength(1);
    expect(freeRequests[0]?.get('liveOnly')).toBeNull();
    expect(requests.every((params) => params.get('limit') === '30')).toBe(true);
    // Page buttons scroll back to these anchors
    expect(paid.closest('section')?.id ?? paid.id).toBe('home-paid-courses');
    expect(free.closest('section')?.id ?? free.id).toBe('home-free-courses');
  });

  it('lists only the categories with courses in that section, with their course counts', async () => {
    renderWithProviders(<HomePage />);

    const paid = await section('Live Courses');
    const paidGroup = await within(paid).findByRole('group', { name: /Live Courses/ });
    expect(within(paidGroup).getByRole('button', { name: /Programming/ })).toHaveTextContent(
      '1 course',
    );
    expect(within(paidGroup).queryByRole('button', { name: /Design/ })).not.toBeInTheDocument();

    const free = await section('Upcoming Free Live Courses');
    const freeGroup = await within(free).findByRole('group');
    expect(within(freeGroup).getByRole('button', { name: /All/ })).toHaveTextContent('3 courses');
    expect(within(freeGroup).getByRole('button', { name: /Design/ })).toHaveTextContent(
      '2 courses',
    );
  });

  it('filters a section by the picked category', async () => {
    const requests: URLSearchParams[] = [];
    server.use(browseHandler(requests));
    renderWithProviders(<HomePage />);
    const user = userEvent.setup();

    const free = await section('Upcoming Free Live Courses');
    const design = await within(free).findByRole('button', { name: /Design/ });
    await user.click(design);

    expect(design).toHaveAttribute('aria-pressed', 'true');
    expect(
      requests.some(
        (params) => params.get('pricing') === 'Free' && params.get('categories') === DESIGN._id,
      ),
    ).toBe(true);
  });

  it('"All" clears the category, and a category only filters its own section', async () => {
    const requests: URLSearchParams[] = [];
    server.use(browseHandler(requests));
    renderWithProviders(<HomePage />);
    const user = userEvent.setup();

    const free = await section('Upcoming Free Live Courses');
    await user.click(await within(free).findByRole('button', { name: /Design/ }));
    requests.length = 0;
    await user.click(within(free).getByRole('button', { name: /All/ }));

    await waitFor(() => {
      expect(requests.some((params) => params.get('pricing') === 'Free')).toBe(true);
    });
    expect(requests.every((params) => params.get('categories') === null)).toBe(true);
    const paid = await section('Live Courses');
    expect(within(paid).getByRole('button', { name: /All/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('pages a section and goes back to page 1 when the category changes', async () => {
    const requests: URLSearchParams[] = [];
    server.use(
      http.get('*/api/courses/browse', ({ request }) => {
        const params = new URL(request.url).searchParams;
        requests.push(params);
        const page = Number(params.get('page'));
        return params.get('pricing') === 'Free'
          ? browsePage([freeCourse], page, MANY_COURSES, FREE_COUNTS)
          : browsePage([paidCourse], 1, 1, {}, LIVE_COUNTS);
      }),
    );
    // jsdom has no scrolling
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderWithProviders(<HomePage />);
    const user = userEvent.setup();
    const freeRequests = () => requests.filter((params) => params.get('pricing') === 'Free');

    const free = await section('Upcoming Free Live Courses');
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

  it('shows no category cards when the counts are missing', async () => {
    server.use(
      http.get('*/api/courses/browse', () =>
        ok([paidCourse], { total: 1, pagination: { page: 1, limit: 30, total: 1, totalPages: 1 } }),
      ),
    );
    renderWithProviders(<HomePage />);

    await screen.findAllByRole('link', { name: /^Recorded TypeScript Basics/ });
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('shows the card with type, start day, price and "See Details", without teacher or category', async () => {
    renderWithProviders(<HomePage />);

    const card = await screen.findByRole('link', { name: /^Recorded TypeScript Basics/ });
    expect(card).toHaveAttribute('href', `/courses/${paidCourse._id}`);
    expect(within(card).getByText('Recorded')).toBeInTheDocument();
    expect(within(card).getByText(/^Starts Dec \d, 2026$/)).toBeInTheDocument();
    expect(within(card).getByText('৳800')).toBeInTheDocument();
    expect(within(card).getByText('৳1,000')).toBeInTheDocument();
    expect(within(card).getByText('20% off')).toBeInTheDocument();
    expect(within(card).queryByText('Ada Lovelace')).not.toBeInTheDocument();
    expect(within(card).queryByText('Programming')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See details of TypeScript Basics' })).toHaveAttribute(
      'href',
      `/courses/${paidCourse._id}`,
    );
  });

  it('says when a course has no start date yet', async () => {
    renderWithProviders(<HomePage />);

    const free = await section('Upcoming Free Live Courses');
    expect(await within(free).findByText('Start date to be announced')).toBeInTheDocument();
  });

  it('shows the pagination only when a section has more than 30 courses', async () => {
    server.use(
      http.get('*/api/courses/browse', ({ request }) => {
        const isFree = new URL(request.url).searchParams.get('pricing') === 'Free';
        return isFree ? browsePage([freeCourse], 1, MANY_COURSES) : browsePage([paidCourse], 1, 1);
      }),
    );
    renderWithProviders(<HomePage />);

    const free = await section('Upcoming Free Live Courses');
    expect(await within(free).findByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
    const paid = await section('Live Courses');
    await within(paid).findByRole('link', { name: /^Recorded TypeScript Basics/ });
    expect(within(paid).queryByRole('navigation')).not.toBeInTheDocument();
    expect(within(paid).queryByText(/Showing/)).not.toBeInTheDocument();
  });

  it('says when a section has no courses yet', async () => {
    server.use(http.get('*/api/courses/browse', () => browsePage([])));
    renderWithProviders(<HomePage />);

    expect(await screen.findByText('No live courses yet.')).toBeInTheDocument();
    expect(screen.getByText('No free courses yet.')).toBeInTheDocument();
  });

  it('shows the error with a retry when courses cannot load', async () => {
    server.use(http.get('*/api/courses/browse', () => fail(500, 'Server error')));
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getAllByText('Server error')).toHaveLength(2);
    });
    expect(screen.getAllByRole('button', { name: 'Try again' })).toHaveLength(2);
  });

  it('no longer shows the learning paths or the instructors band', async () => {
    renderWithProviders(<HomePage />);

    await screen.findByRole('heading', { name: 'Live Courses' });
    expect(screen.queryByText('Learn what matches your ambition')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Our Instructors' })).not.toBeInTheDocument();
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

    await screen.findByRole('link', { name: /^Recorded TypeScript Basics/ });
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
      await screen.findByRole('heading', { name: 'Live Courses' });
      expect(screen.queryByRole('button', { name: 'Next header image' })).not.toBeInTheDocument();
    });
  });
});
