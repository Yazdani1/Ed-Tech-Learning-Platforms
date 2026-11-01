import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { fail, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { setLocation } from '@/test/next-navigation';

import { ShellMessaging } from '../ShellMessaging';
import { StaffChatPage } from '../StaffChatPage';

import {
  ADMIN,
  CONVERSATION_ID,
  FakeSocket,
  STUDENT,
  TEACHER,
  conversation,
  message,
  objectId,
  renderWithSocket,
} from './chat-fixtures';

import type { User } from '@/schemas/auth.schema';

const OTHER = conversation({
  _id: objectId('7002'),
  student: { _id: objectId('0999'), name: 'Bilal Khan', avatar: '' },
  unreadByStaff: 0,
  lastMessage: '',
  lastMessageAt: '2026-10-19T10:00:00.000Z',
});

const renderInbox = (viewer: User, conversations: unknown[] = [conversation(), OTHER]) => {
  setLocation('/admin/chat');
  const socket = new FakeSocket();
  server.use(
    signedInAs(viewer),
    http.get('*/api/chat/conversations', () => ok(conversations)),
    http.get(`*/api/chat/conversations/${CONVERSATION_ID}/messages`, () => ok([message()])),
  );
  renderWithSocket(
    <>
      <ShellMessaging />
      <StaffChatPage />
    </>,
    socket,
  );
  return socket;
};

const list = () => screen.findByRole('list', { name: 'Conversations' });

describe('StaffChatPage', () => {
  beforeEach(() => {
    server.use(http.get('*/api/notifications/unread-count', () => ok({ count: 0 })));
  });

  it('lists conversations with unread counts and live presence', async () => {
    const socket = renderInbox(ADMIN);
    const conversations = await list();

    expect(within(conversations).getByText('Asha Rahman')).toBeInTheDocument();
    expect(within(conversations).getByText('Offline · 2 unread')).toBeInTheDocument();
    expect(within(conversations).getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByText('Select a conversation')).toBeInTheDocument();

    socket.serverEmit('chat:presenceSnapshot', [STUDENT._id]);
    expect(await within(conversations).findByText('Active now · 2 unread')).toBeInTheDocument();
    socket.serverEmit('chat:presence', { studentId: STUDENT._id, isOnline: false });
    expect(await within(conversations).findByText('Offline · 2 unread')).toBeInTheDocument();
  });

  it('opens a conversation, marks it read and replies to the student', async () => {
    const socket = renderInbox(ADMIN);
    const user = userEvent.setup();

    await user.click(within(await list()).getByRole('button', { name: /Asha Rahman/ }));
    expect(await screen.findByRole('heading', { name: 'Asha Rahman' })).toBeInTheDocument();
    expect(screen.getByText('asha@example.com')).toBeInTheDocument();
    expect(screen.getByRole('log', { name: 'Messages' })).toHaveTextContent('I need help');
    expect(socket.emitted('chat:markRead')).toContainEqual({ conversationId: CONVERSATION_ID });
    await waitFor(() => {
      expect(
        within(screen.getByRole('list', { name: 'Conversations' })).queryByText(/2 unread/),
      ).toBeNull();
    });

    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'On it{Enter}');
    expect(socket.emitted('chat:send')).toEqual([
      { content: 'On it', conversationId: CONVERSATION_ID },
    ]);

    await user.click(screen.getByRole('button', { name: 'Back to conversations' }));
    expect(screen.queryByRole('heading', { name: 'Asha Rahman' })).not.toBeInTheDocument();
  });

  it('moves a conversation with a new message to the top (live update)', async () => {
    const socket = renderInbox(ADMIN);
    await list();

    socket.serverEmit('chat:conversationUpdated', {
      ...OTHER,
      unreadByStaff: 1,
      lastMessage: 'Hello?',
      lastMessageAt: '2026-10-21T10:00:00.000Z',
    });
    const conversations = await list();
    await waitFor(() => {
      expect(within(conversations).getAllByRole('button')[0]).toHaveTextContent('Hello?');
    });
    expect(within(conversations).getAllByRole('button')[0]).toHaveTextContent('Bilal Khan');
  });

  it('never shows a student email to a teacher, even from a live update', async () => {
    const socket = renderInbox(TEACHER, [
      conversation({ student: { _id: STUDENT._id, name: 'Asha Rahman' } }),
    ]);
    const user = userEvent.setup();

    socket.serverEmit('chat:conversationUpdated', conversation());
    await user.click(within(await list()).getByRole('button', { name: /Asha Rahman/ }));
    expect(await screen.findByRole('heading', { name: 'Asha Rahman' })).toBeInTheDocument();
    expect(screen.queryByText('asha@example.com')).not.toBeInTheDocument();
  });

  it('keeps the student email for admins after a live update without one', async () => {
    const socket = renderInbox(ADMIN);
    const user = userEvent.setup();
    await list();

    socket.serverEmit('chat:conversationUpdated', {
      ...conversation(),
      student: { _id: STUDENT._id, name: 'Asha Rahman', avatar: '' },
      lastMessage: 'Still there?',
      lastMessageAt: '2026-10-22T10:00:00.000Z',
    });
    await waitFor(() => {
      expect(
        within(screen.getByRole('list', { name: 'Conversations' })).getByText('Still there?'),
      ).toBeInTheDocument();
    });
    await user.type(screen.getByRole('searchbox', { name: 'Search students...' }), 'asha@example');
    expect(within(await list()).getByText('Asha Rahman')).toBeInTheDocument();
    await user.click(within(await list()).getByRole('button', { name: /Asha Rahman/ }));
    expect(await screen.findByText('asha@example.com')).toBeInTheDocument();
  });

  it('searches students and shows the empty and error states', async () => {
    renderInbox(ADMIN);
    const user = userEvent.setup();
    await list();

    await user.type(screen.getByRole('searchbox', { name: 'Search students...' }), 'bilal');
    expect(screen.queryByText('Asha Rahman')).not.toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Search students...' }), 'zzz');
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('shows the error of a failed inbox load', async () => {
    setLocation('/admin/chat');
    server.use(
      signedInAs(ADMIN),
      http.get('*/api/chat/conversations', () => fail(500, 'Inbox failed')),
    );
    renderWithSocket(<StaffChatPage />, new FakeSocket());
    expect(await screen.findByText('Inbox failed')).toBeInTheDocument();
  });
});
