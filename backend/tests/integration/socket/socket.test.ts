import http from 'http';
import { io as Client, type Socket as ClientSocket } from 'socket.io-client';
import type { Server as SocketServer } from 'socket.io';
import { AddressInfo } from 'net';
import { setupSocketIO, getOnlineStudentIds } from '../../../src/socket/index';
import { ChatConversation } from '../../../src/models/ChatConversation.model';
import { ChatMessage } from '../../../src/models/ChatMessage.model';
import { GroupChatChannel } from '../../../src/models/GroupChatChannel.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';

jest.setTimeout(20000);

const waitFor = <T>(socket: ClientSocket, event: string, timeoutMs = 5000): Promise<T> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeoutMs);
    socket.once(event, (...args) => {
      clearTimeout(timeout);
      resolve(args[0] as T);
    });
  });

const connectClient = async (url: string, token: string): Promise<ClientSocket> => {
  const socket = Client(url, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true,
  });
  await waitFor(socket, 'connect');
  return socket;
};

const connectClientWithCookie = async (url: string, token: string): Promise<ClientSocket> => {
  const socket = Client(url, {
    extraHeaders: { cookie: `token=${encodeURIComponent(token)}` },
    transports: ['websocket'],
    forceNew: true,
  });
  await waitFor(socket, 'connect');
  return socket;
};

const delay = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const disconnectClient = (socket?: ClientSocket) => {
  if (socket?.connected) socket.disconnect();
};

describe('Socket.IO backend', () => {
  let server: http.Server;
  let ioServer: SocketServer;
  let url: string;

  beforeEach((done) => {
    server = http.createServer();
    ioServer = setupSocketIO(server);
    server.listen(0, () => {
      const address = server.address() as AddressInfo;
      url = `http://127.0.0.1:${address.port}`;
      done();
    });
  });

  afterEach((done) => {
    ioServer.close();
    server.close(() => done());
  });

  it('rejects clients without a valid token', async () => {
    const socket = Client(url, { transports: ['websocket'], forceNew: true });
    const error = await waitFor<Error>(socket, 'connect_error');

    expect(error.message).toBe('Not authorized');
    disconnectClient(socket);
  });

  it('rejects malformed and orphaned tokens, and accepts cookie token auth', async () => {
    const malformed = Client(url, {
      auth: { token: 'not-a-real-token' },
      transports: ['websocket'],
      forceNew: true,
    });
    expect((await waitFor<Error>(malformed, 'connect_error')).message).toBe('Not authorized');
    disconnectClient(malformed);

    const deletedUser = await createTestUser({ role: 'Student', email: 'deleted.socket@example.com' });
    const deletedToken = authHeaderFor(deletedUser).Authorization.replace('Bearer ', '');
    await deletedUser.deleteOne();
    const orphaned = Client(url, {
      auth: { token: deletedToken },
      transports: ['websocket'],
      forceNew: true,
    });
    expect((await waitFor<Error>(orphaned, 'connect_error')).message).toBe('Not authorized');
    disconnectClient(orphaned);

    const student = await createTestUser({ role: 'Student', email: 'cookie.socket@example.com' });
    const cookieToken = authHeaderFor(student).Authorization.replace('Bearer ', '');
    const cookieSocket = await connectClientWithCookie(url, cookieToken);
    expect(cookieSocket.connected).toBe(true);
    disconnectClient(cookieSocket);
  });

  it('connects students and staff, sends chat messages, typing events, read events, and updates presence', async () => {
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const staff = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const studentToken = authHeaderFor(student).Authorization.replace('Bearer ', '');
    const staffToken = authHeaderFor(staff).Authorization.replace('Bearer ', '');

    const staffSocket = await connectClient(url, staffToken);
    const onlinePresencePromise = waitFor<{ studentId: string; isOnline: boolean }>(staffSocket, 'chat:presence');
    const studentSocket = await connectClient(url, studentToken);
    const onlinePresence = await onlinePresencePromise;

    expect(onlinePresence).toEqual({ studentId: String(student._id), isOnline: true });
    expect(getOnlineStudentIds()).toContain(String(student._id));

    const conversation = await ChatConversation.findOne({ student: student._id });
    expect(conversation).not.toBeNull();

    const staffMessagePromise = waitFor<Record<string, unknown>>(staffSocket, 'chat:message');
    studentSocket.emit('chat:send', { content: 'Hello support' });
    const staffMessage = await staffMessagePromise;
    expect(staffMessage.content).toBe('Hello support');
    expect(await ChatMessage.countDocuments({ conversationId: conversation!._id })).toBe(1);

    const studentTypingPromise = waitFor<Record<string, unknown>>(staffSocket, 'chat:typing');
    studentSocket.emit('chat:typing', { isTyping: true });
    expect((await studentTypingPromise).isTyping).toBe(true);

    const studentMessagePromise = waitFor<Record<string, unknown>>(studentSocket, 'chat:message');
    staffSocket.emit('chat:send', {
      conversationId: String(conversation!._id),
      content: 'Hi student',
    });
    expect((await studentMessagePromise).content).toBe('Hi student');

    const staffTypingPromise = waitFor<Record<string, unknown>>(studentSocket, 'chat:typing');
    staffSocket.emit('chat:typing', { conversationId: String(conversation!._id), isTyping: true });
    expect((await staffTypingPromise).userRole).toBe('Admin');

    const staffUpdatePromise = waitFor(staffSocket, 'chat:conversationUpdated');
    staffSocket.emit('chat:markRead', { conversationId: String(conversation!._id) });
    await staffUpdatePromise;

    studentSocket.emit('chat:markRead', { conversationId: String(conversation!._id) });
    await delay(50);

    const offlinePresencePromise = waitFor<{ studentId: string; isOnline: boolean }>(staffSocket, 'chat:presence');
    studentSocket.disconnect();
    expect(await offlinePresencePromise).toEqual({ studentId: String(student._id), isOnline: false });

    disconnectClient(staffSocket);
  });

  it('keeps a student online until their last socket disconnects', async () => {
    const student = await createTestUser({ role: 'Student', email: 'multi.socket@example.com' });
    const staff = await createTestUser({ role: 'Admin', email: 'multi.admin.socket@example.com' });
    const studentToken = authHeaderFor(student).Authorization.replace('Bearer ', '');
    const staffToken = authHeaderFor(staff).Authorization.replace('Bearer ', '');

    const staffSocket = await connectClient(url, staffToken);
    const firstOnlinePromise = waitFor<{ studentId: string; isOnline: boolean }>(staffSocket, 'chat:presence');
    const firstStudentSocket = await connectClient(url, studentToken);
    await firstOnlinePromise;

    const secondStudentSocket = await connectClient(url, studentToken);
    expect(getOnlineStudentIds()).toContain(String(student._id));

    secondStudentSocket.disconnect();
    await delay(50);
    expect(getOnlineStudentIds()).toContain(String(student._id));

    const offlinePresencePromise = waitFor<{ studentId: string; isOnline: boolean }>(staffSocket, 'chat:presence');
    firstStudentSocket.disconnect();
    expect(await offlinePresencePromise).toEqual({ studentId: String(student._id), isOnline: false });

    disconnectClient(staffSocket);
  });

  it('handles group room join and typing authorization', async () => {
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const staff = await createTestUser({ role: 'Moderator', email: 'moderator@example.com' });
    const studentToken = authHeaderFor(student).Authorization.replace('Bearer ', '');
    const staffToken = authHeaderFor(staff).Authorization.replace('Bearer ', '');
    const channel = await GroupChatChannel.create({
      name: 'Socket Group',
      type: 'Public',
      creator: student._id,
      members: [{ user: student._id, role: 'Admin', unreadCount: 0, joinedAt: new Date() }],
    });

    const studentSocket = await connectClient(url, studentToken);
    const staffSocket = await connectClient(url, staffToken);

    studentSocket.emit('groupChat:joinRoom', { channelId: String(channel._id) });
    staffSocket.emit('groupChat:joinRoom', { channelId: String(channel._id) });

    const typingPromise = waitFor<Record<string, unknown>>(staffSocket, 'groupChat:typing');
    studentSocket.emit('groupChat:typing', { channelId: String(channel._id), isTyping: true });
    const typing = await typingPromise;

    expect(typing).toMatchObject({
      channelId: String(channel._id),
      userId: String(student._id),
      userName: student.name,
      userRole: 'Student',
      isTyping: true,
    });

    disconnectClient(studentSocket);
    disconnectClient(staffSocket);
  });

  it('ignores unauthorized or incomplete socket events without crashing', async () => {
    const student = await createTestUser({ role: 'Student', email: 'ignored.socket@example.com' });
    const outsider = await createTestUser({ role: 'Student', email: 'outside.socket@example.com' });
    const studentToken = authHeaderFor(student).Authorization.replace('Bearer ', '');
    const outsiderToken = authHeaderFor(outsider).Authorization.replace('Bearer ', '');
    const channel = await GroupChatChannel.create({
      name: 'Blocked Socket Group',
      type: 'Private',
      creator: student._id,
      isBlocked: true,
      members: [{ user: student._id, role: 'Admin', unreadCount: 0, joinedAt: new Date() }],
    });

    const studentSocket = await connectClient(url, studentToken);
    const outsiderSocket = await connectClient(url, outsiderToken);

    studentSocket.emit('chat:send', { content: '   ' });
    studentSocket.emit('chat:typing', {});
    studentSocket.emit('chat:markRead', {});
    studentSocket.emit('groupChat:joinRoom', {});
    studentSocket.emit('groupChat:joinRoom', { channelId: String(channel._id) });
    outsiderSocket.emit('groupChat:joinRoom', { channelId: String(channel._id) });
    studentSocket.emit('groupChat:typing', {});
    studentSocket.emit('groupChat:typing', { channelId: String(channel._id), isTyping: true });
    outsiderSocket.emit('groupChat:typing', { channelId: String(channel._id), isTyping: true });
    studentSocket.emit('groupChat:joinRoom', { channelId: String(new Date().getTime()).padStart(24, '0') });

    await delay(100);
    expect(studentSocket.connected).toBe(true);
    expect(outsiderSocket.connected).toBe(true);

    disconnectClient(studentSocket);
    disconnectClient(outsiderSocket);
  });
});
