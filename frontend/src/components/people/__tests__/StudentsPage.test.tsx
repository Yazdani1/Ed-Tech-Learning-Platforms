import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  studentCourseSchema,
  studentDetailsSchema,
  studentRowSchema,
} from '@/schemas/students.schema';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { StudentsPage } from '../students/StudentsPage';

import type { UserRole } from '@/types';

const COURSE_A = '64b7f0c2a1b2c3d4e5f75001';
const COURSE_B = '64b7f0c2a1b2c3d4e5f75002';
const ASHA_ID = '64b7f0c2a1b2c3d4e5f76001';

const ASHA = studentRowSchema.parse({
  _id: ASHA_ID,
  name: 'Asha Rahman',
  email: 'asha@example.com',
  phone: '+880 1711-000000',
  studentNumber: '482-917-305',
  createdAt: '2026-10-01T08:00:00.000Z',
  enrolledCourses: 2,
  totalSpent: 1499,
});

const COURSES = [
  {
    _id: COURSE_A,
    title: 'Algebra 101',
    status: 'Published',
    enrolledStudents: 8,
    paidStudents: 5,
  },
  { _id: COURSE_B, title: 'Physics', status: 'Draft', enrolledStudents: 1, paidStudents: 0 },
].map((course) => studentCourseSchema.parse(course));

const DETAILS = studentDetailsSchema.parse({
  student: ASHA,
  enrollments: [
    {
      _id: '64b7f0c2a1b2c3d4e5f77001',
      course: { _id: COURSE_A, title: 'Algebra 101' },
      enrollmentType: 'paid',
      amountPaid: 1400,
      createdAt: '2026-10-02T08:00:00.000Z',
    },
    {
      _id: '64b7f0c2a1b2c3d4e5f77002',
      course: null,
      enrollmentType: 'free',
      amountPaid: 0,
      createdAt: '2026-10-03T08:00:00.000Z',
    },
  ],
  subscriptions: [
    {
      _id: '64b7f0c2a1b2c3d4e5f78001',
      plan: 'Premium',
      billingLabel: '1 month',
      status: 'Active',
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2026-11-01T00:00:00.000Z',
      amountPaid: 99,
    },
  ],
  totals: {
    enrolledCourses: 2,
    paidCourses: 1,
    courseSpent: 1400,
    subscriptionSpent: 99,
    totalSpent: 1499,
  },
});

/** Serves the list (recording each query), the course picker list and Asha's details. */
const serveStudents = (seen: URLSearchParams[] = [], rows = [ASHA]) => [
  http.get('*/api/students', ({ request }) => {
    seen.push(new URL(request.url).searchParams);
    return ok(rows, { total: rows.length, page: 1, limit: 20 });
  }),
  http.get('*/api/students/courses', () => ok(COURSES)),
  http.get(`*/api/students/${ASHA_ID}`, () => ok(DETAILS)),
];

const renderPage = (role: UserRole = 'Admin') => {
  server.use(signedInAs(makeUser(role)));
  return renderWithProviders(<StudentsPage />);
};

describe('StudentsPage (/admin/students)', () => {
  it('lists the students with number, phone, course count and money spent', async () => {
    setLocation('/admin/students');
    server.use(...serveStudents());
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Students' })).toBeInTheDocument();
    expect(await screen.findByText('Asha Rahman')).toBeInTheDocument();
    expect(screen.getByText('482-917-305')).toBeInTheDocument();
    expect(screen.getByText('+880 1711-000000')).toBeInTheDocument();
    expect(screen.getByText('৳1,499')).toBeInTheDocument();
  });

  it('filters by several courses chosen in the side panel (cover, title, student count)', async () => {
    setLocation('/admin/students');
    server.use(...serveStudents());
    renderPage();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Filter by course (now: All courses)' }),
    );
    const list = await screen.findByRole('list', { name: 'Courses' });
    expect(within(list).getByText('8 students')).toBeInTheDocument();
    await userEvent.click(within(list).getByRole('checkbox', { name: 'Algebra 101' }));
    await userEvent.click(within(list).getByRole('checkbox', { name: 'Physics' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply (2 courses)' }));

    expect(router.replace).toHaveBeenLastCalledWith(
      `/admin/students?courses=${COURSE_A}%2C${COURSE_B}`,
      { scroll: false },
    );
  });

  it('sends the courses and search from the address to the API', async () => {
    const seen: URLSearchParams[] = [];
    setLocation('/admin/students', `?courses=${COURSE_A},bad&search=asha`);
    server.use(...serveStudents(seen));
    renderPage();

    expect(
      await screen.findByRole('button', { name: 'Filter by course (now: Algebra 101)' }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(seen[0]?.get('courseIds')).toBe(COURSE_A);
    });
    expect(seen[0]?.get('search')).toBe('asha');
    expect(seen[0]?.get('limit')).toBe('20');
  });

  it('opens a right side panel with contact details, courses bought, subscriptions and totals', async () => {
    setLocation('/admin/students');
    server.use(...serveStudents());
    renderPage();

    await userEvent.click(await screen.findByText('Asha Rahman'));
    const panel = await screen.findByRole('dialog', { name: 'Asha Rahman' });
    expect(await within(panel).findByRole('link', { name: 'asha@example.com' })).toHaveAttribute(
      'href',
      'mailto:asha@example.com',
    );
    expect(within(panel).getByRole('link', { name: '+880 1711-000000' })).toHaveAttribute(
      'href',
      'tel:+8801711000000',
    );
    expect(within(panel).getByText('৳1,499')).toBeInTheDocument();
    expect(within(panel).getByText('2 courses (1 paid)')).toBeInTheDocument();
    expect(within(panel).getByText('Algebra 101')).toBeInTheDocument();
    // "On courses" and the course row
    expect(within(panel).getAllByText('৳1,400')).toHaveLength(2);
    expect(within(panel).getByText('Deleted course')).toBeInTheDocument();
    expect(within(panel).getByText('Premium · 1 month')).toBeInTheDocument();
  });

  it('a Super Admin may use the page too', async () => {
    setLocation('/admin/students');
    server.use(...serveStudents());
    renderPage('Super Admin');

    expect(await screen.findByText('Asha Rahman')).toBeInTheDocument();
  });

  it('shows a dash for a student without a phone number, and no phone link', async () => {
    setLocation('/admin/students');
    const noPhone = studentRowSchema.parse({ ...ASHA, phone: null });
    server.use(
      http.get(`*/api/students/${ASHA_ID}`, () =>
        ok({ ...DETAILS, student: { ...DETAILS.student, phone: null } }),
      ),
      ...serveStudents([], [noPhone]),
    );
    renderPage();

    await userEvent.click(await screen.findByText('Asha Rahman'));
    const panel = await screen.findByRole('dialog', { name: 'Asha Rahman' });
    await within(panel).findByRole('link', { name: 'asha@example.com' });
    expect(within(panel).queryByRole('link', { name: /^\+?\d/ })).not.toBeInTheDocument();
  });

  it('shows the error and a retry when the details cannot load', async () => {
    setLocation('/admin/students');
    server.use(
      http.get(`*/api/students/${ASHA_ID}`, () => fail(404, 'Student not found')),
      ...serveStudents(),
    );
    renderPage();

    await userEvent.click(await screen.findByText('Asha Rahman'));
    const panel = await screen.findByRole('dialog', { name: 'Asha Rahman' });
    expect(await within(panel).findByText('Student not found')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('typing in the search writes ?search= to the address', async () => {
    setLocation('/admin/students', '?page=3');
    server.use(...serveStudents());
    renderPage();

    await userEvent.type(await screen.findByRole('searchbox', { name: 'Search students' }), 'asha');
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/admin/students?search=asha', {
        scroll: false,
      });
    });
  });

  it('shows the empty message and the server error', async () => {
    setLocation('/admin/students', '?search=nobody');
    server.use(...serveStudents([], []));
    const { unmount } = renderPage();
    expect(await screen.findByText('No students match your filters.')).toBeInTheDocument();
    unmount();

    server.use(http.get('*/api/students', () => fail(500, 'Server error')));
    renderPage();
    expect(await screen.findByText('Server error')).toBeInTheDocument();
  });

  it.each<UserRole>(['Moderator', 'Teacher', 'Student'])('sends a %s away', async (role) => {
    setLocation('/admin/students');
    server.use(...serveStudents());
    renderPage(role);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalled();
    });
    expect(screen.queryByRole('heading', { name: 'Students' })).not.toBeInTheDocument();
  });
});
