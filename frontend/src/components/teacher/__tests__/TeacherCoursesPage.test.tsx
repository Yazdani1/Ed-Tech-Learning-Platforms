import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { courseStudentSchema } from '@/schemas/enrollment.schema';
import { teacherCourseSchema, type TeacherCourse } from '@/schemas/teacher.schema';
import { fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { TeacherCoursesPage } from '../TeacherCoursesPage';

const COURSE_ID = '64b7f0c2a1b2c3d4e5f71001';

const makeCourse = (overrides: Partial<TeacherCourse> = {}): TeacherCourse =>
  teacherCourseSchema.parse({
    _id: COURSE_ID,
    title: 'Algebra 101',
    subtitle: 'Numbers and letters',
    description: '<p>Learn <strong>equations</strong> &amp; graphs</p>',
    status: 'Published',
    visibility: 'Public',
    category: { _id: '64b7f0c2a1b2c3d4e5f69001', name: 'Maths' },
    courseType: { _id: '64b7f0c2a1b2c3d4e5f69002', name: 'Live' },
    teachers: [{ _id: '64b7f0c2a1b2c3d4e5f69003', name: 'Ms Rahman' }, null],
    ...overrides,
  });

const myCoursesReturn = (courses: TeacherCourse[]) =>
  http.get('*/api/teachers/my-courses', () => ok(courses, { total: courses.length }));

describe('TeacherCoursesPage', () => {
  it('lists the assigned courses with their details and a link to the course player', async () => {
    server.use(
      myCoursesReturn([
        makeCourse(),
        makeCourse({
          _id: '64b7f0c2a1b2c3d4e5f71002',
          title: 'Draft Physics',
          status: 'Draft',
          visibility: 'Private',
          teachers: [],
          description: null,
        }),
      ]),
    );
    renderWithProviders(<TeacherCoursesPage />);

    const algebra = await screen.findByRole('article', { name: 'Algebra 101' });
    expect(screen.getByRole('heading', { name: 'My Courses' })).toBeInTheDocument();
    expect(within(algebra).getByText('Numbers and letters')).toBeInTheDocument();
    expect(within(algebra).getByText('Learn equations & graphs')).toBeInTheDocument();
    expect(within(algebra).getByText('Published')).toBeInTheDocument();
    expect(within(algebra).getByText('Maths')).toBeInTheDocument();
    expect(within(algebra).getByText('Live')).toBeInTheDocument();
    expect(within(algebra).getByText('Public')).toBeInTheDocument();
    expect(within(algebra).getByText('Ms Rahman')).toBeInTheDocument();
    expect(within(algebra).getByRole('link', { name: 'Open "Algebra 101"' })).toHaveAttribute(
      'href',
      `/teacher/courses/${COURSE_ID}/learn`,
    );

    const draft = screen.getByRole('article', { name: 'Draft Physics' });
    expect(within(draft).getByText('Draft')).toBeInTheDocument();
    expect(within(draft).getByText('Private')).toBeInTheDocument();
    expect(within(draft).getByText('No teachers assigned')).toBeInTheDocument();
  });

  it('shows the enrolled students of a course in a dialog', async () => {
    const user = userEvent.setup();
    server.use(
      myCoursesReturn([makeCourse()]),
      http.get(`*/api/enrollments/course/${COURSE_ID}/students`, () =>
        ok(
          [
            courseStudentSchema.parse({
              _id: '64b7f0c2a1b2c3d4e5f72001',
              student: { _id: '64b7f0c2a1b2c3d4e5f60005', name: 'Asha Karim' },
              enrollmentType: 'subscription',
              createdAt: '2026-10-01T10:00:00.000Z',
            }),
            courseStudentSchema.parse({
              _id: '64b7f0c2a1b2c3d4e5f72002',
              student: null,
              enrollmentType: 'free',
              createdAt: '2026-10-02T10:00:00.000Z',
            }),
          ],
          { total: 2 },
        ),
      ),
    );
    renderWithProviders(<TeacherCoursesPage />);

    await user.click(
      await screen.findByRole('button', { name: 'Enrolled students of "Algebra 101"' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Enrolled students: Algebra 101' });
    expect(await within(dialog).findByText('Asha Karim')).toBeInTheDocument();
    expect(within(dialog).getByText('Subscription')).toBeInTheDocument();
    expect(within(dialog).getByText('Deleted account')).toBeInTheDocument();
  });

  it('says so when a course has no students yet', async () => {
    const user = userEvent.setup();
    server.use(
      myCoursesReturn([makeCourse()]),
      http.get(`*/api/enrollments/course/${COURSE_ID}/students`, () => ok([], { total: 0 })),
    );
    renderWithProviders(<TeacherCoursesPage />);

    await user.click(await screen.findByRole('button', { name: /Enrolled students of/ }));
    expect(await screen.findByText('No students enrolled yet.')).toBeInTheDocument();
  });

  it('explains what to do when no course is assigned', async () => {
    server.use(myCoursesReturn([]));
    renderWithProviders(<TeacherCoursesPage />);

    expect(await screen.findByText(/No courses assigned to you yet/)).toBeInTheDocument();
  });

  it('shows the server message when the courses cannot load', async () => {
    server.use(http.get('*/api/teachers/my-courses', () => fail(500, 'Database unavailable')));
    renderWithProviders(<TeacherCoursesPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
  });
});
