import { screen } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeProfile, profileReturns, runningPlan } from '@/components/profile/__tests__/fixtures';
import { fail } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { StudentDashboard } from '../StudentDashboard';

import { enrollmentsReturn, makeEnrolledCourse } from './fixtures';

describe('StudentDashboard', () => {
  it('welcomes the student and shows enrolments, the running plan and the newest courses', async () => {
    const course = makeEnrolledCourse({ title: 'Algebra Basics' });
    server.use(
      profileReturns(
        makeProfile('Student', { name: 'Asha', activeSubscription: runningPlan('Gold') }),
      ),
      enrollmentsReturn([course, makeEnrolledCourse({ title: 'Physics Pro' })]),
    );
    renderWithProviders(<StudentDashboard />);

    expect(
      await screen.findByText('Welcome back, Asha. Continue your courses from the course page.'),
    ).toBeInTheDocument();
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText(/^Expires /)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Algebra Basics/ })).toHaveAttribute(
      'href',
      `/student/courses/${course._id}/learn`,
    );
    expect(screen.queryByRole('link', { name: 'View Plans' })).not.toBeInTheDocument();
  });

  it('offers the plans when there is no running subscription', async () => {
    server.use(
      profileReturns(
        makeProfile('Student', {
          activeSubscription: { plan: 'Basic', endDate: '2020-01-01T00:00:00.000Z' },
        }),
      ),
      enrollmentsReturn([]),
    );
    renderWithProviders(<StudentDashboard />);

    expect(await screen.findByRole('link', { name: 'View Plans' })).toHaveAttribute(
      'href',
      '/pricing',
    );
    expect(screen.getByText('No active plan')).toBeInTheDocument();
    expect(await screen.findByText("You haven't enrolled in any courses yet.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Courses' })).toHaveAttribute(
      'href',
      '/courses',
    );
  });

  it('shows the server message when the courses cannot load', async () => {
    server.use(
      profileReturns(makeProfile('Student')),
      http.get('*/api/enrollments', () => fail(500, 'Database unavailable')),
    );
    renderWithProviders(<StudentDashboard />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
  });
});
