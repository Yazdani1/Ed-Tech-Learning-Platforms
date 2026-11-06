'use client';

import { useState } from 'react';

/** Items per page of every list (pagination shows only above this many). */
export const PAGE_SIZE = 10;

export interface ClientPagination<T> {
  /** The rows of the current page */
  pageRows: T[];
  pagination: { page: number; limit: number; total: number; onPageChange: (page: number) => void };
}

/**
 * Pages a list the browser already has (10 per page). The page goes back into range when the list shrinks
 * (e.g. a filter), so it never shows an empty page.
 */
export const useClientPagination = <T>(
  rows: readonly T[],
  limit = PAGE_SIZE,
): ClientPagination<T> => {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(Math.ceil(rows.length / limit), 1);
  const current = Math.min(page, pageCount);
  return {
    pageRows: rows.slice((current - 1) * limit, current * limit),
    pagination: { page: current, limit, total: rows.length, onPageChange: setPage },
  };
};
