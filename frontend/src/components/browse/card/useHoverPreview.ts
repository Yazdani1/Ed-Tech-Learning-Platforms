'use client';

import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useRef, useState } from 'react';

const CLOSE_DELAY_MS = 60;
/** Only real mouse users get the hover preview (phones and tablets open the course directly). */
const HOVER_QUERY = '(hover: hover) and (pointer: fine)';

export interface HoverPreview {
  enabled: boolean;
  anchor: HTMLElement | null;
  open: (element: HTMLElement) => void;
  /** Closes after a short delay, so the pointer can move from the card onto the preview */
  close: () => void;
  keepOpen: () => void;
  closeNow: () => void;
}

/** Open/close state of a course card's hover preview. */
export const useHoverPreview = (): HoverPreview => {
  const enabled = useMediaQuery(HOVER_QUERY);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const keepOpen = (): void => {
    if (timer.current) clearTimeout(timer.current);
  };
  useEffect(() => keepOpen, []);

  return {
    enabled,
    anchor,
    open: (element) => {
      if (!enabled) return;
      keepOpen();
      setAnchor(element);
    },
    close: () => {
      timer.current = setTimeout(() => {
        setAnchor(null);
      }, CLOSE_DELAY_MS);
    },
    keepOpen,
    closeNow: () => {
      setAnchor(null);
    },
  };
};
