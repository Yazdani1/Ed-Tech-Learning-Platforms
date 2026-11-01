'use client';

import { useEffect, useRef, type RefObject } from 'react';

/** Starts loading this far before the end of the list is visible. */
const ROOT_MARGIN = '360px 0px';

/**
 * Calls `onLoadMore` when the returned element scrolls into view (infinite list). Browsers without
 * IntersectionObserver (and tests) use the visible "Load more" button instead.
 */
export const useLoadMoreOnScroll = (
  enabled: boolean,
  onLoadMore: () => void,
): RefObject<HTMLDivElement | null> => {
  const ref = useRef<HTMLDivElement | null>(null);
  const callback = useRef(onLoadMore);

  useEffect(() => {
    callback.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const target = ref.current;
    if (!enabled || !target || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) callback.current();
      },
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [enabled]);

  return ref;
};
