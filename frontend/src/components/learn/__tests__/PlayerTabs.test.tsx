import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { liveClassWeekSchema } from '@/schemas/browse.schema';
import { courseStudentSchema } from '@/schemas/enrollment.schema';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { LiveClassTab } from '../live/LiveClassTab';
import { StudyMaterialsTab } from '../materials/StudyMaterialsTab';
import { CourseOverviewTab } from '../overview/CourseOverviewTab';
import { StudentsTab } from '../students/StudentsTab';

import { COURSE_ID, makeAnnouncement, makeCourse, makeQuestion, posterOf } from './fixtures';

import type { UserRole } from '@/types';
import type { ReactElement } from 'react';

const LIVE = `*/api/study-curricula/course/${COURSE_ID}`;
const MATERIALS = `*/api/study-materials/course/${COURSE_ID}`;
const STUDENTS = `*/api/enrollments/course/${COURSE_ID}/students`;

const renderAs = (role: UserRole, ui: ReactElement) => {
  server.use(signedInAs(makeUser(role)));
  return renderWithProviders(<ConfirmProvider>{ui}</ConfirmProvider>);
};

const makeWeek = (title: string, role: UserRole, overrides: Record<string, unknown> = {}) =>
  liveClassWeekSchema.parse({
    _id: `w-${title}`,
    title,
    weekName: 'Week 1',
    description: '<p>Plan</p>',
    lectures: [{ _id: `c-${title}`, title: 'Intro class', day: '2026-11-02', time: '10:00' }],
    postedBy: posterOf(role),
    createdAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  });

describe('LiveClassTab (course player)', () => {
  it('shows the weeks read-only to a student', async () => {
    server.use(http.get(LIVE, () => ok([makeWeek('Kick-off', 'Teacher')])));
    renderAs('Student', <LiveClassTab courseId={COURSE_ID} />);

    const week = await screen.findByRole('listitem', { name: 'Kick-off' });
    expect(within(week).getByText('Intro class')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Live Class (1)' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Week' })).not.toBeInTheDocument();
    expect(within(week).queryByRole('button', { name: /Actions for/ })).not.toBeInTheDocument();
    expect(within(week).queryByRole('button', { name: 'Add Class' })).not.toBeInTheDocument();
  });

  it("lets a teacher manage only their own weeks, not another teacher's", async () => {
    server.use(
      http.get(LIVE, () =>
        ok([
          makeWeek('Mine', 'Teacher'),
          makeWeek('Theirs', 'Teacher', {
            postedBy: { ...posterOf('Teacher'), _id: 'someone-else' },
          }),
        ]),
      ),
    );
    renderAs('Teacher', <LiveClassTab courseId={COURSE_ID} />);

    const mine = await screen.findByRole('listitem', { name: 'Mine' });
    expect(within(mine).getByRole('button', { name: 'Actions for Mine' })).toBeInTheDocument();
    expect(within(mine).getByRole('button', { name: 'Add Class' })).toBeInTheDocument();
    const theirs = screen.getByRole('listitem', { name: 'Theirs' });
    expect(within(theirs).queryByRole('button', { name: /Actions for/ })).not.toBeInTheDocument();
    expect(within(theirs).queryByRole('button', { name: 'Add Class' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Week' })).toBeInTheDocument();
  });

  it('lets a teacher add a class to their week (the whole week is saved)', async () => {
    let body: { lectures?: unknown[] } = {};
    const week = makeWeek('Mine', 'Teacher');
    server.use(
      http.get(LIVE, () => ok([week])),
      http.put(`*/api/study-curricula/${week._id}`, async ({ request }) => {
        body = (await request.json()) as typeof body;
        return ok({ _id: week._id });
      }),
    );
    renderAs('Teacher', <LiveClassTab courseId={COURSE_ID} />);
    const user = userEvent.setup();

    const card = await screen.findByRole('listitem', { name: 'Mine' });
    await user.click(within(card).getByRole('button', { name: 'Add Class' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Live Class' });
    const second = within(dialog).getByRole('group', { name: 'Class 2' });
    await user.type(within(second).getByLabelText(/Class Title/), 'Second class');
    await user.type(within(second).getByLabelText(/Class Date/), '2026-11-09');
    await user.type(within(second).getByLabelText(/Class Time/), '11:30');
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Live class updated')).toBeInTheDocument();
    expect(body.lectures).toHaveLength(2);
  });

  it('shows the empty and error states', async () => {
    server.use(http.get(LIVE, () => ok([])));
    const { unmount } = renderAs('Student', <LiveClassTab courseId={COURSE_ID} />);
    expect(await screen.findByText('No live class available.')).toBeInTheDocument();
    unmount();

    server.use(http.get(LIVE, () => fail(500, 'Live classes failed')));
    renderAs('Student', <LiveClassTab courseId={COURSE_ID} />);
    expect(await screen.findByText('Live classes failed')).toBeInTheDocument();
  });
});

describe('StudyMaterialsTab', () => {
  it('lets a teacher add a material; students only read', async () => {
    let posted: unknown;
    server.use(
      http.get(MATERIALS, () => ok([])),
      http.post(MATERIALS, async ({ request }) => {
        posted = await request.json();
        return ok({ ...makeAnnouncement({ _id: 'm9', title: 'Notes' }), fileUrl: null });
      }),
    );
    const { unmount } = renderAs('Student', <StudyMaterialsTab courseId={COURSE_ID} />);
    expect(await screen.findByText('No study materials available.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Material' })).not.toBeInTheDocument();
    unmount();

    renderAs('Teacher', <StudyMaterialsTab courseId={COURSE_ID} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Add Material' }));
    const dialog = await screen.findByRole('dialog', { name: 'New Study Material' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Title' }), 'Notes');
    await user.type(await within(dialog).findByLabelText('Description'), 'Chapter 1');
    await user.type(
      within(dialog).getByRole('textbox', { name: /Resource Link/ }),
      'https://example.com/notes.pdf',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Study material added')).toBeInTheDocument();
    expect(posted).toEqual({
      title: 'Notes',
      description: 'Chapter 1',
      fileUrl: 'https://example.com/notes.pdf',
    });
  });
});

describe('StudentsTab', () => {
  const students = [
    courseStudentSchema.parse({
      _id: '64b7f0c2a1b2c3d4e5f72001',
      student: { _id: 's1', name: 'Asha Karim', email: 'asha@example.com' },
      enrollmentType: 'paid',
      createdAt: '2026-10-01T10:00:00.000Z',
    }),
  ];

  it('shows staff admins the email and the CSV export', async () => {
    server.use(http.get(STUDENTS, () => ok(students)));
    renderAs('Admin', <StudentsTab courseId={COURSE_ID} courseTitle="Physics 101" />);

    expect(await screen.findAllByText('Asha Karim')).not.toHaveLength(0);
    expect(screen.getAllByText('asha@example.com')).not.toHaveLength(0);
    expect(screen.getByRole('link', { name: 'Export CSV' })).toHaveAttribute(
      'href',
      `/api/enrollments/course/${COURSE_ID}/students/export`,
    );
  });

  it('shows teachers no email column and no export', async () => {
    server.use(http.get(STUDENTS, () => ok(students)));
    renderAs('Teacher', <StudentsTab courseId={COURSE_ID} courseTitle="Physics 101" />);

    expect(await screen.findAllByText('Asha Karim')).not.toHaveLength(0);
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Export CSV' })).not.toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    server.use(http.get(STUDENTS, () => ok([])));
    renderAs('Teacher', <StudentsTab courseId={COURSE_ID} courseTitle="Physics 101" />);
    expect(await screen.findByText('No students enrolled in this course yet.')).toBeInTheDocument();
  });
});

describe('CourseOverviewTab', () => {
  it('shows the title and the counts of every content list', async () => {
    server.use(
      http.get(`*/api/enrollments/course/${COURSE_ID}/count`, () => ok({ count: 42 })),
      http.get(`*/api/announcements/course/${COURSE_ID}`, () =>
        ok([makeAnnouncement(), makeAnnouncement({ _id: 'a2' })]),
      ),
      http.get(MATERIALS, () => ok([])),
      http.get(LIVE, () => ok([makeWeek('Kick-off', 'Teacher')])),
      http.get(`*/api/qa/questions/course/${COURSE_ID}`, () => ok([makeQuestion()])),
    );
    renderAs('Student', <CourseOverviewTab course={makeCourse({ subtitle: 'Forces' })} />);

    expect(screen.getByRole('heading', { name: 'Physics 101' })).toBeInTheDocument();
    expect(screen.getByText('Forces')).toBeInTheDocument();
    const stat = (label: string): HTMLElement => {
      const box = screen.getByText(label).parentElement;
      if (!box) throw new Error(`No stat ${label}`);
      return box;
    };
    await waitFor(() => {
      expect(within(stat('Enrolled Students')).getByText('42')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(within(stat('Announcements')).getByText('2')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(within(stat('Live Class')).getByText('1')).toBeInTheDocument();
      expect(within(stat('Study Materials')).getByText('0')).toBeInTheDocument();
    });
  });
});
