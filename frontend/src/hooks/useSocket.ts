'use client';

import { useContext, useEffect } from 'react';

import { SocketContext } from '@/context/SocketContext';

import type { Socket } from 'socket.io-client';

/** The signed-in user's Socket.io connection, or null (signed out / connecting). */
export const useSocket = (): Socket | null => useContext(SocketContext);

/**
 * Listens to one socket event while the component is mounted (re-subscribes when the connection or the
 * handler changes; pass a stable handler, e.g. from useCallback). Payloads come from the network: check them
 * with a Zod schema before use.
 */
export const useSocketEvent = (event: string, handler: (payload: unknown) => void): void => {
  const socket = useSocket();
  useEffect(() => {
    if (!socket) return undefined;
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
};
