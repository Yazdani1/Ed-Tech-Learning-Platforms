import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { courseSchema } from '@/schemas/browse.schema';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import { DESKTOP_WIDTH, setViewportWidth } from '@/test/viewport';

import { AdminEnrollmentsPage } from '../enrollments/AdminEnrollmentsPage';

import { COURSE_ID, ORDERS, STATS, STUDENTS } from './admin-courses-fixtures';

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
    http.get(`*/api/enrollments/admin/course/${COURSE_ID}`, () => ok(ORDERS)),
  );
  return renderWithProviders(<AdminEnrollmentsPage courseId={courseId} />);
};

describe('AdminEnrollmentsPage', () => {
  beforeEach(() => {
    setViewportWidth(DESKTOP_WIDTH);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the course, statistics, orders and the CSV export to an Admin', async () => {
    renderPage('Admin');

    expect(await screen.findByRole('heading', { name: 'React Basics' })).toBeInTheDocument();
    expect(screen.getByText('৳1,200 (20% off)')).toBeInTheDocument();
    const stats = await screen.findByRole('list', { name: 'Enrollment statistics' });
    expect(within(stats).getByText('Total students')).toBeInTheDocument();
    expect(within(stats).getByText('৳2,400')).toBeInTheDocument();
    expect(await screen.findByText('Karim Ahmed')).toBeInTheDocument();
    expect(screen.getByText('Nadia Islam')).toBeInTheDocument();
    expect(screen.getByText(/2 enrolments shown · Sales ৳1,200 · VAT ৳0/)).toBeInTheDocument();
    expect(screen.getByText('SAVE20NOW')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Student tokens (PDF)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Courses' })).toHaveAttribute(
      'href',
      '/admin/courses',
    );
  });

  it('filters the orders by enrolment type', async () => {
    renderPage('Super Admin');
    const user = userEvent.setup();

    // The order list replaces the plain student list once the role is known
    expect(await screen.findByText('SAVE20NOW')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Type' }));
    await user.click(await screen.findByRole('option', { name: 'Free' }));
    expect(screen.getByText('Nadia Islam')).toBeInTheDocument();
    expect(screen.queryByText('Karim Ahmed')).not.toBeInTheDocument();
    expect(screen.getByText(/1 enrolments shown · Sales ৳0/)).toBeInTheDocument();
  });

  it('opens the purchase details of a row on the right', async () => {
    renderPage('Admin');
    const user = userEvent.setup();

    await screen.findByText('SAVE20NOW');
    await user.click(screen.getByText('Karim Ahmed'));
    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByText('Purchase details')).toBeInTheDocument();
    expect(within(drawer).getByText('123-456-789')).toBeInTheDocument();
    expect(within(drawer).getByText('B-7')).toBeInTheDocument();
    expect(within(drawer).getByText('SAVE20NOW')).toBeInTheDocument();
    expect(within(drawer).getByText('bKash')).toBeInTheDocument();
  });

  it('gives Moderators the student list and export only', async () => {
    renderPage('Moderator');

    expect(await screen.findByText('Karim Ahmed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Export CSV' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Enrollment statistics' })).not.toBeInTheDocument();
    expect(screen.queryByText('SAVE20NOW')).not.toBeInTheDocument();
  });

  it('shows an error with retry', async () => {
    renderPage('Moderator');
    server.use(
      http.get(`*/api/enrollments/course/${COURSE_ID}/students`, () => fail(500, 'Server error')),
    );
    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('says when there are no students', async () => {
    server.use(http.get(`*/api/enrollments/course/${COURSE_ID}/students`, () => ok([])));
    renderPage('Moderator');
    server.use(http.get(`*/api/enrollments/course/${COURSE_ID}/students`, () => ok([])));
    expect(await screen.findByText('No students found.')).toBeInTheDocument();
  });

  it('says the course was not found for a bad id', async () => {
    renderPage('Admin', 'not-an-id');
    expect(await screen.findByText('Course not found')).toBeInTheDocument();
  });
});
