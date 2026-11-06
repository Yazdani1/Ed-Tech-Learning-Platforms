import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { setLocation } from '@/test/next-navigation';

import { ShellMessaging } from '../ShellMessaging';

import {
  ADMIN,
  CONVERSATION_ID,
  FakeSocket,
  STUDENT,
  conversation,
  message,
  objectId,
  renderWithSocket,
} from './chat-fixtures';

const staffReply = message({
  _id: objectId('8003'),
  senderId: objectId('0002'),
  senderName: 'Rafi Admin',
  senderRole: 'Admin',
  content: 'Answer from staff',
});

describe('ShellMessaging / ChatWidget', () => {
  beforeEach(() => {
    server.use(
      http.get('*/api/notifications/unread-count', () => ok({ count: 0 })),
      http.get('*/api/chat/conversations', () => ok(conversation({ unreadByStudent: 1 }))),
      http.get(`*/api/chat/conversations/${CONVERSATION_ID}/messages`, () => ok([staffReply])),
    );
  });

  it('shows students a chat button with their unread count that opens the chat', async () => {
    setLocation('/student/courses');
    server.use(signedInAs(STUDENT));
    const socket = new FakeSocket();
    renderWithSocket(<ShellMessaging />, socket);
    const user = userEvent.setup();

    expect(await screen.findByRole('button', { name: 'Support Chat (1 unread)' })).toBeVisible();
    socket.serverEmit('chat:message', { ...staffReply, _id: objectId('8004') });
    expect(await screen.findByRole('button', { name: 'Support Chat (2 unread)' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Support Chat (2 unread)' }));
    const chat = screen.getByRole('dialog', { name: 'Support Chat' });
    expect(await screen.findByText('Answer from staff')).toBeInTheDocument();
    expect(socket.emitted('chat:markRead')).toContainEqual({ conversationId: CONVERSATION_ID });

    await user.click(screen.getByRole('button', { name: 'Close support chat' }));
    expect(chat).not.toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Open support chat' })).toBeVisible();
  });

  it('moves the focus into the chat and back, and closes on Escape', async () => {
    setLocation('/student/courses');
    server.use(signedInAs(STUDENT));
    renderWithSocket(<ShellMessaging />, new FakeSocket());
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /support chat/i }));
    const chat = screen.getByRole('dialog', { name: 'Support Chat' });
    await waitFor(() => {
      expect(chat).toHaveFocus();
    });
    await user.keyboard('{Escape}');
    expect(chat).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /support chat/i })).toHaveFocus();
    });
  });

  it.each(['/student/chat', '/student/group-chat'])(
    'hides the chat button on %s (it would cover the composer)',
    async (path) => {
      setLocation(path);
      let loaded = false;
      server.use(
        http.get('*/api/auth/me', () => {
          loaded = true;
          return ok(STUDENT);
        }),
      );
      renderWithSocket(<ShellMessaging />, new FakeSocket());
      await waitFor(() => {
        expect(loaded).toBe(true);
      });
      expect(screen.queryByRole('button', { name: /support chat/i })).not.toBeInTheDocument();
    },
  );

  it('shows no chat button to staff', async () => {
    setLocation('/admin/courses');
    let loaded = false;
    server.use(
      http.get('*/api/auth/me', () => {
        loaded = true;
        return ok(ADMIN);
      }),
    );
    renderWithSocket(<ShellMessaging />, new FakeSocket());

    await waitFor(() => {
      expect(loaded).toBe(true);
    });
    expect(screen.queryByRole('button', { name: /support chat/i })).not.toBeInTheDocument();
  });
});
