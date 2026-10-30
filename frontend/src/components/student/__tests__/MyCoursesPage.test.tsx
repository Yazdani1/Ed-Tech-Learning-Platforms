import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { MyCoursesPage } from '../MyCoursesPage';

import { enrollmentsReturn, makeEnrolledCourse } from './fixtures';

const renderPage = () =>
  renderWithProviders(
    <ConfirmProvider>
      <MyCoursesPage />
    </ConfirmProvider>,
  );

const algebra = makeEnrolledCourse({ title: 'Algebra Basics' });
const physics = makeEnrolledCourse({
  title: 'Physics Pro',
  pricing: 'Paid',
  listPrice: 1000,
  discountPrice: 800,
  enrollmentType: 'paid',
});
const chemistry = makeEnrolledCourse({ title: 'Chemistry Plus', enrollmentType: 'subscription' });

describe('MyCoursesPage', () => {
  it('shows loading cards, then the courses grouped by how the student enrolled', async () => {
    server.use(signedInAs(makeUser('Student')), enrollmentsReturn([algebra, physics, chemistry]));
    renderPage();

    expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
    const direct = await screen.findByRole('region', { name: 'Free & Paid Courses' });
    const viaPlan = screen.getByRole('region', { name: 'Enrolled with Subscription' });

    expect(within(direct).getByText('Algebra Basics')).toBeInTheDocument();
    expect(within(direct).getByText('Physics Pro')).toBeInTheDocument();
    expect(within(direct).getByText('৳800')).toBeInTheDocument();
    expect(within(direct).getByText('20% off')).toBeInTheDocument();
    expect(within(viaPlan).getByText('Chemistry Plus')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Algebra Basics/ })).toHaveAttribute(
      'href',
      `/student/courses/${algebra._id}/learn`,
    );
  });

  it('shows the empty message when the student has no enrolments', async () => {
    server.use(enrollmentsReturn([]));
    renderPage();

    expect(await screen.findByText("You haven't enrolled in any courses yet.")).toBeInTheDocument();
  });

  it('shows the server message when the list cannot load', async () => {
    server.use(http.get('*/api/enrollments', () => fail(500, 'Database unavailable')));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
  });

  it('filters by title at once and puts the search in the URL after a pause', async () => {
    setLocation('/student/courses');
    server.use(enrollmentsReturn([algebra, physics]));
    renderPage();
    await screen.findByText('Algebra Basics');

    await userEvent.setup().type(screen.getByLabelText('Search courses...'), 'phys');

    expect(screen.queryByText('Algebra Basics')).not.toBeInTheDocument();
    expect(screen.getByText('Physics Pro')).toBeInTheDocument();
    // The URL follows once typing stops (one update, not one per key)
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/student/courses?search=phys', {
        scroll: false,
      });
    });
    expect(router.replace).toHaveBeenCalledTimes(1);
  });

  it('says so when nothing matches the search', async () => {
    setLocation('/student/courses', '?search=zzz');
    server.use(enrollmentsReturn([algebra]));
    renderPage();

    expect(await screen.findByText('No courses match "zzz".')).toBeInTheDocument();
  });

  it('removes a course after confirmation', async () => {
    let deleted = '';
    server.use(
      http.get('*/api/enrollments', () =>
        ok([algebra, physics].filter((course) => course._id !== deleted)),
      ),
      http.delete('*/api/enrollments/:courseId', ({ params }) => {
        deleted = String(params.courseId);
        return ok(undefined);
      }),
    );
    renderPage();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: 'Remove "Algebra Basics" from my courses' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Remove Course' });
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }));

    expect(await screen.findByText('Removed from "Algebra Basics"')).toBeInTheDocument();
    expect(deleted).toBe(algebra._id);
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /Algebra Basics/ })).not.toBeInTheDocument();
    });
  });

  it('keeps the course and shows the error when removing fails', async () => {
    server.use(
      enrollmentsReturn([algebra]),
      http.delete('*/api/enrollments/:courseId', () => fail(404, 'Enrollment not found')),
    );
    renderPage();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: 'Remove "Algebra Basics" from my courses' }),
    );
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Remove' }),
    );

    expect(await screen.findByText('Enrollment not found')).toBeInTheDocument();
    expect(screen.getByText('Algebra Basics')).toBeInTheDocument();
  });

  it('does nothing when the confirmation is cancelled', async () => {
    let called = false;
    server.use(
      enrollmentsReturn([algebra]),
      http.delete('*/api/enrollments/:courseId', () => {
        called = true;
        return ok(undefined);
      }),
    );
    renderPage();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: 'Remove "Algebra Basics" from my courses' }),
    );
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(called).toBe(false);
  });
});
