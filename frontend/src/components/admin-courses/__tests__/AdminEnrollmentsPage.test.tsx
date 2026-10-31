import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { courseSchema } from '@/schemas/browse.schema';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { AdminEnrollmentsPage } from '../enrollments/AdminEnrollmentsPage';

import { COURSE_ID, PAID, STATS, STUDENTS } from './admin-courses-fixtures';

import type { UserRole } from '@/types';

const COURSE = courseSchema.parse({
  _id: COURSE_ID,
  title: 'React Basics',
  pricing: 'Paid',
  price: 1200,
  listPrice: 1500,
  discountPrice: 1200,
  status: 'Draft',
});

const renderPage = (role: UserRole = 'Admin', courseId = COURSE_ID) => {
  server.use(
    signedInAs(makeUser(role)),
    http.get(`*/api/courses/${COURSE_ID}`, () => ok(COURSE)),
    http.get(`*/api/enrollments/course/${COURSE_ID}/students`, () => ok(STUDENTS)),
    http.get(`*/api/enrollments/admin/course/${COURSE_ID}/stats`, () => ok(STATS)),
    http.get(`*/api/enrollments/admin/course/${COURSE_ID}`, ({ request }) =>
      new URL(request.url).searchParams.get('type') === 'paid' ? ok(PAID) : ok([]),
    ),
  );
  return renderWithProviders(<AdminEnrollmentsPage courseId={courseId} />);
};

describe('AdminEnrollmentsPage', () => {
  it('shows the course, statistics, students and the CSV export to an Admin', async () => {
    renderPage('Admin');

    expect(await screen.findByRole('heading', { name: 'React Basics' })).toBeInTheDocument();
    expect(screen.getByText('৳1,200 (20% off)')).toBeInTheDocument();
    const stats = await screen.findByRole('list', { name: 'Enrollment statistics' });
    expect(within(stats).getByText('Total students')).toBeInTheDocument();
    expect(within(stats).getByText('৳2,400')).toBeInTheDocument();
    expect(await screen.findByText('Karim Ahmed')).toBeInTheDocument();
    expect(screen.getByText('nadia@example.com')).toBeInTheDocument();
    expect(screen.getByText('Deleted account')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Export CSV' })).toHaveAttribute(
      'href',
      `/api/enrollments/course/${COURSE_ID}/students/export`,
    );
    expect(screen.getByRole('link', { name: 'Back to Courses' })).toHaveAttribute(
      'href',
      '/admin/courses',
    );
  });

  it('filters the students by enrolment type', async () => {
    renderPage('Admin');
    const user = userEvent.setup();

    expect(await screen.findByText('Karim Ahmed')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Free' }));
    expect(screen.getByText('Nadia Islam')).toBeInTheDocument();
    expect(screen.queryByText('Karim Ahmed')).not.toBeInTheDocument();
  });

  it('shows the paid enrolments and their total in the revenue view', async () => {
    renderPage('Super Admin');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('tab', { name: 'Revenue' }));
    expect(await screen.findByText('Total: ৳1,200')).toBeInTheDocument();
    expect(screen.getByText('৳1,500')).toBeInTheDocument();
    expect(screen.getByText('৳300 (20%)')).toBeInTheDocument();
  });

  it('gives Moderators the student list and export only', async () => {
    renderPage('Moderator');

    expect(await screen.findByText('Karim Ahmed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Export CSV' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Enrollment statistics' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Revenue' })).not.toBeInTheDocument();
  });

  it('shows an empty list and an error with retry', async () => {
    renderPage('Admin');
    server.use(
      http.get(`*/api/enrollments/course/${COURSE_ID}/students`, () => fail(500, 'Server error')),
    );
    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('says when there are no students', async () => {
    server.use(http.get(`*/api/enrollments/course/${COURSE_ID}/students`, () => ok([])));
    renderPage('Admin');
    server.use(http.get(`*/api/enrollments/course/${COURSE_ID}/students`, () => ok([])));
    expect(await screen.findByText('No students found.')).toBeInTheDocument();
  });

  it('says the course was not found for a bad id', async () => {
    renderPage('Admin', 'not-an-id');
    expect(await screen.findByText('Course not found')).toBeInTheDocument();
  });
});
