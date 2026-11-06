import { screen } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { SocketContext } from '@/context/SocketContext';
import { makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { useNotificationLiveSync } from '../useNotificationLiveSync';
import { NavUnreadBadge } from '../NavUnreadBadge';
import { TopBarAlerts } from '../TopBarAlerts';

import type { Socket } from 'socket.io-client';

type Handler = (payload: unknown) => void;

const LiveSync = () => {
  useNotificationLiveSync();
  return null;
};

describe('TopBarAlerts', () => {
  it('links to the area chat and notifications with their unread counts', async () => {
    setLocation('/teacher/courses');
    server.use(
      signedInAs(makeUser('Teacher')),
      http.get('*/api/notifications/unread-count', () => ok({ count: 4 })),
      http.get('*/api/chat/conversations', () =>
        ok([
          { _id: 'c1', unreadByStaff: 2, unreadByStudent: 0 },
          { _id: 'c2', unreadByStaff: 1, unreadByStudent: 0 },
        ]),
      ),
    );
    renderWithProviders(<TopBarAlerts />);

    expect(await screen.findByRole('link', { name: 'Notifications (4 unread)' })).toHaveAttribute(
      'href',
      '/teacher/notifications',
    );
    expect(await screen.findByRole('link', { name: 'Support Chat (3 unread)' })).toHaveAttribute(
      'href',
      '/teacher/chat',
    );
  });

  it('refreshes the badge when a notification arrives over the socket', async () => {
    setLocation('/student/courses');
    let count = 0;
    const handlers = new Map<string, Handler>();
    const socket = {
      on: (event: string, handler: Handler) => handlers.set(event, handler),
      off: (event: string) => handlers.delete(event),
    };
    server.use(
      signedInAs(makeUser('Student')),
      http.get('*/api/notifications/unread-count', () => ok({ count })),
      http.get('*/api/notifications', () => ok([], { total: 0, page: 1, limit: 10 })),
      http.get('*/api/chat/conversations', () => ok({ _id: 'c1', unreadByStudent: 0 })),
    );
    renderWithProviders(
      // Only on/off are used by the live hooks
      <SocketContext.Provider value={socket as unknown as Socket}>
        <LiveSync />
        <NavUnreadBadge kind="notifications">
          <span>bell</span>
        </NavUnreadBadge>
        <TopBarAlerts />
      </SocketContext.Provider>,
    );

    expect(await screen.findByRole('link', { name: 'Notifications' })).toBeInTheDocument();
    count = 1;
    handlers.get('notification:new')?.({
      notification: {
        _id: 'n1',
        title: 'New',
        message: '<p>x</p>',
        priority: 'Normal',
        createdAt: '2026-10-20T10:00:00.000Z',
      },
    });
    expect(
      await screen.findByRole('link', { name: 'Notifications (1 unread)' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2);
  });
});
