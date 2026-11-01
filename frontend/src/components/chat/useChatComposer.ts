'use client';

import { useCallback, useState } from 'react';

import { useSocket } from '@/hooks/useSocket';
import { useTypingEmitter } from '@/hooks/useTypingEmitter';
import { MAX_CHAT_MESSAGE_LENGTH } from '@/schemas/chat.schema';

export interface ChatComposerState {
  value: string;
  change: (value: string) => void;
  send: () => void;
  canSend: boolean;
}

/**
 * The message box of one conversation: tells the others while the user types (stops after a short pause,
 * on send and when the view closes) and sends with `chat:send`. Staff name the conversation; a student
 * always writes in their own.
 */
export const useChatComposer = (
  conversationId: string | undefined,
  isStaff: boolean,
): ChatComposerState => {
  const socket = useSocket();
  const [value, setValue] = useState('');

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (conversationId) socket?.emit('chat:typing', { conversationId, isTyping });
    },
    [conversationId, socket],
  );

  const typing = useTypingEmitter(emitTyping);

  const change = (next: string): void => {
    setValue(next.slice(0, MAX_CHAT_MESSAGE_LENGTH));
    typing.typed(next);
  };

  const content = value.trim();
  const canSend = content.length > 0 && Boolean(conversationId) && socket !== null;

  const send = (): void => {
    if (!canSend || !conversationId) return;
    typing.stop();
    socket.emit('chat:send', isStaff ? { content, conversationId } : { content });
    setValue('');
  };

  return { value, change, send, canSend };
};
