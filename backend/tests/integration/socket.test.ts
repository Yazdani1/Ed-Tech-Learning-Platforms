// Socket.io: a real HTTP server with setupSocketIO on a free port, real socket.io-client connections.
import { createServer, type Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';

import { io as connectClient, type Socket as ClientSocket } from 'socket.io-client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { ChatMessage } from '../../src/models/ChatMessage.model';
import { User } from '../../src/models/User.model';
import { setupSocketIO } from '../../src/socket/index';
import { generateToken } from '../../src/utils/jwt';
import { authCookie, createUser } from '../factories';
import { createGroupChannel } from '../factories/community';

import type { Server as IoServer } from 'socket.io';
import type { IUser } from '../../src/models/User.model';

const MAX_CHAT_MESSAGE_LENGTH = 2000;
const WAIT_TIMEOUT_MS = 5000;
const POLL_MS = 20;

let httpServer: HttpServer;
let ioServer: IoServer;
let url: string;
const clients: ClientSocket[] = [];

const tokenOf = (user: IUser): string => generateToken(String(user._id));

/** Opens a client and resolves once connected (rejects on connect_error). */
const connect = (token: string): Promise<ClientSocket> =>
  new Promise((resolve, reject) => {
    const socket = connectClient(url, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });
    clients.push(socket);
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (error) => reject(error));
  });

/** Polls a condition (server-side state) until it is true; fails after WAIT_TIMEOUT_MS. */
const waitFor = async (condition: () => Promise<boolean>): Promise<void> => {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (!(await condition())) {
    if (Date.now() > deadline) throw new Error('Timed out waiting for the condition');
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
};

/** The rooms the user's server-side sockets are in. */
const roomsOf = async (user: IUser): Promise<Set<string>> => {
  const sockets = await ioServer.in(`user:${String(user._id)}`).fetchSockets();
  return new Set(sockets.flatMap((socket) => [...socket.rooms]));
};

const waitUntilInRoom = (user: IUser, room: string): Promise<void> =>
  waitFor(async () => (await roomsOf(user)).has(room));

/**
 * Connects and waits until the server finished its connection setup: the event listeners are registered right
 * after the group rooms are joined, so membership of a group channel is the signal.
 */
const connectReady = async (user: IUser): Promise<ClientSocket> => {
  const channel = await createGroupChannel(user);
  const socket = await connect(tokenOf(user));
  await waitUntilInRoom(user, `group:${String(channel._id)}`);
  return socket;
};

/** Resolves with the first payload of `event` on the socket. */
const nextEvent = <T>(socket: ClientSocket, event: string): Promise<T> =>
  new Promise((resolve) => socket.once(event, (payload: T) => resolve(payload)));

/** Collects every payload of `event` on the socket. */
const record = (socket: ClientSocket, event: string): unknown[] => {
  const received: unknown[] = [];
  socket.on(event, (payload: unknown) => received.push(payload));
  return received;
};

beforeAll(async () => {
  httpServer = createServer();
  ioServer = setupSocketIO(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  url = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  clients.forEach((socket) => socket.disconnect());
  await new Promise<void>((resolve) => {
    ioServer.close(() => resolve());
  });
});

describe('Socket.io authentication', () => {
  it('a valid token connects; no token is refused', async () => {
    const student = await createUser('Student');
    const socket = await connect(tokenOf(student));
    expect(socket.connected).toBe(true);
    await expect(connect('')).rejects.toThrow('Not authorized');
  });

  it('SECURITY: a revoked token (password changed after it was issued) cannot connect', async () => {
    const student = await createUser('Student');
    const token = tokenOf(student);
    const FUTURE_MS = 60_000;
    await User.updateOne(
      { _id: student._id },
      { $set: { passwordChangedAt: new Date(Date.now() + FUTURE_MS) } },
    );
    await expect(connect(token)).rejects.toThrow('Not authorized');
  });
});

describe('Socket.io bad payloads', () => {
  it('malformed groupChat:joinRoom / groupChat:typing payloads do not crash the server', async () => {
    const student = await createUser('Student');
    const socket = await connectReady(student);
    for (const payload of [
      { channelId: 'x' },
      { channelId: {} },
      { channelId: { $ne: null } },
      null,
    ]) {
      socket.emit('groupChat:joinRoom', payload);
      socket.emit('groupChat:typing', payload);
    }
    const other = await connect(tokenOf(await createUser('Student')));
    expect(other.connected).toBe(true);
    expect((await request(app).get('/api/health')).status).toBe(200);
    expect(socket.connected).toBe(true);
  });
});

describe('Socket.io private group channel events', () => {
  it('SECURITY: a Teacher who is not a member gets no typing or message events; a member and an Admin do', async () => {
    const creator = await createUser('Student');
    const member = await createUser('Student');
    const admin = await createUser('Admin');
    const teacher = await createUser('Teacher');
    const channel = await createGroupChannel(creator, [member], { type: 'Private' });
    // The teacher's own public channel proves their connection setup (room joins) has finished.
    const teacherChannel = await createGroupChannel(teacher, [creator]);
    const room = `group:${String(channel._id)}`;
    const teacherRoom = `group:${String(teacherChannel._id)}`;

    const creatorSocket = await connect(tokenOf(creator));
    const memberSocket = await connect(tokenOf(member));
    const adminSocket = await connect(tokenOf(admin));
    const teacherSocket = await connect(tokenOf(teacher));
    await waitUntilInRoom(creator, room);
    await waitUntilInRoom(member, room);
    await waitUntilInRoom(admin, room);
    await waitUntilInRoom(teacher, teacherRoom);
    // Trying to join the private room directly is ignored too.
    teacherSocket.emit('groupChat:joinRoom', { channelId: String(channel._id) });

    const teacherTyping = record(teacherSocket, 'groupChat:typing');
    const teacherMessages = record(teacherSocket, 'groupChat:message');
    const memberTyping = nextEvent<{ channelId: string }>(memberSocket, 'groupChat:typing');
    const adminTyping = nextEvent<{ channelId: string }>(adminSocket, 'groupChat:typing');
    creatorSocket.emit('groupChat:typing', { channelId: String(channel._id), isTyping: true });
    expect((await memberTyping).channelId).toBe(String(channel._id));
    expect((await adminTyping).channelId).toBe(String(channel._id));

    const memberMessage = nextEvent<{ content: string }>(memberSocket, 'groupChat:message');
    const adminMessage = nextEvent<{ content: string }>(adminSocket, 'groupChat:message');
    const sent = await request(app)
      .post(`/api/group-chat/channels/${String(channel._id)}/messages`)
      .set('Cookie', authCookie(creator))
      .send({ content: 'private hello' });
    expect(sent.status).toBe(201);
    expect((await memberMessage).content).toBe('private hello');
    expect((await adminMessage).content).toBe('private hello');

    // Events on one connection arrive in order: once the teacher gets this one, earlier ones would have arrived.
    const marker = nextEvent<{ channelId: string }>(teacherSocket, 'groupChat:typing');
    creatorSocket.emit('groupChat:typing', {
      channelId: String(teacherChannel._id),
      isTyping: true,
    });
    expect((await marker).channelId).toBe(String(teacherChannel._id));
    expect(
      teacherTyping.filter((p) => (p as { channelId: string }).channelId === String(channel._id)),
    ).toEqual([]);
    expect(teacherMessages).toEqual([]);
    expect((await roomsOf(teacher)).has(room)).toBe(false);
  });

  it('SECURITY: leaving, being removed or the channel being blocked takes the user out of the live room', async () => {
    const creator = await createUser('Student');
    const leaver = await createUser('Student');
    const removed = await createUser('Student');
    const admin = await createUser('Admin');
    const channel = await createGroupChannel(creator, [leaver, removed], { type: 'Private' });
    const room = `group:${String(channel._id)}`;
    for (const user of [creator, leaver, removed, admin]) await connect(tokenOf(user));
    for (const user of [creator, leaver, removed, admin]) await waitUntilInRoom(user, room);

    const base = `/api/group-chat/channels/${String(channel._id)}`;
    expect(
      (await request(app).post(`${base}/leave`).set('Cookie', authCookie(leaver))).status,
    ).toBe(200);
    await waitFor(async () => !(await roomsOf(leaver)).has(room));
    const removal = await request(app)
      .delete(`${base}/members/${String(removed._id)}`)
      .set('Cookie', authCookie(creator));
    expect(removal.status).toBe(200);
    await waitFor(async () => !(await roomsOf(removed)).has(room));

    expect(
      (await request(app).patch(`${base}/block`).set('Cookie', authCookie(admin))).status,
    ).toBe(200);
    await waitFor(async () => !(await roomsOf(creator)).has(room));
    expect((await roomsOf(admin)).has(room)).toBe(true);
  });
});

describe('Socket.io support chat', () => {
  it('chat:send with a message over 2000 characters gets chat:error and nothing is saved', async () => {
    const student = await createUser('Student');
    const socket = await connectReady(student);
    const before = await ChatMessage.countDocuments();
    const error = nextEvent<string>(socket, 'chat:error');
    socket.emit('chat:send', { content: 'x'.repeat(MAX_CHAT_MESSAGE_LENGTH + 1) });
    expect(await error).toBe('Message is too long');
    expect(await ChatMessage.countDocuments()).toBe(before);
  });
});
