'use client';

import { useEffect, useRef } from 'react';

import { reportPortalActivity } from '@/api/auth.api';

/** One report a minute (the backend accepts 1-120 seconds and never credits more than the time passed) */
const TICK_MS = 60_000;
/** No click, key, scroll or touch for this long = away (a long video still counts while it plays) */
const IDLE_MS = 10 * 60_000;
const MS_PER_SECOND = 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const;

const isVideoPlaying = (): boolean =>
  Array.from(document.querySelectorAll('video')).some((video) => !video.paused && !video.ended);

/**
 * Counts a signed-in student's time on the portal: every minute the tab is visible and in use (recent input
 * or a playing video), the seconds since the last tick are reported. Hidden or idle tabs add nothing.
 */
export const usePortalTimeTracker = (enabled: boolean): void => {
  const lastInput = useRef(0);
  const lastTick = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const markActive = (): void => {
      lastInput.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((name) => {
      window.addEventListener(name, markActive, { passive: true });
    });
    lastTick.current = Date.now();
    lastInput.current = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.min(
        Math.round((now - lastTick.current) / MS_PER_SECOND),
        TICK_MS / MS_PER_SECOND,
      );
      lastTick.current = now;
      const inUse =
        document.visibilityState === 'visible' &&
        (now - lastInput.current < IDLE_MS || isVideoPlaying());
      // A failed report is simply lost (a minute at most)
      if (inUse && elapsed > 0) reportPortalActivity(elapsed).catch(() => undefined);
    }, TICK_MS);
    return () => {
      window.clearInterval(timer);
      ACTIVITY_EVENTS.forEach((name) => {
        window.removeEventListener(name, markActive);
      });
    };
  }, [enabled]);
};
