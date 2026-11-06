import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  makeCourse,
  referenceHandlers,
} from '@/components/admin-courses/__tests__/admin-courses-fixtures';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { fileInputIn } from '@/test/pick';
import { renderWithProviders } from '@/test/render';

import { AnnouncementsPage } from '../AnnouncementsPage';

import type { UserRole } from '@/types';

const ALGEBRA = makeCourse('001', { title: 'Algebra 101', batchNumber: '1234' });
const PHYSICS = makeCourse('002', { title: 'Physics Pro', pricing: 'Free' });

const SENT = {
  _id: 'b1',
  title: 'Exam on Friday',
  description: '<p>Bring a <strong>calculator</strong></p>',
  postedBy: { _id: '64b7f0c2a1b2c3d4e5f60002', name: 'Test Admin', role: 'Admin' },
  courseCount: 2,
  seenCount: 3,
  createdAt: '2026-10-05T09:00:00.000Z',
};
const DETAILS = {
  ...SENT,
  courses: [
    { _id: ALGEBRA._id, title: 'Algebra 101', studentCount: 5, seenCount: 3 },
    { _id: PHYSICS._id, title: 'Physics Pro', studentCount: 4, seenCount: 0 },
  ],
};

const renderPage = (role: UserRole = 'Admin') => {
  server.use(
    signedInAs(makeUser(role)),
    ...referenceHandlers(),
    http.get('*/api/courses', () => ok([ALGEBRA, PHYSICS])),
  );
  return renderWithProviders(<AnnouncementsPage />);
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AnnouncementsPage (/admin/announcements)', () => {
  it('lists the sent announcements with a preview, the course count and who saw them', async () => {
    server.use(http.get('*/api/announcements/broadcasts', () => ok([SENT], { total: 1 })));
    renderPage('Moderator');

    expect(await screen.findByText('Exam on Friday')).toBeInTheDocument();
    expect(screen.getByText('Bring a calculator')).toBeInTheDocument();
    expect(screen.getByText('2 courses')).toBeInTheDocument();
    expect(screen.getByText('Seen by 3 students')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Announcements' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New announcement' })).toBeInTheDocument();
  });

  it('shows the empty state and the error with retry', async () => {
    server.use(http.get('*/api/announcements/broadcasts', () => ok([], { total: 0 })));
    const first = renderPage();
    expect(await screen.findByText('No announcements sent from here yet.')).toBeInTheDocument();
    first.unmount();

    server.use(http.get('*/api/announcements/broadcasts', () => fail(500, 'List unavailable')));
    renderPage();
    expect(await screen.findByText('List unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('opens the details on the right: text, courses and how many saw it in each', async () => {
    server.use(
      http.get('*/api/announcements/broadcasts', () => ok([SENT], { total: 1 })),
      http.get('*/api/announcements/broadcasts/b1', () => ok(DETAILS)),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Open details of Exam on Friday' }));

    const drawer = await screen.findByRole('dialog', { name: 'Announcement details' });
    expect(await within(drawer).findByText('Sent to 2 courses')).toBeInTheDocument();
    expect(within(drawer).getByText('calculator')).toBeInTheDocument();
    expect(within(drawer).getByText('Seen by 3 of 5 enrolled students')).toBeInTheDocument();
    expect(within(drawer).getByText('Seen by 0 of 4 enrolled students')).toBeInTheDocument();
  });

  it('sends one announcement to the ticked courses with the rich text and the picture', async () => {
    let form: Record<string, FormDataEntryValue> = {};
    let list: unknown[] = [];
    server.use(
      http.get('*/api/announcements/broadcasts', () => ok(list, { total: list.length })),
      http.post('*/api/announcements/broadcasts', async ({ request }) => {
        form = Object.fromEntries((await request.formData()).entries());
        list = [SENT];
        return ok({ _id: 'b1' });
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'New announcement' }));
    const dialog = await screen.findByRole('dialog', { name: 'New announcement' });
    await user.click(await within(dialog).findByRole('checkbox', { name: 'Algebra 101' }));
    await user.click(within(dialog).getByRole('checkbox', { name: 'Physics Pro' }));
    await user.type(within(dialog).getByLabelText(/^Title/), ' Exam on Friday ');
    await user.type(within(dialog).getByLabelText('Announcement'), 'Bring a calculator');
    const picture = new File(['png'], 'poster.png', { type: 'image/png' });
    await user.upload(fileInputIn(dialog), picture);
    await user.click(within(dialog).getByRole('button', { name: 'Send announcement' }));

    expect(await screen.findByText('Announcement sent to 2 courses')).toBeInTheDocument();
    expect(form.title).toBe('Exam on Friday');
    expect(form.description).toBe('Bring a calculator');
    expect(JSON.parse(typeof form.courseIds === 'string' ? form.courseIds : '')).toEqual([
      ALGEBRA._id,
      PHYSICS._id,
    ]);
    expect((form.image as File).name).toBe('poster.png');
    expect(await screen.findByText('Exam on Friday')).toBeInTheDocument();
  });

  it('asks for the courses, the title and the text before sending', async () => {
    let called = false;
    server.use(
      http.get('*/api/announcements/broadcasts', () => ok([], { total: 0 })),
      http.post('*/api/announcements/broadcasts', () => {
        called = true;
        return ok({ _id: 'b1' });
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'New announcement' }));
    const dialog = await screen.findByRole('dialog', { name: 'New announcement' });
    await user.click(within(dialog).getByRole('button', { name: 'Send announcement' }));

    expect(await within(dialog).findByText('Select at least one course')).toBeInTheDocument();
    expect(within(dialog).getByText('This field is required')).toBeInTheDocument();
    expect(called).toBe(false);

    await user.click(await within(dialog).findByRole('checkbox', { name: 'Algebra 101' }));
    await user.type(within(dialog).getByLabelText(/^Title/), 'Hello');
    await user.click(within(dialog).getByRole('button', { name: 'Send announcement' }));
    await waitFor(() => {
      expect(within(dialog).getAllByText('This field is required').length).toBeGreaterThan(0);
    });
    expect(called).toBe(false);
  });

  it('shows the server message when sending fails', async () => {
    server.use(
      http.get('*/api/announcements/broadcasts', () => ok([], { total: 0 })),
      http.post('*/api/announcements/broadcasts', () => fail(400, 'Only published courses')),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'New announcement' }));
    const dialog = await screen.findByRole('dialog', { name: 'New announcement' });
    await user.click(await within(dialog).findByRole('checkbox', { name: 'Algebra 101' }));
    await user.type(within(dialog).getByLabelText(/^Title/), 'Hello');
    await user.type(within(dialog).getByLabelText('Announcement'), 'Text');
    await user.click(within(dialog).getByRole('button', { name: 'Send announcement' }));

    expect(await within(dialog).findByText('Only published courses')).toBeInTheDocument();
  });
});
