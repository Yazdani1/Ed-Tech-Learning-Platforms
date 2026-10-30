import { screen } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { FreeCoursesView } from '../free/FreeCoursesView';

import { catalogListHandlers, COURSE_TYPE, emptyCounts, makeCourse } from './browse-fixtures';

import type { Course } from '@/schemas/browse.schema';

const serveFree = (courses: Course[], seen: URLSearchParams[] = []) =>
  http.get('*/api/courses/browse', ({ request }) => {
    seen.push(new URL(request.url).searchParams);
    return ok(courses, { total: courses.length, filterCounts: emptyCounts });
  });

describe('FreeCoursesView (/free-courses)', () => {
  it('asks the server for free courses and groups them by course type', async () => {
    const seen: URLSearchParams[] = [];
    const typed = makeCourse({ title: 'Typed free course' });
    const untyped = makeCourse({ title: 'Untyped free course', courseType: null });
    server.use(serveFree([typed, untyped], seen), ...catalogListHandlers());
    renderWithProviders(<FreeCoursesView />);

    expect(await screen.findByRole('heading', { name: COURSE_TYPE.name })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Other Free Courses' })).toBeInTheDocument();
    expect(screen.getByText('2 free courses available')).toBeInTheDocument();
    expect(screen.getByText(COURSE_TYPE.description ?? '')).toBeInTheDocument();
    expect(seen[0]?.get('pricing')).toBe('Free');
  });

  it('shows six cards per type and links "See all" to the filtered catalog', async () => {
    const courses = Array.from({ length: 7 }, (_, index) =>
      makeCourse({ title: `Free course ${index}` }),
    );
    server.use(serveFree(courses), ...catalogListHandlers());
    renderWithProviders(<FreeCoursesView />);

    const seeAll = await screen.findByRole('link', { name: `See all ${COURSE_TYPE.name} courses` });
    expect(seeAll).toHaveAttribute('href', `/courses?courseTypes=${COURSE_TYPE._id}&pricing=Free`);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6);
  });

  it('says when there are no free courses', async () => {
    server.use(serveFree([]), ...catalogListHandlers());
    renderWithProviders(<FreeCoursesView />);
    expect(await screen.findByText('No free courses are available right now.')).toBeInTheDocument();
  });

  it('shows the error with a retry button', async () => {
    server.use(
      http.get('*/api/courses/browse', () => fail(500, 'Server error')),
      ...catalogListHandlers(),
    );
    renderWithProviders(<FreeCoursesView />);
    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
