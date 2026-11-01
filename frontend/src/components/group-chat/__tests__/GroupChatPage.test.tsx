import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, type RequestHandler } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { SocketContext } from '@/context/SocketContext';
import { fail, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { GroupChatPage } from '../GroupChatPage';

import {
  ADMIN,
  CARD_ID,
  CHANNEL_ID,
  OTHER,
  rawCard,
  rawChannel,
  rawMessage,
  readHandlers,
  STUDENT,
  studyGroup,
} from './fixtures';

import type { User } from '@/schemas/auth.schema';
import type { Socket } from 'socket.io-client';

type Handler = (payload: unknown) => void;

/** A stand-in for the shared socket: records emits and lets the test push server events. */
const makeSocket = () => {
  const listeners = new Map<string, Set<Handler>>();
  const emitted: [string, unknown][] = [];
  const fake = {
    on: (event: string, handler: Handler) => {
      const set = listeners.get(event) ?? new Set<Handler>();
      set.add(handler);
      listeners.set(event, set);
      return fake;
    },
    off: (event: string, handler: Handler) => {
      listeners.get(event)?.delete(handler);
      return fake;
    },
    emit: (event: string, payload: unknown) => {
      emitted.push([event, payload]);
      return fake;
    },
  };
  const serverEmit = (event: string, payload: unknown): void => {
    act(() => {
      listeners.get(event)?.forEach((handler) => {
        handler(payload);
      });
    });
  };
  return { socket: fake as unknown as Socket, emitted, serverEmit };
};

const renderPage = (user: User = STUDENT, socket: Socket | null = null) => {
  server.use(signedInAs(user));
  return renderWithProviders(
    <SocketContext.Provider value={socket}>
      <ConfirmProvider>
        <GroupChatPage />
      </ConfirmProvider>
    </SocketContext.Provider>,
  );
};

/** Read handlers first, then the test's own handlers (later server.use calls win). */
const mockApi = (read: RequestHandler[], ...overrides: RequestHandler[]): void => {
  server.use(...read);
  server.use(...overrides);
};

const HELLO = rawMessage('64b7f0c2a1b2c3d4e5f6d001', CHANNEL_ID, OTHER, 'Hello class');

describe('GroupChatPage', () => {
  it('shows my channels with unread counts and opens the first one', async () => {
    server.use(...readHandlers([studyGroup()], [], [HELLO]));
    renderPage();

    const mine = await screen.findByRole('list', { name: 'My Channels' });
    expect(within(mine).getByText('Physics Study Group')).toBeInTheDocument();
    expect(within(mine).getByText('2 members')).toBeInTheDocument();
    expect(await screen.findByText('Hello class')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Physics Study Group' })).toBeInTheDocument();
  });

  it('shows the empty state and the select prompt without channels', async () => {
    server.use(...readHandlers([]));
    renderPage();
    expect(await screen.findByText('You have not joined any channel yet.')).toBeInTheDocument();
    expect(screen.getByText('Create or select a channel to start chatting.')).toBeInTheDocument();
  });

  it('shows the error with a retry button when the channels fail to load', async () => {
    mockApi(
      readHandlers([]),
      http.get('*/api/group-chat/channels', () => fail(500, 'Database unavailable')),
    );
    renderPage();
    expect(await screen.findByText('Database unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('marks the open channel read and joins its socket room', async () => {
    const reads: string[] = [];
    const { socket, emitted } = makeSocket();
    mockApi(
      readHandlers([studyGroup()], [], [HELLO]),
      http.patch('*/api/group-chat/channels/:id/read', ({ params }) => {
        reads.push(String(params.id));
        return ok(undefined);
      }),
    );
    renderPage(STUDENT, socket);
    await screen.findByText('Hello class');
    await waitFor(() => {
      expect(reads).toContain(CHANNEL_ID);
    });
    expect(emitted).toContainEqual(['groupChat:joinRoom', { channelId: CHANNEL_ID }]);
  });

  it('shows a public card from Discover and joins it', async () => {
    const user = userEvent.setup();
    let joined = false;
    const card = rawCard(CARD_ID, 'Chemistry Club', 'Public');
    const member = rawChannel({
      id: CARD_ID,
      name: 'Chemistry Club',
      members: [
        { user: OTHER, role: 'Admin' },
        { user: STUDENT, role: 'Member' },
      ],
    });
    mockApi(
      readHandlers([]),
      http.get('*/api/group-chat/channels', () => ok(joined ? [member] : [])),
      http.get('*/api/group-chat/channels/discover', () => ok([joined ? member : card])),
      http.post('*/api/group-chat/channels/:id/join', () => {
        joined = true;
        return ok(member);
      }),
    );
    renderPage();

    const discover = await screen.findByRole('list', { name: 'Discover Channels' });
    await user.click(within(discover).getByText('Chemistry Club'));
    expect(screen.getByText('Chemistry Club description')).toBeInTheDocument();
    expect(screen.queryByLabelText('Message')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Join this channel' }));

    expect(await screen.findByText('Joined channel')).toBeInTheDocument();
    expect(await screen.findByLabelText('Message')).toBeInTheDocument();
  });

  it('sends a join request to a private channel and cancels it', async () => {
    const user = userEvent.setup();
    let pending = false;
    mockApi(
      readHandlers([]),
      http.get('*/api/group-chat/channels/discover', () =>
        ok([rawCard(CARD_ID, 'Secret Society', 'Private', pending)]),
      ),
      http.post('*/api/group-chat/channels/:id/join', () => {
        pending = true;
        return ok(rawCard(CARD_ID, 'Secret Society', 'Private', true));
      }),
      http.delete('*/api/group-chat/channels/:id/join', () => {
        pending = false;
        return ok(rawCard(CARD_ID, 'Secret Society', 'Private', false));
      }),
    );
    renderPage();

    await user.click(await screen.findByText('Secret Society'));
    await user.click(screen.getByRole('button', { name: 'Request to join' }));
    expect(await screen.findByRole('button', { name: 'Join request sent' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Cancel request' }));
    expect(await screen.findByText('Join request cancelled')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Request to join' })).toBeEnabled();
  });

  it('sends a message with a file as multipart', async () => {
    const user = userEvent.setup();
    let sent: FormData | null = null;
    mockApi(
      readHandlers([studyGroup()], [], []),
      http.post('*/api/group-chat/channels/:id/messages', async ({ request }) => {
        sent = await request.formData();
        return ok(rawMessage('64b7f0c2a1b2c3d4e5f6d002', CHANNEL_ID, STUDENT, 'See the notes'), {});
      }),
    );
    renderPage();

    const input = await screen.findByLabelText('Message');
    await user.type(input, 'See the notes');
    const fileInput = screen.getByTestId('group-chat-file-input');
    await user.upload(fileInput, new File(['notes'], 'notes.txt', { type: 'text/plain' }));
    expect(screen.getByRole('button', { name: 'Remove notes.txt' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('See the notes', { selector: 'p' })).toBeInTheDocument();
    expect(sent).not.toBeNull();
    const form = sent as unknown as FormData;
    expect(form.get('content')).toBe('See the notes');
    expect((form.get('files') as File).name).toBe('notes.txt');
    expect(input).toHaveValue('');
  });

  it("shows the backend's message when a file type is refused", async () => {
    const user = userEvent.setup();
    mockApi(
      readHandlers([studyGroup()], [], []),
      http.post('*/api/group-chat/channels/:id/messages', () =>
        fail(400, 'This file type is not allowed'),
      ),
    );
    renderPage();
    await user.upload(
      await screen.findByTestId('group-chat-file-input'),
      new File(['MZ'], 'virus.exe', { type: 'application/octet-stream' }),
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('This file type is not allowed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove virus.exe' })).toBeInTheDocument();
  });

  it('refuses files over 10 MB before sending', async () => {
    const user = userEvent.setup();
    server.use(...readHandlers([studyGroup()], [], []));
    renderPage();
    const big = new File(['x'], 'huge.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 });
    await user.upload(await screen.findByTestId('group-chat-file-input'), big);
    expect(await screen.findByText('huge.pdf is larger than 10 MB.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove huge.pdf' })).not.toBeInTheDocument();
  });

  it('adds live messages and typing notices from the socket', async () => {
    const { socket, serverEmit } = makeSocket();
    server.use(...readHandlers([studyGroup()], [], [HELLO]));
    renderPage(STUDENT, socket);
    await screen.findByText('Hello class');

    serverEmit('groupChat:typing', {
      channelId: CHANNEL_ID,
      userId: OTHER._id,
      userName: OTHER.name,
      userRole: 'Student',
      isTyping: true,
    });
    expect(screen.getByText('Rahim Uddin is typing')).toBeInTheDocument();

    serverEmit(
      'groupChat:message',
      rawMessage('64b7f0c2a1b2c3d4e5f6d003', CHANNEL_ID, OTHER, 'Live hello'),
    );
    expect(await screen.findByText('Live hello')).toBeInTheDocument();
    expect(screen.queryByText('Rahim Uddin is typing')).not.toBeInTheDocument();
  });

  it('lets a member leave a channel after confirming', async () => {
    const user = userEvent.setup();
    let left = false;
    mockApi(
      readHandlers([studyGroup()], [], []),
      http.get('*/api/group-chat/channels', () => ok(left ? [] : [studyGroup()])),
      http.post('*/api/group-chat/channels/:id/leave', () => {
        left = true;
        return ok(undefined);
      }),
    );
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Channel actions' }));
    expect(screen.queryByRole('menuitem', { name: 'Block channel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Leave' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/leave "Physics Study Group"/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Leave' }));

    expect(await screen.findByText('Left channel')).toBeInTheDocument();
    expect(await screen.findByText('You have not joined any channel yet.')).toBeInTheDocument();
  });

  it('shows staff the block, edit and delete actions and blocks a channel', async () => {
    const user = userEvent.setup();
    let blocked = false;
    mockApi(
      readHandlers([], [], []),
      http.get('*/api/group-chat/channels', () => ok([studyGroup({ isBlocked: blocked })])),
      http.patch('*/api/group-chat/channels/:id/block', () => {
        blocked = true;
        return ok(studyGroup({ isBlocked: true }));
      }),
    );
    renderPage(ADMIN);

    await user.click(await screen.findByRole('button', { name: 'Channel actions' }));
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Leave' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Block channel' }));

    expect(await screen.findByText('Channel blocked')).toBeInTheDocument();
    expect(await screen.findByText('Blocked')).toBeInTheDocument();
  });

  it('lets a channel admin approve a join request', async () => {
    const user = userEvent.setup();
    let approved = false;
    const requester = { _id: '64b7f0c2a1b2c3d4e5f6a777', name: 'Karim Ahmed', role: 'Student' };
    const owned = () =>
      rawChannel({
        id: CHANNEL_ID,
        name: 'My Private Room',
        type: 'Private',
        creator: STUDENT,
        members: approved
          ? [
              { user: STUDENT, role: 'Admin' },
              { user: requester, role: 'Member' },
            ]
          : [{ user: STUDENT, role: 'Admin' }],
        requests: approved ? [] : [requester],
      });
    mockApi(
      readHandlers([], [], []),
      http.get('*/api/group-chat/channels', () => ok([owned()])),
      http.post('*/api/group-chat/channels/:id/approve/:userId', () => {
        approved = true;
        return ok(owned());
      }),
    );
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Requests (1)' }));
    const dialog = await screen.findByRole('dialog', { name: 'My Private Room' });
    expect(within(dialog).getByText('Karim Ahmed')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Accept' }));

    expect(await screen.findByText('Join request approved')).toBeInTheDocument();
    expect(await within(dialog).findByText('No pending requests.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('tab', { name: 'Members (2)' }));
    expect(within(dialog).getByText('Karim Ahmed')).toBeInTheDocument();
  });

  it('creates a channel and opens it', async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    const created = rawChannel({
      id: '64b7f0c2a1b2c3d4e5f6c009',
      name: 'Maths Help',
      creator: STUDENT,
      members: [{ user: STUDENT, role: 'Admin' }],
    });
    mockApi(
      readHandlers([]),
      http.get('*/api/group-chat/channels', () => ok(body ? [created] : [])),
      http.post('*/api/group-chat/channels', async ({ request }) => {
        body = await request.json();
        return ok(created);
      }),
    );
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Create Channel' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create Channel' });
    await user.click(within(dialog).getByRole('button', { name: 'Create' }));
    expect(await within(dialog).findByText('This field is required')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/Channel name/), 'Maths Help');
    await user.click(within(dialog).getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Channel created')).toBeInTheDocument();
    expect(body).toEqual({ name: 'Maths Help', description: '', type: 'Public' });
    expect(await screen.findByRole('heading', { name: 'Maths Help' })).toBeInTheDocument();
  });

  it('adds members found by name (emails shown when the backend sends them)', async () => {
    const user = userEvent.setup();
    let added: unknown = null;
    const owned = rawChannel({
      id: CHANNEL_ID,
      name: 'Admins Room',
      creator: ADMIN,
      members: [{ user: ADMIN, role: 'Admin' }],
    });
    mockApi(
      readHandlers([owned], [], []),
      http.get('*/api/group-chat/users/search', () =>
        ok([{ _id: OTHER._id, name: OTHER.name, role: 'Student', email: 'rahim@example.com' }]),
      ),
      http.post('*/api/group-chat/channels/:id/members', async ({ request }) => {
        added = await request.json();
        return ok(owned);
      }),
    );
    renderPage(ADMIN);

    await user.click(await screen.findByRole('button', { name: 'Add Members' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add Members' });
    await user.type(within(dialog).getByRole('textbox', { name: /Search users/ }), 'Rah');
    await user.click(await within(dialog).findByText('Rahim Uddin'));
    expect(within(dialog).getByText('Student - rahim@example.com')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Add Selected (1)' }));

    expect(await screen.findByText('Members added')).toBeInTheDocument();
    expect(added).toEqual({ userIds: [OTHER._id] });
  });
});
