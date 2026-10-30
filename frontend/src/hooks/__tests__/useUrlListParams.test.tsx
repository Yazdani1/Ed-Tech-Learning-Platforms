import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { router, setLocation } from '@/test/next-navigation';

import { useUrlListParams } from '../useUrlListParams';

const listSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().catch(''),
  status: z.string().optional(),
});

describe('useUrlListParams', () => {
  it('parses the query with the schema (defaults for missing or bad values)', () => {
    setLocation('/admin/items', '?page=oops&search=algebra');
    const { result } = renderHook(() => useUrlListParams(listSchema));

    expect(result.current.params).toEqual({ page: 1, search: 'algebra' });
  });

  it('goes back to page 1 when a filter changes', () => {
    setLocation('/admin/items', '?page=3&search=alg');
    const { result } = renderHook(() => useUrlListParams(listSchema));

    act(() => {
      result.current.setParams({ search: 'algebra' });
    });

    expect(router.replace).toHaveBeenLastCalledWith('/admin/items?search=algebra', {
      scroll: false,
    });
  });

  it('keeps the other values when only the page changes', () => {
    setLocation('/admin/items', '?search=alg&status=Published');
    const { result } = renderHook(() => useUrlListParams(listSchema));

    act(() => {
      result.current.setParams({ page: 2 });
    });

    expect(router.replace).toHaveBeenLastCalledWith(
      '/admin/items?search=alg&status=Published&page=2',
      { scroll: false },
    );
  });

  it('removes empty, null and undefined values (a bare path when nothing is left)', () => {
    setLocation('/admin/items', '?search=alg&status=Draft');
    const { result } = renderHook(() => useUrlListParams(listSchema));

    act(() => {
      result.current.setParams({ search: '', status: null });
    });
    expect(router.replace).toHaveBeenLastCalledWith('/admin/items', { scroll: false });

    act(() => {
      result.current.setParams({ status: undefined, search: 'x' });
    });
    expect(router.replace).toHaveBeenLastCalledWith('/admin/items?search=x', { scroll: false });
  });
});
