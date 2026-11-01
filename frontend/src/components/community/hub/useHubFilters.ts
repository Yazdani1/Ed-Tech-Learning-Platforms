'use client';

import { useMemo } from 'react';
import { z } from 'zod';

import { useUrlListParams } from '@/hooks/useUrlListParams';

import type { HubFilters } from '@/api/community.api';

/** Hub filters kept in the address bar (reloads and shared links keep them). */
const hubUrlSchema = z.object({
  channel: z.string().catch(''),
  dateFrom: z.string().catch(''),
  dateTo: z.string().catch(''),
  search: z.string().catch(''),
  archived: z.string().catch(''),
});

export interface HubFilterState {
  filters: HubFilters;
  /** Filters set in the filter panel (channel, dates, archive): shown on the toggle button */
  activeCount: number;
  set: (changes: Partial<HubFilters>) => void;
  clear: () => void;
}

/** Channel, dates, search text and the archive switch of the hub, read from and written to the URL. */
export const useHubFilters = (canViewArchive: boolean): HubFilterState => {
  const { params, setParams } = useUrlListParams(hubUrlSchema);
  const filters = useMemo<HubFilters>(
    () => ({
      channel: params.channel,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      search: params.search,
      // Only Super Admin and Admin may read archived discussions (the backend answers 403 otherwise)
      archived: canViewArchive && params.archived === 'true',
    }),
    [params, canViewArchive],
  );
  const activeCount = [filters.channel, filters.dateFrom, filters.dateTo, filters.archived].filter(
    Boolean,
  ).length;

  return {
    filters,
    activeCount,
    set: (changes) => {
      const { archived, ...rest } = changes;
      setParams(archived === undefined ? rest : { ...rest, archived: archived ? 'true' : '' });
    },
    clear: () => {
      setParams({ channel: '', dateFrom: '', dateTo: '', archived: '' });
    },
  };
};
