'use client';

import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { createContext, useEffect, useMemo } from 'react';
import { io, type Socket } from 'socket.io-client';

import { useCurrentUser } from '@/api/auth.api';
import { queryKeys } from '@/api/query-keys';
import { getSocketToken } from '@/api/socket.api';

import type { FC, ReactNode } from 'react';

export const SocketContext = createContext<Socket | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

/** First wait before reconnecting after the server closed the connection; doubles per failed try. */
const RECONNECT_BASE_DELAY_MS = 1000;
/** Longest wait between two reconnection tries. */
const RECONNECT_MAX_DELAY_MS = 30_000;
/** socket.io-client gives up for good on this reason (e.g. sockets closed after a password change). */
const SERVER_DISCONNECT = 'io server disconnect';
const PRESENCE_KEY_PART = queryKeys.chat.presence[1];

const socketUrl = (): string => process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';

const createSocket = (): Socket =>
  io(socketUrl(), {
    autoConnect: false,
    transports: ['websocket'],
    auth: (sendAuth) => {
      getSocketToken()
        .then((token) => {
          sendAuth({ token });
        })
        .catch(() => {
          sendAuth({});
        });
    },
  });

/**
 * Events missed while offline are not replayed, so every (re)connection refetches the live data. Presence
 * is skipped: it is never fetched, the server sends a fresh snapshot on connect.
 */
const refetchLiveData = (client: QueryClient): void => {
  void client.invalidateQueries({
    queryKey: queryKeys.chat.all,
    predicate: (query) => query.queryKey[1] !== PRESENCE_KEY_PART,
  });
  void client.invalidateQueries({ queryKey: queryKeys.notifications.all });
  void client.invalidateQueries({ queryKey: queryKeys.groupChat.all });
};

/**
 * Connects the socket and keeps it connected while signed in. socket.io-client retries lost connections by
 * itself, but not after the server closed them ('io server disconnect') or rejected the handshake: then this
 * retries with a growing delay (the auth callback fetches a fresh token each time). Returns the cleanup.
 */
const keepConnected = (socket: Socket, client: QueryClient): (() => void) => {
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const scheduleReconnect = (): void => {
    if (stopped || timer !== undefined) return;
    const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** attempt, RECONNECT_MAX_DELAY_MS);
    attempt += 1;
    timer = setTimeout(() => {
      timer = undefined;
      if (!stopped && !socket.connected) socket.connect();
    }, delay);
  };
  const onConnect = (): void => {
    attempt = 0;
    refetchLiveData(client);
  };
  const onDisconnect = (reason: string): void => {
    if (reason === SERVER_DISCONNECT) scheduleReconnect();
  };
  const onConnectError = (): void => {
    // Still active: the client's own retry loop handles it
    if (!socket.active) scheduleReconnect();
  };

  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);
  socket.on('connect_error', onConnectError);
  socket.connect();
  return () => {
    stopped = true;
    if (timer !== undefined) clearTimeout(timer);
    socket.off('connect', onConnect);
    socket.off('disconnect', onDisconnect);
    socket.off('connect_error', onConnectError);
    socket.disconnect();
  };
};

/**
 * One Socket.io connection per signed-in user (chat, group chat, notifications). The token is fetched
 * from /api/socket-token for every (re)connection, so it is never stored and a token revoked by a
 * password change is replaced by the fresh one automatically. Signed out: no connection.
 */
export const SocketProvider: FC<SocketProviderProps> = ({ children }) => {
  const { data: user } = useCurrentUser();
  const client = useQueryClient();
  const userId = user?._id;
  // Created without connecting (no side effect while rendering); the effect connects and disconnects it.
  const socket = useMemo(() => (userId ? createSocket() : null), [userId]);

  useEffect(() => (socket ? keepConnected(socket, client) : undefined), [socket, client]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
