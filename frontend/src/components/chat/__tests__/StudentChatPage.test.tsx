import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { fail, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { setLocation } from '@/test/next-navigation';

import { ShellMessaging } from '../ShellMessaging';
import { StudentChatPage } from '../StudentChatPage';

import {
  CONVERSATION_ID,
  FakeSocket,
  STUDENT,
  conversation,
  message,
  objectId,
  renderWithSocket,
} from './chat-fixtures';

const MESSAGES_URL = `*/api/chat/conversations/${CONVERSATION_ID}/messages`;

const renderPage = (socket = new FakeSocket()) => {
  setLocation('/student/chat');
  server.use(
    signedInAs(STUDENT),
    http.get('*/api/chat/conversations', () => ok(conversation({ unreadByStudent: 3 }))),
  );
  renderWithSocket(
    <>
      <ShellMessaging />
      <StudentChatPage />
    </>,
    socket,
  );
  return socket;
};

const staffReply = message({
  _id: objectId('8002'),
  senderId: objectId('0002'),
  senderName: 'Rafi Admin',
  senderRole: 'Admin',
  content: 'How can we help?',
});

describe('StudentChatPage', () => {
  beforeEach(() => {
    server.use(http.get('*/api/notifications/unread-count', () => ok({ count: 0 })));
  });

  it('shows the welcome text when there are no messages yet, and marks the chat read', async () => {
    server.use(http.get(MESSAGES_URL, () => ok([])));
    const socket = renderPage();

    expect(await screen.findByText('Welcome to Support Chat! 👋')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Support Chat' })).toBeInTheDocument();
    expect(socket.emitted('chat:markRead')).toContainEqual({ conversationId: CONVERSATION_ID });
    // The floating chat button is not shown on the chat page itself
    expect(screen.queryByRole('button', { name: /support chat/i })).not.toBeInTheDocument();
  });

  it('lists the messages, sends a new one with Enter and shows live replies and typing', async () => {
    server.use(http.get(MESSAGES_URL, () => ok([message()])));
    const socket = renderPage();
    const user = userEvent.setup();

    expect(await screen.findByText('I need help')).toBeInTheDocument();
    expect(screen.getByText(/^You/)).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Message' }), '  Thanks!  {Enter}');
    expect(socket.emitted('chat:send')).toEqual([{ content: 'Thanks!' }]);
    expect(socket.emitted('chat:typing')).toContainEqual({
      conversationId: CONVERSATION_ID,
      isTyping: true,
    });
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('');

    socket.serverEmit('chat:typing', {
      conversationId: CONVERSATION_ID,
      userId: objectId('0002'),
      userName: 'Rafi Admin',
      userRole: 'Admin',
      isTyping: true,
    });
    expect(screen.getByText('Rafi Admin is typing')).toBeInTheDocument();

    socket.serverEmit('chat:message', staffReply);
    expect(await screen.findByText('How can we help?')).toBeInTheDocument();
    expect(screen.queryByText('Rafi Admin is typing')).not.toBeInTheDocument();
    // A reply read on screen is marked read at once
    await waitFor(() => {
      expect(socket.emitted('chat:markRead').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('filters the messages with the search box', async () => {
    server.use(http.get(MESSAGES_URL, () => ok([message(), staffReply])));
    renderPage();
    const user = userEvent.setup();

    expect(await screen.findByText('How can we help?')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Search messages...' }), 'help?');
    expect(screen.queryByText('I need help')).not.toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox', { name: 'Search messages...' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search messages...' }), 'zzz');
    expect(screen.getByText('No messages match your search.')).toBeInTheDocument();
  });

  it('keeps the send button off for an empty message and shows a load error', async () => {
    server.use(http.get(MESSAGES_URL, () => fail(500, 'Messages failed')));
    renderPage();

    expect(await screen.findByText('Messages failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  });

  it('turns a socket error into a translated toast', async () => {
    server.use(http.get(MESSAGES_URL, () => ok([])));
    const socket = renderPage();

    await screen.findByText('Welcome to Support Chat! 👋');
    socket.serverEmit('chat:error', 'Message is too long');
    expect(await screen.findByText('Message is too long')).toBeInTheDocument();
  });
});
