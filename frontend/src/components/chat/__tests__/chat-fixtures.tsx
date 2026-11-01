import { act } from '@testing-library/react';
import { vi } from 'vitest';

import { SocketContext } from '@/context/SocketContext';
import { makeUser } from '@/test/msw/handlers';
import { renderWithProviders, type ProvidersRenderResult } from '@/test/render';

import type { ReactElement } from 'react';
import type { Socket } from 'socket.io-client';

type Handler = (payload: unknown) => void;

/** A stand-in Socket.io client: records what the app emits and lets a test play server events. */
export class FakeSocket {
  private handlers = new Map<string, Set<Handler>>();
  readonly emit = vi.fn();

  on(event: string, handler: Handler): this {
    const set = this.handlers.get(event) ?? new Set<Handler>();
    set.add(handler);
    this.handlers.set(event, set);
    return this;
  }

  off(event: string, handler: Handler): this {
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  /** The server sends this event to the client. */
  serverEmit(event: string, payload: unknown): void {
    act(() => {
      this.handlers.get(event)?.forEach((handler) => {
        handler(payload);
      });
    });
  }

  /** The payloads the app emitted for this event. */
  emitted(event: string): unknown[] {
    return this.emit.mock.calls
      .filter(([name]) => name === event)
      .map(([, payload]: unknown[]) => payload);
  }

  asSocket(): Socket {
    // Only on/off/emit are used by the app's hooks
    return this as unknown as Socket;
  }
}

export const renderWithSocket = (ui: ReactElement, socket: FakeSocket): ProvidersRenderResult =>
  renderWithProviders(
    <SocketContext.Provider value={socket.asSocket()}>{ui}</SocketContext.Provider>,
  );

export const objectId = (suffix: string): string =>
  `64b7f0c2a1b2c3d4e5f6${suffix.padStart(4, '0')}`;

export const STUDENT = makeUser('Student');
export const ADMIN = makeUser('Admin');
export const TEACHER = makeUser('Teacher');

export const CONVERSATION_ID = objectId('7001');

export const conversation = (overrides: Record<string, unknown> = {}) => ({
  _id: CONVERSATION_ID,
  student: {
    _id: STUDENT._id,
    name: 'Asha Rahman',
    avatar: '',
    email: 'asha@example.com',
  },
  unreadByStaff: 2,
  unreadByStudent: 0,
  lastMessage: 'I need help',
  lastMessageAt: '2026-10-20T10:00:00.000Z',
  ...overrides,
});

export const message = (overrides: Record<string, unknown> = {}) => ({
  _id: objectId('8001'),
  conversationId: CONVERSATION_ID,
  senderId: STUDENT._id,
  senderName: 'Asha Rahman',
  senderRole: 'Student',
  senderAvatar: '',
  content: 'I need help',
  createdAt: '2026-10-20T10:00:00.000Z',
  ...overrides,
});
