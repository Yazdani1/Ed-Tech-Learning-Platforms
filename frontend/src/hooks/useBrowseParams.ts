'use client';

import { useMemo } from 'react';
import { z } from 'zod';

import { useUrlListParams } from './useUrlListParams';

/** Cards per catalog page (a multiple of 2, 3 and 4, so every grid row is full). */
export const BROWSE_PAGE_SIZE = 12;

/** The catalog filters kept in the address bar (plain values, lists comma-separated, like the backend). */
export const browseUrlSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().catch(''),
  courseTypes: z.string().catch(''),
  categories: z.string().catch(''),
  pricing: z.string().catch(''),
  subscriptionPlans: z.string().catch(''),
});

export type BrowseListKey = 'courseTypes' | 'categories' | 'pricing' | 'subscriptionPlans';

const LIST_KEYS: readonly BrowseListKey[] = [
  'courseTypes',
  'categories',
  'pricing',
  'subscriptionPlans',
];

const toList = (value: string): string[] => value.split(',').filter(Boolean);

export interface BrowseParams {
  page: number;
  search: string;
  selected: Record<BrowseListKey, string[]>;
  activeFilterCount: number;
  /** What GET /api/courses/browse receives */
  query: Record<string, string | number>;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  toggle: (key: BrowseListKey, value: string) => void;
  clearAll: () => void;
}

/** Catalog filters and paging, read from and written to the URL (reloads and shared links keep them). */
export const useBrowseParams = (): BrowseParams => {
  const { params, setParams } = useUrlListParams(browseUrlSchema);

  const selected = useMemo(
    () =>
      Object.fromEntries(LIST_KEYS.map((key) => [key, toList(params[key])])) as Record<
        BrowseListKey,
        string[]
      >,
    [params],
  );

  const query = useMemo(() => {
    const result: Record<string, string | number> = { page: params.page, limit: BROWSE_PAGE_SIZE };
    if (params.search.trim()) result.search = params.search.trim();
    LIST_KEYS.forEach((key) => {
      if (selected[key].length > 0) result[key] = selected[key].join(',');
    });
    return result;
  }, [params.page, params.search, selected]);

  const toggle = (key: BrowseListKey, value: string): void => {
    const current = selected[key];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setParams({ [key]: next.join(',') });
  };

  return {
    page: params.page,
    search: params.search,
    selected,
    activeFilterCount: LIST_KEYS.reduce((total, key) => total + selected[key].length, 0),
    query,
    setSearch: (search) => {
      setParams({ search: search.trim() });
    },
    setPage: (page) => {
      setParams({ page });
    },
    toggle,
    clearAll: () => {
      setParams({
        search: '',
        courseTypes: '',
        categories: '',
        pricing: '',
        subscriptionPlans: '',
      });
    },
  };
};
