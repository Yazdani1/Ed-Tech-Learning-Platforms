'use client';

import { useState } from 'react';

/**
 * Runs `onOpen` during render when `open` turns true, so a dialog's local state starts from the item it
 * shows (React's "adjust state while rendering" pattern; no effect, no extra render pass).
 */
export const useOnOpen = (open: boolean, onOpen: () => void): void => {
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) onOpen();
  }
};
