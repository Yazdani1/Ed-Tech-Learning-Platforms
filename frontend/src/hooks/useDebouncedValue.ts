'use client';

import { useEffect, useState } from 'react';

/** Wait after the last key press before a search box searches (as the old pages did). */
export const SEARCH_DEBOUNCE_MS = 350;

/** The value, once it stopped changing for `delayMs` (search boxes: one request per pause). */
export const useDebouncedValue = <T>(value: T, delayMs = SEARCH_DEBOUNCE_MS): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs]);
  return debounced;
};
