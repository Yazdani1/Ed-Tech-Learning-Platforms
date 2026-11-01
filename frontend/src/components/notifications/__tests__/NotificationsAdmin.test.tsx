import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { NotificationsPage } from '../NotificationsPage';

import { makeNotification } from './notification-fixtures';

const SENT = makeNotification({ isRead: undefined, targetRoles: ['Student', 'Teacher'] });

const renderAdmin = (search = '') => {
  setLocation('/admin/notifications', search);
  server.use(
    signedInAs(makeUser('Admin')),
    http.get('*/api/notifications', () => ok([], { total: 0, page: 1, limit: 10 })),
    http.get('*/api/notifications/unread-count', () => ok({ count: 0 })),
    http.get('*/api/notifications/sent/all', () => ok([SENT], { total: 1, page: 1, limit: 10 })),
  );
  return renderWithProviders(
    <ConfirmProvider>
      <NotificationsPage />
    </ConfirmProvider>,
  );
};

const user = () => userEvent.setup();

describe('NotificationsPage (Super Admin, Admin)', () => {
  it('opens on the send form and switches tabs through the URL', async () => {
    renderAdmin();

    expect(
      await screen.findByRole('heading', { name: 'Send Push Notification' }),
    ).toBeInTheDocument();
    await user().click(screen.getByRole('tab', { name: 'Sent Notifications' }));
    expect(router.replace).toHaveBeenCalledWith('/admin/notifications?tab=sent', { scroll: false });
  });

  it('checks the form and sends the notification', async () => {
    let body: unknown = null;
    server.use(
      http.post('*/api/notifications', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { success: true, message: 'Notification sent to 3 users', data: SENT },
          { status: 201 },
        );
      }),
    );
    renderAdmin();
    const u = user();

    await u.click(await screen.findByRole('button', { name: 'Send Notification' }));
    expect(await screen.findAllByText('This field is required')).toHaveLength(2);

    await u.type(screen.getByRole('textbox', { name: /Title/ }), 'Holiday');
    await u.type(screen.getByRole('textbox', { name: 'Message' }), '<p>Closed on Friday</p>');
    await u.click(screen.getByRole('checkbox', { name: 'Student' }));
    await u.click(screen.getByRole('button', { name: 'Send Notification' }));
    expect(await screen.findByText('Select at least one recipient role')).toBeInTheDocument();

    await u.click(screen.getByRole('checkbox', { name: 'Teacher' }));
    await u.click(screen.getByRole('button', { name: 'Send Notification' }));
    expect(await screen.findByText('Notification sent to 3 users')).toBeInTheDocument();
    expect(body).toEqual({
      title: 'Holiday',
      message: '<p>Closed on Friday</p>',
      priority: 'Normal',
      targetRoles: ['Teacher'],
    });
    expect(screen.getByRole('textbox', { name: /Title/ })).toHaveValue('');
  });

  it('shows the backend error of a failed send', async () => {
    server.use(
      http.post('*/api/notifications', () => fail(400, 'No users found for the selected roles')),
    );
    renderAdmin();
    const u = user();

    await u.type(await screen.findByRole('textbox', { name: /Title/ }), 'Hello');
    await u.type(screen.getByRole('textbox', { name: 'Message' }), 'Hi all');
    await u.click(screen.getByRole('button', { name: 'Send Notification' }));
    expect(await screen.findByText('No users found for the selected roles')).toBeInTheDocument();
  });

  it('edits a sent notification', async () => {
    let body: unknown = null;
    server.use(
      http.put('*/api/notifications/:id', async ({ request }) => {
        body = await request.json();
        return ok(SENT);
      }),
    );
    renderAdmin('tab=sent');
    const u = user();

    expect(await screen.findByText('Student, Teacher')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Actions for Exam schedule' }));
    await u.click(screen.getByRole('menuitem', { name: 'Edit' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Notification' });
    const title = within(dialog).getByRole('textbox', { name: /Title/ });
    expect(title).toHaveValue('Exam schedule');
    await u.clear(title);
    await u.type(title, 'Exam moved');
    await u.click(within(dialog).getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('Notification updated')).toBeInTheDocument();
    expect(body).toEqual({
      title: 'Exam moved',
      message: SENT.message,
      priority: 'High',
      targetRoles: ['Student', 'Teacher'],
    });
  });

  it('deletes a sent notification after confirming', async () => {
    let deleted = '';
    server.use(
      http.delete('*/api/notifications/:id', ({ params }) => {
        deleted = String(params.id);
        return HttpResponse.json({ success: true, message: 'Notification deleted' });
      }),
    );
    renderAdmin('tab=sent');
    const u = user();

    await u.click(await screen.findByRole('button', { name: 'Actions for Exam schedule' }));
    await u.click(screen.getByRole('menuitem', { name: 'Delete' }));
    const confirm = screen.getByRole('dialog', { name: 'Delete Notification' });
    expect(confirm).toHaveTextContent('Recipients will no longer see it.');
    await u.click(within(confirm).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Notification deleted')).toBeInTheDocument();
    await waitFor(() => {
      expect(deleted).toBe(SENT._id);
    });
  });

  it('shows the empty sent list', async () => {
    renderAdmin('tab=sent');
    server.use(
      http.get('*/api/notifications/sent/all', () => ok([], { total: 0, page: 1, limit: 10 })),
    );
    expect(await screen.findByText('No notifications sent yet.')).toBeInTheDocument();
  });
});
