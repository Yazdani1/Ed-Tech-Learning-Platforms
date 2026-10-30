'use client';

import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useState } from 'react';

import type { FocusEvent } from 'react';

const SLIDE_INTERVAL_MS = 5000;

export interface HeroAutoplay {
  /** Index of the image shown (always within the list) */
  current: number;
  select: (index: number) => void;
  /** The slideshow moves on by itself (the user's choice; off by default with reduced motion) */
  playing: boolean;
  togglePlaying: () => void;
  /** Spread on the slider: hovering it or focusing a control inside holds the current image */
  holdHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: (event: FocusEvent<HTMLElement>) => void;
  };
}

/** Auto-advancing slides that stop on hover/focus, on request, and when the viewer prefers less motion. */
export const useHeroAutoplay = (count: number): HeroAutoplay => {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [active, setActive] = useState(0);
  const [playChoice, setPlayChoice] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const playing = playChoice ?? !reducedMotion;
  const running = playing && !hovered && !focused && count > 1;

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % count);
    }, SLIDE_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [running, count]);

  return {
    current: count > 0 ? active % count : 0,
    select: setActive,
    playing,
    togglePlaying: () => {
      setPlayChoice(!playing);
    },
    holdHandlers: {
      onMouseEnter: () => {
        setHovered(true);
      },
      onMouseLeave: () => {
        setHovered(false);
      },
      onFocus: () => {
        setFocused(true);
      },
      onBlur: (event) => {
        // Focus moving between the slider's own buttons keeps it held
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      },
    },
  };
};
