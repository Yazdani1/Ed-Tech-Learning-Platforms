'use client';

import { useMemo, useState } from 'react';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export interface CourseSelectFilters {
  search: string;
  category: string;
  visibility: string;
  pricing: string;
}

export interface CourseSelectFilterState {
  filters: CourseSelectFilters;
  set: (key: keyof CourseSelectFilters, value: string) => void;
  /** GET /api/courses params: published courses only, the filled filters */
  params: Record<string, string>;
}

const SEARCH_DELAY_MS = 300;

/** Filter values of the course list (the title search waits for typing to pause). */
export const useCourseSelectFilters = (paidOnly: boolean): CourseSelectFilterState => {
  const [filters, setFilters] = useState<CourseSelectFilters>({
    search: '',
    category: '',
    visibility: '',
    pricing: paidOnly ? 'Paid' : '',
  });
  const search = useDebouncedValue(filters.search, SEARCH_DELAY_MS);
  const params = useMemo(() => {
    const query: Record<string, string> = { status: 'Published' };
    if (search.trim()) query.search = search.trim();
    if (filters.category) query.category = filters.category;
    if (filters.visibility) query.visibility = filters.visibility;
    if (filters.pricing) query.pricing = filters.pricing;
    return query;
  }, [search, filters.category, filters.visibility, filters.pricing]);
  return {
    filters,
    set: (key, value) => {
      setFilters((current) => ({ ...current, [key]: value }));
    },
    params,
  };
};
