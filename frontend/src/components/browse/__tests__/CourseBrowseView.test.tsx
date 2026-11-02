import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { makeEnrolledCourse } from '@/components/student/__tests__/fixtures';
import { taxonomySchema } from '@/schemas/catalog.schema';

import { CourseBrowseView } from '../catalog/CourseBrowseView';

import {
  CATEGORY,
  catalogListHandlers,
  COURSE_TYPE,
  emptyCounts,
  makeCourse,
} from './browse-fixtures';

import type { Course } from '@/schemas/browse.schema';

/** A course type without paid courses: it gets no section. */
const EMPTY_TYPE = taxonomySchema.parse({ _id: 't00000000000000000000002', name: 'Bootcamp' });

const counts = {
  ...emptyCounts,
  categories: { [CATEGORY._id]: 3 },
  pricing: { Free: 2, Paid: 1 },
  categoriesByPricing: { Free: { [CATEGORY._id]: 1 }, Paid: { [CATEGORY._id]: 1 } },
  liveCategories: {},
  paidByCourseType: { [COURSE_TYPE._id]: { total: 1, categories: { [CATEGORY._id]: 1 } } },
};

const page = (courses: Course[]) => ({
  total: courses.length,
  filterCounts: counts,
  pagination: { page: 1, limit: 30, total: courses.length, totalPages: 1 },
});

/** Serves the catalog: paid courses per type, the free courses, or (with a filter) the given results. */
const serveBrowse = (
  { paid = [], free = [], results = [] }: { paid?: Course[]; free?: Course[]; results?: Course[] },
  seen: URLSearchParams[] = [],
) =>
  http.get('*/api/courses/browse', ({ request }) => {
    const params = new URL(request.url).searchParams;
    seen.push(params);
    if (params.get('pricing') === 'Paid' && params.get('courseTypes')) return ok(paid, page(paid));
    if (params.get('pricing') === 'Free' && !params.get('search')) return ok(free, page(free));
    if (params.get('limit') === '1') return ok([], page([]));
    return ok(results, page(results));
  });

/** The course box a section heading belongs to. */
const sectionOf = (heading: HTMLElement): HTMLElement => {
  const section = heading.closest('section');
  if (!section) throw new Error('heading outside a section');
  return section;
};

describe('CourseBrowseView (/courses)', () => {
  it('shows one section per course type with paid courses, then the free courses; no filter sidebar', async () => {
    setLocation('/courses');
    const paid = makeCourse({ title: 'Paid React', pricing: 'Paid', price: 500 });
    const free = makeCourse({ title: 'Free HTML' });
    server.use(
      serveBrowse({ paid: [paid], free: [free] }),
      ...catalogListHandlers([CATEGORY], [COURSE_TYPE, EMPTY_TYPE]),
    );
    renderWithProviders(<CourseBrowseView />);

    const typeBox = sectionOf(await screen.findByRole('heading', { name: COURSE_TYPE.name }));
    expect(await within(typeBox).findByText('Paid React')).toBeInTheDocument();
    expect(within(typeBox).getByText('Short practical courses')).toBeInTheDocument();

    const freeBox = sectionOf(screen.getByRole('heading', { name: 'Free Courses' }));
    expect(await within(freeBox).findByText('Free HTML')).toBeInTheDocument();
    expect(within(freeBox).queryByText('Paid React')).not.toBeInTheDocument();

    expect(screen.queryByRole('heading', { name: EMPTY_TYPE.name })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('asks for the paid courses of each course type and the free courses', async () => {
    setLocation('/courses');
    const seen: URLSearchParams[] = [];
    server.use(
      serveBrowse({ paid: [makeCourse({ pricing: 'Paid' })] }, seen),
      ...catalogListHandlers(),
    );
    renderWithProviders(<CourseBrowseView />);

    await screen.findByRole('heading', { name: COURSE_TYPE.name });
    const typeQuery = seen.find((params) => params.get('courseTypes') === COURSE_TYPE._id);
    expect(typeQuery?.get('pricing')).toBe('Paid');
    expect(seen.some((params) => params.get('pricing') === 'Free')).toBe(true);
  });

  it('a course type section filters by category with its own category cards', async () => {
    setLocation('/courses');
    const seen: URLSearchParams[] = [];
    server.use(
      serveBrowse({ paid: [makeCourse({ pricing: 'Paid' })] }, seen),
      ...catalogListHandlers(),
    );
    renderWithProviders(<CourseBrowseView />);

    const group = await screen.findByRole('group', {
      name: `Filter ${COURSE_TYPE.name} by category`,
    });
    await userEvent.click(within(group).getByRole('button', { name: /Programming/ }));
    expect(
      seen.some(
        (params) =>
          params.get('courseTypes') === COURSE_TYPE._id &&
          params.get('categories') === CATEGORY._id,
      ),
    ).toBe(true);
  });

  it('with a search in the address: the results, their count and "Show all courses"', async () => {
    const seen: URLSearchParams[] = [];
    setLocation('/courses', `?search=type&categories=${CATEGORY._id}&page=2`);
    const course = makeCourse({ title: 'Intro to TypeScript' });
    server.use(serveBrowse({ results: [course] }, seen), ...catalogListHandlers());
    renderWithProviders(<CourseBrowseView />);

    const link = await screen.findByRole('link', { name: /Intro to TypeScript/ });
    expect(link).toHaveAttribute('href', `/courses/${course._id}`);
    expect(screen.getByText('1 course found for "type"')).toBeInTheDocument();
    const params = seen.find((query) => query.get('search') === 'type');
    expect(params?.get('categories')).toBe(CATEGORY._id);
    expect(params?.get('page')).toBe('2');
    expect(params?.get('limit')).toBe('12');

    await userEvent.click(screen.getByRole('button', { name: 'Show all courses' }));
    expect(router.replace).toHaveBeenCalledWith('/courses', { scroll: false });
  });

  it('says so when nothing matches the filter', async () => {
    setLocation('/courses', '?pricing=Paid');
    server.use(serveBrowse({ results: [] }), ...catalogListHandlers());
    renderWithProviders(<CourseBrowseView />);

    expect(await screen.findByText('No courses match your filters.')).toBeInTheDocument();
  });

  it('shows the API error with a retry button', async () => {
    setLocation('/courses', '?search=x');
    server.use(
      http.get('*/api/courses/browse', () => fail(500, 'Server error')),
      ...catalogListHandlers(),
    );
    renderWithProviders(<CourseBrowseView />);

    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('a signed-in student sees "Go to this course" on enrolled courses only', async () => {
    setLocation('/courses', '?search=course');
    const enrolled = makeCourse({ title: 'Enrolled course' });
    const other = makeCourse({ title: 'Other course' });
    server.use(
      signedInAs(makeUser('Student')),
      http.get('*/api/enrollments', () =>
        ok([makeEnrolledCourse({ _id: enrolled._id, title: enrolled.title })]),
      ),
      serveBrowse({ results: [enrolled, other] }),
      ...catalogListHandlers(),
    );
    renderWithProviders(<CourseBrowseView />);

    const goTo = await screen.findByRole('link', { name: 'Go to this course' });
    expect(goTo).toHaveAttribute('href', `/student/courses/${enrolled._id}/learn`);
    expect(screen.getAllByRole('link', { name: 'Go to this course' })).toHaveLength(1);
  });
});
