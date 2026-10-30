'use client';

import { useCallback, useState } from 'react';

import { useUrlListParams } from '@/hooks/useUrlListParams';
import { myCoursesParamsSchema } from '@/schemas/student.schema';

export interface MyCoursesSearch {
  /** The search in the address (`?search=`) */
  urlSearch: string;
  /** What is typed right now: the loaded list filters on it at once */
  search: string;
  setSearch: (value: string) => void;
  /** Puts the search in the address (the search box calls it once typing stops) */
  saveSearch: (value: string) => void;
}

/** My Courses search: instant filtering, the address updated after a pause (not on every key). */
export const useMyCoursesSearch = (): MyCoursesSearch => {
  const { params, setParams } = useUrlListParams(myCoursesParamsSchema);
  const [search, setSearch] = useState(params.search);
  const saveSearch = useCallback(
    (value: string) => {
      setParams({ search: value.trim() });
    },
    [setParams],
  );
  return { urlSearch: params.search, search, setSearch, saveSearch };
};
