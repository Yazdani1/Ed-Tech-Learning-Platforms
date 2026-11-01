import { act, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/api/query-keys';

import { SocketProvider } from '../SocketContext';

import type { ReactElement } from 'react';

type Listener = (arg?: unknown) => void;
type AuthCallback = (send: (data: object) => void) => void;

/** A stand-in for a socket.io-client Socket: records calls and lets the test fire events. */
class FakeIoSocket {
  connected = false;
  active = false;
  listeners = new Map<string, Set<Listener>>();
  connect = vi.fn(() => {
    this.active = true;
  });
  disconnect = vi.fn(() => {
    this.active = false;
    this.connected = false;
  });
  on(event: string, listener: Listener): this {
    const set = this.listeners.get(event) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(event, set);
    return this;
  }
  off(event: string, listener: Listener): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }
  fire(event: string, arg?: unknown): void {
    this.listeners.get(event)?.forEach((listener) => {
      listener(arg);
    });
  }
}

const state = vi.hoisted(() => ({
  user: null as { _id: string } | null,
  sockets: [] as unknown[],
  auth: [] as unknown[],
}));

vi.mock('socket.io-client', () => ({
  io: (_url: string, options: { auth: unknown }) => {
    const socket = new FakeIoSocket();
    state.sockets.push(socket);
    state.auth.push(options.auth);
    return socket;
  },
}));
vi.mock('@/api/auth.api', () => ({ useCurrentUser: () => ({ data: state.user }) }));
vi.mock('@/api/socket.api', () => ({ getSocketToken: () => Promise.resolve('fresh-token') }));

const lastSocket = (): FakeIoSocket => {
  const socket = state.sockets.at(-1);
  if (!(socket instanceof FakeIoSocket)) throw new Error('no socket created');
  return socket;
};

const setup = (): { client: QueryClient; rerender: () => void } => {
  const client = new QueryClient();
  const ui = (): ReactElement => (
    <QueryClientProvider client={client}>
      <SocketProvider>
        <span>app</span>
      </SocketProvider>
    </QueryClientProvider>
  );
  const view = render(ui());
  return {
    client,
    rerender: () => {
      view.rerender(ui());
    },
  };
};

describe('SocketProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    state.user = { _id: 'user-1' };
    state.sockets = [];
    state.auth = [];
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not connect while signed out', () => {
    state.user = null;
    setup();
    expect(state.sockets).toHaveLength(0);
  });

  it('connects when signed in, with a token from the auth callback', async () => {
    setup();
    const socket = lastSocket();
    expect(socket.connect).toHaveBeenCalledTimes(1);
    const auth = state.auth.at(-1) as AuthCallback;
    const sent = await new Promise<object>((resolve) => {
      auth(resolve);
    });
    expect(sent).toEqual({ token: 'fresh-token' });
  });

  it('disconnects on sign-out', () => {
    const { rerender } = setup();
    const socket = lastSocket();
    state.user = null;
    rerender();
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it("reconnects with backoff after 'io server disconnect'", () => {
    setup();
    const socket = lastSocket();
    act(() => {
      socket.active = false;
      socket.fire('disconnect', 'io server disconnect');
    });
    expect(socket.connect).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(socket.connect).toHaveBeenCalledTimes(2);
    // A rejected handshake (client no longer active) waits twice as long
    act(() => {
      socket.active = false;
      socket.fire('connect_error', new Error('Authentication error'));
      vi.advanceTimersByTime(1999);
    });
    expect(socket.connect).toHaveBeenCalledTimes(2);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(socket.connect).toHaveBeenCalledTimes(3);
  });

  it('leaves transport drops to the client and does not retry after sign-out', () => {
    const { rerender } = setup();
    const socket = lastSocket();
    act(() => {
      socket.fire('disconnect', 'transport close');
      socket.fire('connect_error', new Error('timeout'));
      vi.advanceTimersByTime(60_000);
    });
    expect(socket.connect).toHaveBeenCalledTimes(1);
    act(() => {
      socket.fire('disconnect', 'io server disconnect');
    });
    state.user = null;
    rerender();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('refetches chat, notification and group chat data on (re)connect, but keeps presence', () => {
    const { client } = setup();
    client.setQueryData(queryKeys.chat.staffConversations, []);
    client.setQueryData(queryKeys.chat.presence, ['student-1']);
    client.setQueryData(queryKeys.notifications.unreadCount, 2);
    client.setQueryData(queryKeys.groupChat.channelLists, []);
    client.setQueryData(queryKeys.schedule.all, []);
    act(() => {
      lastSocket().connected = true;
      lastSocket().fire('connect');
    });
    const invalid = (key: readonly unknown[]): boolean | undefined =>
      client.getQueryState(key)?.isInvalidated;
    expect(invalid(queryKeys.chat.staffConversations)).toBe(true);
    expect(invalid(queryKeys.notifications.unreadCount)).toBe(true);
    expect(invalid(queryKeys.groupChat.channelLists)).toBe(true);
    expect(invalid(queryKeys.chat.presence)).toBe(false);
    expect(invalid(queryKeys.schedule.all)).toBe(false);
  });
});
