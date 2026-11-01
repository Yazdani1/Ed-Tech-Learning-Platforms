'use client';

import { useEffect } from 'react';

// How many chat views (the chat page, the open widget) show a student's conversation right now. While one
// is open, staff replies are read at once, so the unread badge must not count them.
let openViews = 0;

export const isChatViewOpen = (): boolean => openViews > 0;

/** Registers the calling view as "showing the conversation" while `active` is true. */
export const useChatViewOpen = (active: boolean): void => {
  useEffect(() => {
    if (!active) return undefined;
    openViews += 1;
    return () => {
      openViews -= 1;
    };
  }, [active]);
};
