import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PAGE_SIZE, useClientPagination } from '../useClientPagination';

const rows = (count: number): number[] => Array.from({ length: count }, (_, index) => index + 1);

describe('useClientPagination', () => {
  it('shows 10 rows per page', () => {
    expect(PAGE_SIZE).toBe(10);
    const { result } = renderHook(() => useClientPagination(rows(25)));

    expect(result.current.pageRows).toEqual(rows(10));
    expect(result.current.pagination).toMatchObject({ page: 1, limit: 10, total: 25 });

    act(() => {
      result.current.pagination.onPageChange(3);
    });
    expect(result.current.pageRows).toEqual([21, 22, 23, 24, 25]);
  });

  it('goes back into range when the list shrinks', () => {
    const { result, rerender } = renderHook(({ list }) => useClientPagination(list), {
      initialProps: { list: rows(25) },
    });
    act(() => {
      result.current.pagination.onPageChange(3);
    });

    rerender({ list: rows(12) });

    expect(result.current.pagination.page).toBe(2);
    expect(result.current.pageRows).toEqual([11, 12]);
  });

  it('keeps page 1 for an empty list', () => {
    const { result } = renderHook(() => useClientPagination([]));
    expect(result.current.pageRows).toEqual([]);
    expect(result.current.pagination.page).toBe(1);
  });
});
