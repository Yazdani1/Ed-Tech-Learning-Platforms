import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { NotificationsPage } from '../NotificationsPage';

import { makeNotification, objectId } from './notification-fixtures';

import type { UserRole } from '@/types';

const UNREAD = makeNotification();
const READ = makeNotification({
  _id: objectId('5002'),
  title: 'Welcome',
  isRead: true,
  priority: 'Low',
});

const renderInbox = (role: UserRole, items = [UNREAD, READ], unread = 1) => {
  setLocation(`/${role === 'Student' ? 'student' : 'teacher'}/notifications`);
  server.use(
    signedInAs(makeUser(role)),
    http.get('*/api/notifications', () => ok(items, { total: items.length, page: 1, limit: 10 })),
    http.get('*/api/notifications/unread-count', () => ok({ count: unread })),
  );
  return renderWithProviders(
    <ConfirmProvider>
      <NotificationsPage />
    </ConfirmProvider>,
  );
};

describe('NotificationsPage (inbox)', () => {
  it('shows a student their notifications without the send tabs', async () => {
    renderInbox('Student');

    expect(await screen.findByText('Exam schedule')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
    expect(screen.queryByText(/^Showing /)).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('opens a notification (sanitised message, sender) and marks it read', async () => {
    let readId = '';
    server.use(
      http.patch('*/api/notifications/:id/read', ({ params }) => {
        readId = String(params.id);
        return ok(null);
      }),
    );
    renderInbox('Teacher', [
      makeNotification({ message: '<p>Hi<img src=x onerror="alert(1)"></p>' }),
    ]);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Show or hide: Exam schedule' }));
    expect(await screen.findByText('Hi')).toBeInTheDocument();
    expect(document.querySelector('img[onerror]')).toBeNull();
    expect(screen.getByText('Nadia Admin')).toBeInTheDocument();
    await waitFor(() => {
      expect(readId).toBe(UNREAD._id);
    });
  });

  it('marks all read (disabled when nothing is unread)', async () => {
    let called = false;
    server.use(
      http.patch('*/api/notifications/read-all', () => {
        called = true;
        return HttpResponse.json({ success: true, message: 'All notifications marked as read' });
      }),
    );
    renderInbox('Student');
    const user = userEvent.setup();

    const button = await screen.findByRole('button', { name: 'Mark all read' });
    await waitFor(() => {
      expect(button).toBeEnabled();
    });
    await user.click(button);
    expect(await screen.findByText('All notifications marked as read')).toBeInTheDocument();
    expect(called).toBe(true);
  });

  it('shows the empty and error states', async () => {
    const { unmount } = renderInbox('Student', [], 0);
    expect(await screen.findByText('No notifications yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark all read' })).toBeDisabled();
    unmount();

    server.use(http.get('*/api/notifications', () => fail(500, 'Inbox failed')));
    renderWithProviders(
      <ConfirmProvider>
        <NotificationsPage />
      </ConfirmProvider>,
    );
    expect(await screen.findByText('Inbox failed')).toBeInTheDocument();
  });

  it('shows a Moderator only the inbox (sending is for Super Admin and Admin)', async () => {
    renderInbox('Moderator');
    expect(await screen.findByText('Exam schedule')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Send Notification' })).not.toBeInTheDocument();
  });
});
