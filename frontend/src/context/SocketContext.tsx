'use client';

import { createContext, useEffect, useMemo } from 'react';
import { io, type Socket } from 'socket.io-client';

import { useCurrentUser } from '@/api/auth.api';
import { getSocketToken } from '@/api/socket.api';

import type { FC, ReactNode } from 'react';

export const SocketContext = createContext<Socket | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

const socketUrl = (): string => process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';

/**
 * One Socket.io connection per signed-in user (chat, group chat, notifications). The token is fetched
 * from /api/socket-token for every (re)connection, so it is never stored and a token revoked by a
 * password change is replaced by the fresh one automatically. Signed out: no connection.
 */
export const SocketProvider: FC<SocketProviderProps> = ({ children }) => {
  const { data: user } = useCurrentUser();
  const userId = user?._id;
  // Created without connecting (no side effect while rendering); the effect connects and disconnects it.
  const socket = useMemo(
    () =>
      userId
        ? io(socketUrl(), {
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
          })
        : null,
    [userId],
  );

  useEffect(() => {
    if (!socket) return undefined;
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
