'use client';

import { useEffect, useRef } from 'react';

/** Stop showing "is typing" to the others this long after the last key press. */
export const TYPING_IDLE_MS = 1200;

export interface TypingEmitter {
  /** Call on every change of the message box. */
  typed: (value: string) => void;
  /** Call after sending. */
  stop: () => void;
}

/**
 * "Is typing" for a chat box (support chat and group chat): tells the others while the user types, and that
 * they stopped after a short pause, after sending, when the conversation changes and when the box unmounts.
 * `emit` must be stable for one conversation (useCallback); a new one ends typing in the old conversation.
 */
export const useTypingEmitter = (emit: (isTyping: boolean) => void): TypingEmitter => {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearTimer = (): void => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  };

  useEffect(
    () => () => {
      if (timer.current !== undefined) clearTimeout(timer.current);
      timer.current = undefined;
      emit(false);
    },
    [emit],
  );

  const stop = (): void => {
    clearTimer();
    emit(false);
  };

  const typed = (value: string): void => {
    emit(value.trim().length > 0);
    clearTimer();
    timer.current = setTimeout(() => {
      timer.current = undefined;
      emit(false);
    }, TYPING_IDLE_MS);
  };

  return { typed, stop };
};
