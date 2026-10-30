import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { makeEnrolledCourse } from '@/components/student/__tests__/fixtures';

import { CourseBrowseView } from '../catalog/CourseBrowseView';

import {
  CATEGORY,
  catalogListHandlers,
  COURSE_TYPE,
  emptyCounts,
  makeCourse,
} from './browse-fixtures';

import type { Course } from '@/schemas/browse.schema';

/** Serves the catalog and records the query string of each browse request. */
const serveBrowse = (courses: Course[], seen: URLSearchParams[] = []) =>
  http.get('*/api/courses/browse', ({ request }) => {
    seen.push(new URL(request.url).searchParams);
    return ok(courses, {
      total: courses.length,
      filterCounts: {
        ...emptyCounts,
        categories: { [CATEGORY._id]: 3 },
        pricing: { Free: 2, Paid: 1 },
      },
      pagination: { page: 1, limit: 12, total: courses.length, totalPages: 1 },
    });
  });

describe('CourseBrowseView (/courses)', () => {
  it('lists the courses with their filters and counts, and links each card to its page', async () => {
    const course = makeCourse({ title: 'Intro to TypeScript' });
    server.use(serveBrowse([course]), ...catalogListHandlers());
    renderWithProviders(<CourseBrowseView />);

    const link = await screen.findByRole('link', { name: /Intro to TypeScript/ });
    expect(link).toHaveAttribute('href', `/courses/${course._id}`);
    expect(screen.getByText('1 course found')).toBeInTheDocument();
    expect(await screen.findByRole('checkbox', { name: /Programming/ })).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: new RegExp(COURSE_TYPE.name) }),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Premium/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Go to this course' })).not.toBeInTheDocument();
  });

  it('sends the URL filters and paging to the API (plain values, as the public site links them)', async () => {
    const seen: URLSearchParams[] = [];
    setLocation('/courses', `?search=type&categories=${CATEGORY._id}&pricing=Free&page=2`);
    server.use(serveBrowse([makeCourse()], seen), ...catalogListHandlers());
    renderWithProviders(<CourseBrowseView />);

    await screen.findByRole('link', { name: /Intro to TypeScript/ });
    const params = seen[0];
    expect(params?.get('search')).toBe('type');
    expect(params?.get('categories')).toBe(CATEGORY._id);
    expect(params?.get('pricing')).toBe('Free');
    expect(params?.get('page')).toBe('2');
    expect(params?.get('limit')).toBe('12');
    expect(screen.getByText('2 filters active')).toBeInTheDocument();
    expect(await screen.findByRole('checkbox', { name: /Programming/ })).toBeChecked();
  });

  it('ticking a filter writes it to the URL and goes back to page 1', async () => {
    setLocation('/courses', '?page=3');
    server.use(serveBrowse([makeCourse()]), ...catalogListHandlers());
    renderWithProviders(<CourseBrowseView />);

    await userEvent.click(await screen.findByRole('checkbox', { name: /Paid/ }));
    expect(router.replace).toHaveBeenCalledWith('/courses?pricing=Paid', { scroll: false });
  });

  it('searches shortly after typing stops', async () => {
    setLocation('/courses');
    server.use(serveBrowse([makeCourse()]), ...catalogListHandlers());
    renderWithProviders(<CourseBrowseView />);

    await userEvent.type(await screen.findByRole('searchbox', { name: 'Search' }), 'react');
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/courses?search=react', { scroll: false });
    });
  });

  it('shows "No courses match your filters" with a way to clear them', async () => {
    setLocation('/courses', '?pricing=Paid');
    server.use(serveBrowse([]), ...catalogListHandlers());
    renderWithProviders(<CourseBrowseView />);

    expect(await screen.findByText('No courses match your filters.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(router.replace).toHaveBeenCalledWith('/courses', { scroll: false });
  });

  it('shows the API error with a retry button', async () => {
    server.use(
      http.get('*/api/courses/browse', () => fail(500, 'Server error')),
      ...catalogListHandlers(),
    );
    renderWithProviders(<CourseBrowseView />);

    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('a signed-in student sees "Go to this course" on enrolled courses only', async () => {
    const enrolled = makeCourse({ title: 'Enrolled course' });
    const other = makeCourse({ title: 'Other course' });
    server.use(
      signedInAs(makeUser('Student')),
      http.get('*/api/enrollments', () =>
        ok([makeEnrolledCourse({ _id: enrolled._id, title: enrolled.title })]),
      ),
      serveBrowse([enrolled, other]),
      ...catalogListHandlers(),
    );
    renderWithProviders(<CourseBrowseView />);

    const goTo = await screen.findByRole('link', { name: 'Go to this course' });
    expect(goTo).toHaveAttribute('href', `/student/courses/${enrolled._id}/learn`);
    expect(screen.getAllByRole('link', { name: 'Go to this course' })).toHaveLength(1);
  });

  it('opens the filters in a drawer from the Filters button (phones)', async () => {
    server.use(serveBrowse([makeCourse()]), ...catalogListHandlers());
    renderWithProviders(<CourseBrowseView />);

    await userEvent.click(await screen.findByRole('button', { name: /^Filters/ }));
    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Close filters' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
