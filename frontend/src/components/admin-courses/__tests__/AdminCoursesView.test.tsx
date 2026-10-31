import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { AdminCoursesView } from '../list/AdminCoursesView';

import { makeCourse, referenceHandlers } from './admin-courses-fixtures';

import type { UserRole } from '@/types';

const PUBLISHED = makeCourse('001', { title: 'React Basics' });
const DRAFT = makeCourse('002', {
  title: 'Node Advanced',
  status: 'Draft',
  publishedAt: null,
  pricing: 'Free',
  price: 0,
  includedInSubscription: true,
});

const renderView = (role: UserRole = 'Admin') => {
  server.use(signedInAs(makeUser(role)), ...referenceHandlers());
  return renderWithProviders(
    <ConfirmProvider>
      <AdminCoursesView />
    </ConfirmProvider>,
  );
};

const openMenu = async (title: string): Promise<void> => {
  await userEvent
    .setup()
    .click(await screen.findByRole('button', { name: `Actions for ${title}` }));
};

describe('AdminCoursesView', () => {
  it('shows every course with status, price, figures and the manager actions', async () => {
    server.use(http.get('*/api/courses', () => ok([PUBLISHED, DRAFT], { total: 2 })));
    renderView('Admin');

    expect(await screen.findByRole('heading', { name: 'React Basics' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Node Advanced' })).toBeInTheDocument();
    expect(screen.getByText(/^Published • /)).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('৳1,200')).toBeInTheDocument();
    expect(screen.getAllByText('৳3,600')).toHaveLength(2);
    expect(screen.getByText('Subscription')).toBeInTheDocument();
    expect(screen.getByText('2 courses available')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create Course' })).toHaveAttribute(
      'href',
      '/admin/courses/create',
    );
    expect(screen.getByRole('button', { name: 'Bulk Edit' })).toBeEnabled();
    const [card] = screen.getAllByRole('article');
    expect(card).toBeDefined();
    const inCard = within(card ?? document.body);
    expect(inCard.getByRole('link', { name: 'Edit course' })).toHaveAttribute(
      'href',
      `/admin/courses/${PUBLISHED._id}/edit`,
    );
    expect(inCard.getByRole('link', { name: 'Student view' })).toHaveAttribute(
      'href',
      `/admin/courses/${PUBLISHED._id}/learn`,
    );
    expect(inCard.getByRole('link', { name: 'React Basics' })).toHaveAttribute(
      'href',
      `/admin/courses/${PUBLISHED._id}`,
    );
  });

  it('sends the URL filters to the API and updates the URL when a filter changes', async () => {
    setLocation('/admin/courses', 'status=Draft&search=node');
    let query = '';
    server.use(
      http.get('*/api/courses', ({ request }) => {
        query = new URL(request.url).search;
        return ok([DRAFT]);
      }),
    );
    renderView('Super Admin');

    expect(await screen.findByText('1 course matches your filters')).toBeInTheDocument();
    expect(query).toContain('status=Draft');
    expect(query).toContain('search=node');
    expect(screen.getByText('2 filters active')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Show filters' }));
    await user.click(screen.getByRole('combobox', { name: 'Pricing' }));
    await user.click(await screen.findByRole('option', { name: 'Free' }));
    expect(router.replace).toHaveBeenLastCalledWith(
      expect.stringContaining('pricing=Free'),
      expect.anything(),
    );

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(router.replace).toHaveBeenLastCalledWith('/admin/courses', expect.anything());
  });

  it('gives Moderators published courses only, without status, figures or manager actions', async () => {
    let query = '';
    server.use(
      http.get('*/api/courses', ({ request }) => {
        query = new URL(request.url).search;
        return ok([PUBLISHED]);
      }),
    );
    renderView('Moderator');

    expect(await screen.findByRole('heading', { name: 'React Basics' })).toBeInTheDocument();
    expect(query).toContain('status=Published');
    expect(screen.getByText('1 published course available')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bulk Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Create Course' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit course' })).not.toBeInTheDocument();
    expect(screen.queryByText('Earned this month')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      `/admin/courses/${PUBLISHED._id}/learn`,
    );

    await openMenu('React Basics');
    expect(screen.getByRole('menuitem', { name: 'Enrollments' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Unpublish' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    server.use(http.get('*/api/courses', () => ok([])));
    renderView('Admin');

    expect(await screen.findByText('No courses found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bulk Edit' })).toBeDisabled();
  });

  it('shows the error with a retry button', async () => {
    server.use(http.get('*/api/courses', () => fail(500, 'Database down')));
    renderView('Admin');

    expect(await screen.findByText('Database down')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('publishes a draft', async () => {
    let body: unknown;
    server.use(
      http.get('*/api/courses', () => ok([DRAFT])),
      http.patch(`*/api/courses/${DRAFT._id}/status`, async ({ request }) => {
        body = await request.json();
        return ok(DRAFT);
      }),
    );
    renderView('Admin');

    await openMenu('Node Advanced');
    await userEvent.setup().click(screen.getByRole('menuitem', { name: 'Publish' }));

    expect(await screen.findByText('"Node Advanced" is now published')).toBeInTheDocument();
    expect(body).toEqual({ status: 'Published' });
  });

  it('asks before unpublishing', async () => {
    let body: unknown;
    server.use(
      http.get('*/api/courses', () => ok([PUBLISHED])),
      http.patch(`*/api/courses/${PUBLISHED._id}/status`, async ({ request }) => {
        body = await request.json();
        return ok(PUBLISHED);
      }),
    );
    renderView('Admin');
    const user = userEvent.setup();

    await openMenu('React Basics');
    await user.click(screen.getByRole('menuitem', { name: 'Unpublish' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Unpublish' }));

    expect(await screen.findByText('"React Basics" is now a draft')).toBeInTheDocument();
    expect(body).toEqual({ status: 'Draft' });
  });

  it('shows the backend message when a course with enrolments cannot be deleted', async () => {
    server.use(
      http.get('*/api/courses', () => ok([PUBLISHED])),
      http.delete(`*/api/courses/${PUBLISHED._id}`, () =>
        fail(400, 'This course has 4 enrolment(s); unpublish it instead of deleting'),
      ),
    );
    renderView('Admin');
    const user = userEvent.setup();

    await openMenu('React Basics');
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    expect(
      await screen.findByText('This course has 4 enrolment(s); unpublish it instead of deleting'),
    ).toBeInTheDocument();
  });

  it('deletes a course and refreshes the list', async () => {
    let courses = [PUBLISHED, DRAFT];
    server.use(
      http.get('*/api/courses', () => ok(courses)),
      http.delete(`*/api/courses/${DRAFT._id}`, () => {
        courses = [PUBLISHED];
        return ok(null);
      }),
    );
    renderView('Super Admin');
    const user = userEvent.setup();

    await openMenu('Node Advanced');
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    expect(await screen.findByText('Course deleted')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Node Advanced' })).not.toBeInTheDocument();
    });
  });
});
