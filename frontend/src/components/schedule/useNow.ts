'use client';

import { useEffect, useState } from 'react';

const TICK_MS = 1000;

/**
 * The current time, refreshed every second while `running` is true. Clocks compute their value from
 * timestamps with it, so a missed or delayed tick never makes them drift.
 */
export const useNow = (running = true): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);
    return () => {
      window.clearInterval(interval);
    };
  }, [running]);
  return now;
};
